/**
 * Control de salud AUTO-REPARADOR de todas las cards (pensado para correr a diario).
 *
 * Para cada cuento revisa: autor, portada, capítulo, audio (accesible + no
 * vacío + no cortado), read-along (paragraph_timings) y subtítulos en Storage.
 * Si algo falla → intenta arreglarlo solo (regenera lo que haga falta) →
 * vuelve a chequear → SOLO si sigue roto, lo junta y manda UN email.
 *
 * Uso:  node scripts/health-check.mjs
 *
 * Secrets/env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
 *              RESEND_API_KEY (opcional), EPOVOX_ALERT_EMAIL (opcional).
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { AUTHORS } from './catalog-ciudadseva.mjs';

const dir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(dir, '..');
const envFile = readFileSync(resolve(dir, '../.env.local'), 'utf8');
const env = Object.fromEntries(
  envFile.split('\n').filter(l => l.includes('=')).map(l => {
    const [k, ...v] = l.split('=');
    return [k.trim(), v.join('=').trim()];
  })
);
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const authorMeta = Object.fromEntries(AUTHORS.map(a => [a.slug, a]));

function run(cmd, extraEnv = {}) {
  try {
    execSync(cmd, { cwd: repoRoot, stdio: 'inherit', env: { ...process.env, ...extraEnv } });
    return true;
  } catch (e) {
    console.warn(`  ! Falló: ${cmd} (${e.message})`);
    return false;
  }
}

// ── Checks de una card ─────────────────────────────────────────────────────
async function checkWork(w) {
  const issues = [];
  if (!w.author_id) issues.push('sin-autor');
  if (!w.cover_gradient_from) issues.push('sin-portada');

  const { data: ch } = await supabase.from('chapters')
    .select('audio_url, content, paragraph_timings')
    .eq('work_id', w.id).eq('chapter_number', 1).eq('lang', 'es').maybeSingle();

  if (!ch) { issues.push('sin-capitulo'); return issues; }
  if (!ch.audio_url) issues.push('sin-audio');
  if (!ch.content || ch.content.trim().length < 200) issues.push('sin-texto');

  const paras = (ch.content ?? '').split('\n\n').map(p => p.trim()).filter(p => p.length > 20);
  const timings = ch.paragraph_timings ?? [];
  if (!Array.isArray(timings) || timings.length === 0) issues.push('sin-timings');
  else {
    const monotonic = timings.every((t, i) => i === 0 || t >= timings[i - 1]);
    if (!monotonic || Math.abs(timings.length - paras.length) > 2) issues.push('timings-rotos');
  }

  // Audio accesible + tamaño + no cortado
  if (ch.audio_url) {
    try {
      const res = await fetch(ch.audio_url, { method: 'HEAD' });
      if (!res.ok) issues.push('audio-inaccesible');
      else {
        const bytes = Number(res.headers.get('content-length') ?? 0);
        if (bytes <= 0) issues.push('audio-vacio');
        else {
          // ~96 kbps mono ≈ 12 KB/s. Narración ES ≈ 2.3 palabras/seg.
          const audioSec = bytes / 12000;
          const words = (ch.content ?? '').split(/\s+/).filter(Boolean).length;
          const expectedSec = words / 2.3;
          if (expectedSec > 30 && audioSec < expectedSec * 0.6) issues.push('audio-cortado');
        }
      }
    } catch { issues.push('audio-inaccesible'); }
  }

  // Subtítulos en Storage
  const { data: subList } = await supabase.storage.from('subtitles').list(w.slug).catch(() => ({ data: [] }));
  const names = (subList ?? []).map(o => o.name);
  if (!names.includes('es.srt') || !names.includes('es.vtt')) issues.push('sin-subtitulos');

  return issues;
}

// ── Intento de reparación ──────────────────────────────────────────────────
async function heal(w, issues) {
  console.log(`  reparando ${w.slug}: ${issues.join(', ')}`);
  const meta = authorMeta[w.author_slug] ?? {};
  const genero = meta.voiceEs === 'es-AR-ElenaNeural' ? 'mujer' : 'hombre';

  // Portada faltante → reasignar gradiente del catálogo (o default).
  if (issues.includes('sin-portada')) {
    await supabase.from('works').update({
      cover_gradient_from: meta.coverFrom ?? '#1A1816',
      cover_gradient_to: meta.coverTo ?? '#0D0C0B',
    }).eq('id', w.id);
  }

  // Problemas de contenido/audio/timings → borrar capítulo malo y regenerar.
  const regen = ['sin-capitulo', 'sin-audio', 'sin-texto', 'sin-timings',
                 'timings-rotos', 'audio-inaccesible', 'audio-vacio', 'audio-cortado', 'sin-autor'];
  if (issues.some(i => regen.includes(i))) {
    await supabase.from('chapters').delete()
      .eq('work_id', w.id).eq('chapter_number', 1).eq('lang', 'es');
    run('node scripts/setup-ciudadseva-db.mjs');            // re-asegura autor + work
    run(`node scripts/seed-ciudadseva.mjs ${w.slug}`);      // regenera audio + timings
    run(`node scripts/make-subtitles.mjs ${w.slug} es`, { EPOVOX_GENERO: genero });
  } else if (issues.includes('sin-subtitulos')) {
    run(`node scripts/make-subtitles.mjs ${w.slug} es`, { EPOVOX_GENERO: genero });
  }
}

// ── Email (solo si queda algo roto) ────────────────────────────────────────
async function sendEmail(stillBroken) {
  const key = env.RESEND_API_KEY;
  const to = env.EPOVOX_ALERT_EMAIL || 'brunomariaok@gmail.com';
  const rows = stillBroken.map(b =>
    `<li><b>${b.title}</b> (<code>${b.slug}</code>): ${b.issues.join(', ')}</li>`).join('');
  const html = `<h2>Epovox — cards que no pude reparar solo</h2>
    <p>El control de salud intentó arreglarlas y siguen rotas. Necesitan tu mano:</p>
    <ul>${rows}</ul>
    <p>Probable causa: el cuento no está en el catálogo (sin fuente para regenerar) o la fuente cambió.</p>`;

  if (!key) {
    console.warn('Sin RESEND_API_KEY — no envío email. Cards rotas:');
    stillBroken.forEach(b => console.warn(`  ${b.slug}: ${b.issues.join(', ')}`));
    return;
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: env.RESEND_FROM_EMAIL || 'Epovox <onboarding@resend.dev>',
      to, subject: `Epovox: ${stillBroken.length} card(s) rota(s) sin reparar`, html,
    }),
  });
  if (!res.ok) console.error('Resend error', res.status, await res.text());
  else console.log(`Email enviado a ${to} (${stillBroken.length} cards).`);
}

// ── Main ───────────────────────────────────────────────────────────────────
const { data: works } = await supabase.from('works')
  .select('id, slug, title, author_id, cover_gradient_from, authors(slug)')
  .eq('type', 'story');

console.log(`Revisando ${works?.length ?? 0} cards...\n`);

const stillBroken = [];
let healed = 0;

for (const w of works ?? []) {
  w.author_slug = w.authors?.slug;
  const issues = await checkWork(w);
  if (issues.length === 0) continue;

  console.log(`⚠ ${w.slug}: ${issues.join(', ')}`);
  await heal(w, issues);
  const remaining = await checkWork(w);

  if (remaining.length === 0) { healed++; console.log(`  ✓ reparada`); }
  else { stillBroken.push({ slug: w.slug, title: w.title, issues: remaining }); console.log(`  ✗ sigue rota: ${remaining.join(', ')}`); }
}

console.log(`\n──────────────────────────────`);
console.log(`Reparadas solas: ${healed}  ·  Siguen rotas: ${stillBroken.length}`);

if (stillBroken.length > 0) await sendEmail(stillBroken);
else console.log('✓ Todas las cards sanas.');
