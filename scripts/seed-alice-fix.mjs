/**
 * Regenera los 5 capítulos de Alice in Wonderland con cleanForTTS actualizado
 * (elimina _cursiva_ y artefactos de Gutenberg).
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
    .replace(/_([^_\n]+)_/g, '$1')                // _cursiva_ → cursiva
    .replace(/_/g, '')                             // guiones bajos sueltos
    .replace(/\*\*([^*\n]+)\*\*/g, '$1')          // **negrita** → negrita
    .replace(/^\s*\*[\s*]+\*\s*$/gm, '')          // * * * separadores
    .replace(/\[Illustration[^\]]*\]/gi, '')       // [Illustration]
    .replace(/\[eBook[^\]]*\]/gi, '')             // [eBook #11]
    .replace(/\[[^\]]{1,40}\]/g, '')              // otros tags cortos
    .replace(/([^\n])\n([^\n])/g, '$1 $2')        // une líneas del párrafo
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

// Descargar Alice
console.log('Descargando pg11 (Alice in Wonderland)...');
const res = await fetch('https://www.gutenberg.org/cache/epub/11/pg11.txt');
let txt = await res.text();
const s = txt.search(/\*\*\* START OF (THE|THIS) PROJECT/i);
const e = txt.search(/\*\*\* END OF (THE|THIS) PROJECT/i);
if (s !== -1) txt = txt.slice(txt.indexOf('\n', s) + 1);
if (e !== -1) txt = txt.slice(0, e);
txt = txt.trim();
console.log(`Descargado: ${txt.length} chars`);

// Preflight check
const underscoredBefore = (txt.match(/_[^_\n]{1,50}_/g) ?? []).length;
const cleaned = cleanForTTS(txt);
const underscoredAfter = (cleaned.match(/_[^_\n]{1,50}_/g) ?? []).length;
console.log(`\n🔍 Preflight: ${underscoredBefore} ocurrencias de _cursiva_ → ${underscoredAfter} después de limpiar`);
if (underscoredAfter > 0) console.log('  ⚠ Quedan artefactos sin limpiar!');
else console.log('  ✓ Texto limpio\n');

// Extraer capítulos (headings solos en su línea)
const matches = [...txt.matchAll(/^CHAPTER [IVXLC]+\.\r?$/gm)];
const chapters = [];
for (let i = 0; i < matches.length && chapters.length < 5; i++) {
  const start = matches[i].index + matches[i][0].length;
  const end = i + 1 < matches.length ? matches[i + 1].index : txt.length;
  const title = matches[i][0].trim();
  const body = txt.slice(start, end).trim();
  if (body.length > 200) chapters.push({ title, text: body });
}
console.log(`Capítulos extraídos: ${chapters.length}`);

const { data: work } = await supabase.from('works').select('id').eq('slug', 'alice-in-wonderland').single();
if (!work) { console.error('❌ Work no encontrado'); process.exit(1); }

const voice = 'en-US-JennyNeural';
for (let i = 0; i < chapters.length; i++) {
  const { title, text } = chapters[i];
  const chapterNum = i + 1;
  const cleanText = cleanForTTS(text);
  const chunks = chunkText(text);
  process.stdout.write(`  Cap ${chapterNum}: ${title}... (${chunks.length} chunks) `);

  const audio = await generateAudio(text, voice);
  if (audio.length === 0) { console.log('❌ audio vacío'); continue; }

  const path = `alice-in-wonderland/en/${chapterNum}.mp3`;
  const { error: upErr } = await supabase.storage
    .from('audio').upload(path, audio, { contentType: 'audio/mpeg', upsert: true });
  if (upErr) { console.log(`❌ ${upErr.message}`); continue; }

  const { data: urlData } = supabase.storage.from('audio').getPublicUrl(path);
  await supabase.from('chapters').upsert({
    work_id: work.id, chapter_number: chapterNum,
    title, lang: 'en', audio_url: urlData.publicUrl,
    content: cleanText,
  }, { onConflict: 'work_id,chapter_number,lang' });

  console.log(`✓ ${audio.length} bytes`);
}

console.log('\n✅ Done');
