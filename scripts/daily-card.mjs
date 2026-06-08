/**
 * Agrega UNA card nueva por corrida (pensado para correr 1 vez por día).
 *
 * La "cola" es el catálogo: toma el próximo cuento de STORIES que todavía
 * NO tiene capítulo cargado, asegura las filas (setup), genera audio +
 * read-along (seed) y los subtítulos (.srt/.vtt + Storage).
 *
 * Cuando la cola se vacía, avisa para que sumemos más cuentos al catálogo.
 *
 * Uso:  node scripts/daily-card.mjs
 *
 * Requiere .env.local con NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY.
 * (En GitHub Actions el workflow crea ese archivo desde los Secrets.)
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { AUTHORS, STORIES } from './catalog-ciudadseva.mjs';

const dir = dirname(fileURLToPath(import.meta.url));
const envFile = readFileSync(resolve(dir, '../.env.local'), 'utf8');
const env = Object.fromEntries(
  envFile.split('\n').filter(l => l.includes('=')).map(l => {
    const [k, ...v] = l.split('=');
    return [k.trim(), v.join('=').trim()];
  })
);
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const authorMeta = Object.fromEntries(AUTHORS.map(a => [a.slug, a]));
const generoDe = slug => (authorMeta[slug]?.voiceEs === 'es-AR-ElenaNeural' ? 'mujer' : 'hombre');

function run(cmd, extraEnv = {}) {
  console.log('> ' + cmd);
  execSync(cmd, { cwd: resolve(dir, '..'), stdio: 'inherit', env: { ...process.env, ...extraEnv } });
}

// ── 1. ¿Qué cuentos ya tienen capítulo? ────────────────────────────────────
const { data: works } = await supabase.from('works').select('id, slug');
const workBySlug = Object.fromEntries((works ?? []).map(w => [w.slug, w.id]));

const { data: chs } = await supabase
  .from('chapters').select('work_id').eq('chapter_number', 1).eq('lang', 'es');
const haveChapter = new Set((chs ?? []).map(c => c.work_id));

// ── 2. Próximo pendiente de la cola ────────────────────────────────────────
const pending = STORIES
  .filter(s => !s.skipIfExists)
  .filter(s => !(workBySlug[s.slug] && haveChapter.has(workBySlug[s.slug])));

// Prioridad: autoras mujeres primero (sort estable → conserva el orden interno)
const esMujer = slug => authorMeta[slug]?.gender === 'F';
pending.sort((a, b) => (esMujer(a.authorSlug) ? 0 : 1) - (esMujer(b.authorSlug) ? 0 : 1));

const mujeresPend = pending.filter(s => esMujer(s.authorSlug)).length;
console.log(`Cola: ${pending.length} pendiente(s) · ${mujeresPend} de autoras mujeres (primero).`);

if (pending.length === 0) {
  console.log('✓ Cola vacía — no hay cuentos nuevos para cargar.');
  console.log('  Sumá más a STORIES en scripts/catalog-ciudadseva.mjs (Bot 01) y volvé a correr.');
  process.exit(0);
}

const story = pending[0];
const genero = generoDe(story.authorSlug);
console.log(`\n→ Card de hoy: "${story.title}" (${story.authorSlug}, ${genero})\n`);

// ── 3. Asegurar SOLO el autor + work de este cuento (no toca el resto) ──────
const a = authorMeta[story.authorSlug];
if (a) {
  await supabase.from('authors').upsert({
    slug: a.slug, name: a.name, nationality: a.nationality,
    born_year: a.born_year, died_year: a.died_year, bio: a.bio,
    ...(a.photo ? { photo_url: a.photo } : {}),
  }, { onConflict: 'slug' });
}
const { data: authorRow } = await supabase.from('authors').select('id').eq('slug', story.authorSlug).maybeSingle();

// upsert del work solo si no existe (no pisa ediciones de admin de obras ya cargadas)
if (!workBySlug[story.slug]) {
  await supabase.from('works').upsert({
    slug: story.slug, title: story.title, type: 'story',
    author_id: authorRow?.id, language: 'es', year: story.year,
    description: story.description, genre: a?.genre ?? ['Clásico'],
    cover_gradient_from: a?.coverFrom ?? '#1A1816', cover_gradient_to: a?.coverTo ?? '#0D0C0B',
    featured: false, translation_slug: null,
  }, { onConflict: 'slug' });
}

// ── 4. audio + read-along → subtítulos ─────────────────────────────────────
try {
  run(`node scripts/seed-ciudadseva.mjs ${story.slug}`); // audio + paragraph_timings + upload
} catch (e) {
  console.error(`\n✗ Error en seed para ${story.slug}: ${e.message ?? e}`);
  console.error('  El cuento no se pudo procesar. Revisá los logs de arriba para el detalle.');
  process.exit(1);
}

// Solo generar subtítulos si el capítulo quedó guardado en la DB
const { data: savedChapter } = await supabase
  .from('chapters').select('id').eq('work_id', workBySlug[story.slug] ?? '')
  .eq('chapter_number', 1).eq('lang', 'es').maybeSingle();

if (savedChapter) {
  try {
    run(`node scripts/make-subtitles.mjs ${story.slug} es`, { EPOVOX_GENERO: genero });
  } catch (e) {
    console.warn(`  Advertencia: no se pudieron generar subtítulos para ${story.slug}: ${e.message ?? e}`);
    // No falla el job por los subtítulos — el audio ya está cargado
  }
} else {
  console.warn(`  Advertencia: el capítulo no quedó en la DB, saltando subtítulos.`);
}

console.log(`\n✓ Card agregada: ${story.slug}. Quedan ${pending.length - 1} en la cola.`);
