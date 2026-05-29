/**
 * Genera audio para La insolación y La meningitis y su sombra (pg13507).
 * Uso: node scripts/seed-quiroga-extra.mjs
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

function extractStory(txt, heading) {
  const startMatch = txt.match(new RegExp(`#${heading}#`, 'i'));
  if (!startMatch) return null;
  const start = startMatch.index + startMatch[0].length;
  const endMatch = txt.slice(start).match(/#[A-Z]/);
  const end = endMatch ? start + endMatch.index : start + 100000;
  const body = txt.slice(start, end).trim();
  return body.length > 200 ? body : null;
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
console.log(`Descargado: ${txt.length} chars\n`);

const STORIES = [
  {
    slug: 'la-insolacion',
    heading: 'LA INSOLACION',
    title: 'La insolación',
    voice: 'es-MX-JorgeNeural',
  },
  {
    slug: 'la-meningitis-y-su-sombra',
    heading: 'LA MENINGITIS Y SU SOMBRA',
    title: 'La meningitis y su sombra',
    voice: 'es-AR-ElenaNeural',
  },
];

for (const story of STORIES) {
  console.log(`📚 ${story.slug}`);

  const body = extractStory(txt, story.heading);
  if (!body) { console.log(`  ❌ No se encontró #${story.heading}#\n`); continue; }
  console.log(`  Texto extraído: ${body.length} chars`);
  console.log(`  Primeros 100: "${body.slice(0, 100)}"`);

  const { data: work } = await supabase.from('works').select('id').eq('slug', story.slug).single();
  if (!work) { console.log(`  ❌ Work no encontrado en DB\n`); continue; }

  const cleanText = cleanForTTS(body);
  const chunks = chunkText(body);
  console.log(`  Chunks: ${chunks.length}`);
  process.stdout.write('  ');
  for (let i = 0; i < chunks.length; i++) process.stdout.write('.');

  const audio = await generateAudio(body, story.voice);
  console.log(`\n  Audio generado: ${audio.length} bytes`);

  if (audio.length === 0) { console.log(`  ❌ Audio vacío — no se sube\n`); continue; }

  const path = `${story.slug}/es/1.mp3`;
  const { error: upErr } = await supabase.storage
    .from('audio').upload(path, audio, { contentType: 'audio/mpeg', upsert: true });
  if (upErr) { console.log(`  ❌ Upload: ${upErr.message}\n`); continue; }

  const { data: urlData } = supabase.storage.from('audio').getPublicUrl(path);

  const { error: dbErr } = await supabase.from('chapters').upsert({
    work_id: work.id,
    chapter_number: 1,
    title: story.title,
    lang: 'es',
    audio_url: urlData.publicUrl,
    content: cleanText,
  }, { onConflict: 'work_id,chapter_number,lang' });

  if (dbErr) { console.log(`  ❌ DB: ${dbErr.message}\n`); continue; }

  console.log(`  ✓ listo! audio: ${audio.length} bytes, content: ${cleanText.length} chars\n`);
}

console.log('✅ Done');
