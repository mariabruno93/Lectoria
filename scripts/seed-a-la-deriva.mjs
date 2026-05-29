/**
 * Genera audio para "A la deriva" de Horacio Quiroga (pg13507).
 * Uso: node scripts/seed-a-la-deriva.mjs
 */
import { createClient } from '@supabase/supabase-js';
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';
import { readFileSync } from 'fs';
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

function cleanForTTS(text) {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\f/g, '\n')
    .replace(/([^\n])\n([^\n])/g, '$1 $2')
    .replace(/ {2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function chunkText(text, max = 4000) {
  const clean = cleanForTTS(text);
  const sentences = clean.split(/(?<=[.!?»])\s+/);
  const chunks = [];
  let cur = '';
  for (const s of sentences) {
    if (cur.length + s.length > max && cur) { chunks.push(cur.trim()); cur = s; }
    else cur += (cur ? ' ' : '') + s;
  }
  if (cur.trim()) chunks.push(cur.trim());
  return chunks;
}

async function generateAudio(text, voice) {
  const tts = new MsEdgeTTS();
  await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);
  const all = [];
  for (const chunk of chunkText(text)) {
    const bufs = [];
    await new Promise((res, rej) => {
      const { audioStream } = tts.toStream(chunk);
      audioStream.on('data', d => bufs.push(d));
      audioStream.on('end', res);
      audioStream.on('error', rej);
    });
    all.push(...bufs);
  }
  return Buffer.concat(all);
}

// Descargar pg13507
console.log('Descargando pg13507...');
const res = await fetch('https://www.gutenberg.org/cache/epub/13507/pg13507.txt');
let txt = await res.text();
const s = txt.search(/\*\*\* START OF (THE|THIS) PROJECT/i);
const e = txt.search(/\*\*\* END OF (THE|THIS) PROJECT/i);
if (s !== -1) txt = txt.slice(txt.indexOf('\n', s) + 1);
if (e !== -1) txt = txt.slice(0, e);
txt = txt.trim();
console.log(`Descargado: ${txt.length} chars`);

// Extraer "A la deriva"
const startMatch = txt.match(/#A LA DERIVA#/i);
if (!startMatch) { console.error('❌ No se encontró #A LA DERIVA#'); process.exit(1); }
const start = startMatch.index + startMatch[0].length;
const endMatch = txt.slice(start).match(/#[A-Z]/);
const end = endMatch ? start + endMatch.index : start + 50000;
const body = txt.slice(start, end).trim();
console.log(`Texto extraído: ${body.length} chars`);
console.log(`Primeros 100: "${body.slice(0, 100)}"`);

if (body.length < 200) { console.error('❌ Texto demasiado corto'); process.exit(1); }

// Buscar work_id
const { data: work } = await supabase.from('works').select('id').eq('slug', 'a-la-deriva').single();
if (!work) { console.error('❌ Work "a-la-deriva" no encontrado en DB'); process.exit(1); }

// Generar audio
const voice = 'es-MX-JorgeNeural';
const cleanText = cleanForTTS(body);
const chunks = chunkText(body);
console.log(`Chunks: ${chunks.length}`);
process.stdout.write('  ');
const audio = await generateAudio(body, voice);
console.log(`\nAudio generado: ${audio.length} bytes`);

if (audio.length === 0) { console.error('❌ Audio vacío — no se sube'); process.exit(1); }

// Subir a Storage
const path = `a-la-deriva/es/1.mp3`;
const { error: upErr } = await supabase.storage
  .from('audio').upload(path, audio, { contentType: 'audio/mpeg', upsert: true });
if (upErr) { console.error('❌ Upload error:', upErr.message); process.exit(1); }

const { data: urlData } = supabase.storage.from('audio').getPublicUrl(path);

// Guardar en DB
const { error: dbErr } = await supabase.from('chapters').upsert({
  work_id: work.id,
  chapter_number: 1,
  title: 'A la deriva',
  lang: 'es',
  audio_url: urlData.publicUrl,
  content: cleanText,
}, { onConflict: 'work_id,chapter_number,lang' });

if (dbErr) { console.error('❌ DB error:', dbErr.message); process.exit(1); }

console.log(`✓ listo! audio: ${audio.length} bytes, content: ${cleanText.length} chars`);
console.log('\n✅ Done');
