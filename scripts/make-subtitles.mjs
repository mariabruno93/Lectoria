/**
 * Genera subtítulos .srt y .vtt para un capítulo ya cargado en la DB.
 *
 * Lo usa el Bot 03 (Subtítulos) de la suite Epovox. NO toca la app.
 *
 * Esta versión de msedge-tts (2.0.5) NO expone timings palabra-por-palabra
 * (no devuelve metadataStream). Así que los tiempos se calculan por
 * PROPORCIÓN: posición del texto en el cuento × duración del MP3. Es el
 * mismo criterio que usa el read-along de la app (estimación por chars) y
 * no requiere re-sintetizar audio.
 *
 * Uso:
 *   node scripts/make-subtitles.mjs <workSlug> [lang]
 *
 * Salida:
 *   scripts/subtitles/<workSlug>.<lang>.srt  + .vtt   (local)
 *   Storage bucket "subtitles": <workSlug>/<lang>.srt + .vtt
 */
import { createClient } from '@supabase/supabase-js';
import { writeFileSync, mkdirSync, readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const dir = dirname(fileURLToPath(import.meta.url));
const envFile = readFileSync(resolve(dir, '../.env.local'), 'utf8');
const env = Object.fromEntries(
  envFile.split('\n').filter(l => l.includes('=')).map(l => {
    const [k, ...v] = l.split('=');
    return [k.trim(), v.join('=').trim()];
  })
);
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const workSlug = process.argv[2];
const lang = (process.argv[3] || 'es').toLowerCase();
if (!workSlug) {
  console.error('Uso: node scripts/make-subtitles.mjs <workSlug> [lang]');
  process.exit(1);
}

// Limpieza idéntica a la del seed (para que el texto calce con el audio)
function cleanForTTS(text) {
  return text
    .replace(/\r\n/g, '\n').replace(/\f/g, '\n')
    .replace(/_([^_\n]+)_/g, '$1').replace(/_/g, '')
    .replace(/\*\*([^*\n]+)\*\*/g, '$1')
    .replace(/^\s*\*[\s*]+\*\s*$/gm, '')
    .replace(/([^\n])\n([^\n])/g, '$1 $2')
    .replace(/ {2,}/g, ' ').replace(/\n{3,}/g, '\n\n')
    .trim();
}

function fmt(sec, sep) {
  const t = Math.max(0, Math.round(sec * 1000));
  const h = String(Math.floor(t / 3600000)).padStart(2, '0');
  const m = String(Math.floor((t % 3600000) / 60000)).padStart(2, '0');
  const s = String(Math.floor((t % 60000) / 1000)).padStart(2, '0');
  const mil = String(t % 1000).padStart(3, '0');
  return `${h}:${m}:${s}${sep}${mil}`;
}

// ── 1. Traer el capítulo (texto + audio) ───────────────────────────────────
const { data: work } = await supabase
  .from('works').select('id, slug').eq('slug', workSlug).single();
if (!work) { console.error(`No existe el work "${workSlug}"`); process.exit(1); }

const { data: chapter } = await supabase
  .from('chapters').select('content, audio_url')
  .eq('work_id', work.id).eq('chapter_number', 1).eq('lang', lang).maybeSingle();
if (!chapter?.content) {
  console.error(`No hay content para ${workSlug} (${lang}). Corré primero el seed (Bot 02).`);
  process.exit(1);
}
if (!chapter.audio_url) { console.error('El capítulo no tiene audio_url.'); process.exit(1); }

// ── 2. Duración del audio (≈ bytes / 12000 a 96 kbps mono) ─────────────────
let durationSec = 0;
try {
  const res = await fetch(chapter.audio_url, { method: 'HEAD' });
  const bytes = Number(res.headers.get('content-length') ?? 0);
  durationSec = bytes / 12000;
} catch { /* abajo se valida */ }
if (!durationSec || durationSec < 1) {
  console.error('No pude estimar la duración del audio (HEAD sin content-length).');
  process.exit(1);
}

// ── 3. Tokenizar el texto con posición de caracteres ───────────────────────
const text = cleanForTTS(chapter.content);
const total = text.length;
const words = [];
const re = /\S+/g;
let m;
while ((m = re.exec(text))) words.push({ t: m[0], start: m.index, end: m.index + m[0].length });

// ── 4. Agrupar en cues (≤42 chars, ≤12 palabras, corta en fin de oración) ──
const MAX_CHARS = 42, MAX_WORDS = 12;
const cues = [];
let cur = null;
for (const w of words) {
  if (!cur) cur = { startChar: w.start, endChar: w.end, text: w.t, n: 1 };
  else {
    const joined = `${cur.text} ${w.t}`;
    if (joined.length > MAX_CHARS || cur.n + 1 > MAX_WORDS) {
      cues.push(cur); cur = { startChar: w.start, endChar: w.end, text: w.t, n: 1 };
    } else { cur.text = joined; cur.endChar = w.end; cur.n++; }
  }
  if (/[.!?»]$/.test(w.t)) { cues.push(cur); cur = null; }
}
if (cur) cues.push(cur);

// ── 5. Tiempo proporcional a la posición del texto ─────────────────────────
for (const c of cues) {
  c.startSec = (c.startChar / total) * durationSec;
  c.endSec = (c.endChar / total) * durationSec;
}

// ── 6. Escribir .srt / .vtt ────────────────────────────────────────────────
const outDir = resolve(dir, 'subtitles');
mkdirSync(outDir, { recursive: true });

const srt = cues.map((c, i) =>
  `${i + 1}\n${fmt(c.startSec, ',')} --> ${fmt(c.endSec, ',')}\n${c.text}\n`).join('\n');
const vtt = 'WEBVTT\n\n' + cues.map(c =>
  `${fmt(c.startSec, '.')} --> ${fmt(c.endSec, '.')}\n${c.text}\n`).join('\n');

const srtPath = resolve(outDir, `${workSlug}.${lang}.srt`);
const vttPath = resolve(outDir, `${workSlug}.${lang}.vtt`);
writeFileSync(srtPath, srt, 'utf8');
writeFileSync(vttPath, vtt, 'utf8');

// ── 7. Subir a Supabase Storage (bucket "subtitles") ───────────────────────
try { await supabase.storage.createBucket('subtitles', { public: true }); } catch { /* ya existe */ }
for (const [ext, body] of [['srt', srt], ['vtt', vtt]]) {
  const { error } = await supabase.storage
    .from('subtitles')
    .upload(`${workSlug}/${lang}.${ext}`, Buffer.from(body, 'utf8'),
            { contentType: 'text/plain; charset=utf-8', upsert: true });
  if (error) console.warn(`  ! No se pudo subir ${ext} a Storage: ${error.message}`);
}

console.log(`✓ ${cues.length} cues · ${durationSec.toFixed(0)}s (proporcional)`);
console.log(`  ${srtPath}`);
console.log(`  Storage: subtitles/${workSlug}/${lang}.srt + .vtt`);
