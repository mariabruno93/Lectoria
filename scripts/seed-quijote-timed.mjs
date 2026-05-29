/**
 * Regenera los 52 capítulos del Quijote capturando tiempos reales de párrafos
 * via metadataStream de msedge-tts (WordBoundary events).
 * Requiere: ALTER TABLE chapters ADD COLUMN IF NOT EXISTS paragraph_timings FLOAT8[];
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
    .replace(/\r\n/g, '\n').replace(/\f/g, '\n')
    .replace(/_([^_\n]+)_/g, '$1').replace(/_/g, '')
    .replace(/\*\*([^*\n]+)\*\*/g, '$1')
    .replace(/^\s*\*[\s*]+\*\s*$/gm, '')
    .replace(/\[Illustration[^\]]*\]/gi, '').replace(/\[eBook[^\]]*\]/gi, '')
    .replace(/\[[^\]]{1,40}\]/g, '')
    .replace(/([^\n])\n([^\n])/g, '$1 $2')
    .replace(/ {2,}/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
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

async function generateAudioWithTimings(text, voice) {
  const cleanedText = cleanForTTS(text);
  const chunks = chunkText(text);
  const paragraphs = cleanedText.split('\n\n').map(p => p.trim()).filter(p => p.length > 20);

  // Mapa global: índice de palabra → índice de párrafo
  const wordParaMap = [];
  for (let pi = 0; pi < paragraphs.length; pi++) {
    const wordCount = paragraphs[pi].split(/\s+/).filter(w => w).length;
    for (let wi = 0; wi < wordCount; wi++) wordParaMap.push(pi);
  }

  const paraTimingsMs = new Array(paragraphs.length).fill(-1);
  let globalWordIdx = 0;
  let chunkStartMs = 0;
  const allBuffers = [];

  for (const chunk of chunks) {
    const tts = new MsEdgeTTS();
    await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);
    const bufs = [];
    let chunkEndMs = 0;

    await new Promise((res, rej) => {
      const { audioStream, metadataStream } = tts.toStream(chunk);
      audioStream.on('data', d => bufs.push(d));
      audioStream.on('end', res);
      audioStream.on('error', rej);

      metadataStream?.on('data', event => {
        if (event.type !== 'WordBoundary') return;
        const offsetMs = (event.offset ?? 0) / 10000;
        const durMs = (event.duration ?? 0) / 10000;
        const absoluteMs = chunkStartMs + offsetMs;
        chunkEndMs = Math.max(chunkEndMs, offsetMs + durMs);

        if (globalWordIdx < wordParaMap.length) {
          const pi = wordParaMap[globalWordIdx];
          if (paraTimingsMs[pi] < 0) paraTimingsMs[pi] = absoluteMs;
        }
        globalWordIdx++;
      });
    });

    const buf = Buffer.concat(bufs);
    allBuffers.push(buf);
    chunkStartMs += chunkEndMs > 0 ? chunkEndMs : buf.length / 12;
  }

  if (paraTimingsMs[0] < 0) paraTimingsMs[0] = 0;
  let last = 0;
  for (let i = 0; i < paraTimingsMs.length; i++) {
    if (paraTimingsMs[i] >= 0) last = paraTimingsMs[i];
    else paraTimingsMs[i] = last;
  }

  return {
    audio: Buffer.concat(allBuffers),
    timings: paraTimingsMs.map(ms => Math.round(ms) / 1000),
    paragraphCount: paragraphs.length,
  };
}

// Descargar Quijote
console.log('Descargando pg2000 (Don Quijote)...');
const res = await fetch('https://www.gutenberg.org/cache/epub/2000/pg2000.txt');
let txt = await res.text();
const s = txt.search(/\*\*\* START OF (THE|THIS) PROJECT/i);
const e = txt.search(/\*\*\* END OF (THE|THIS) PROJECT/i);
if (s !== -1) txt = txt.slice(txt.indexOf('\n', s) + 1);
if (e !== -1) txt = txt.slice(0, e);
txt = txt.trim();
console.log(`Descargado: ${txt.length} chars\n`);

// Extraer 52 capítulos
function parseChapters(text, pattern, maxChapters) {
  const matches = [...text.matchAll(pattern)];
  const chapters = [];
  for (let i = 0; i < matches.length && chapters.length < maxChapters; i++) {
    const start = matches[i].index;
    const end = i + 1 < matches.length ? matches[i + 1].index : text.length;
    const title = matches[i][0].trim().replace(/\n.*/s, '');
    const body = text.slice(start + matches[i][0].length, end).trim();
    if (body.length > 200) chapters.push({ title, text: body });
  }
  return chapters;
}

const chapters = parseChapters(txt, /Capítulo (primero|[IVXLC]+)\.?\s+[^\n]+/gi, 52);
console.log(`Capítulos extraídos: ${chapters.length}\n`);

const { data: work } = await supabase.from('works').select('id').eq('slug', 'don-quijote').single();
if (!work) { console.error('❌ don-quijote no encontrado'); process.exit(1); }

const voice = 'es-MX-JorgeNeural';

for (let i = 0; i < chapters.length; i++) {
  const { title, text } = chapters[i];
  const chapterNum = i + 1;
  const cleanText = cleanForTTS(text);
  const chunks = chunkText(text);
  process.stdout.write(`  Cap ${chapterNum.toString().padStart(2)}: ${title.slice(0, 45).padEnd(45)} [${chunks.length} chunks] `);

  try {
    const { audio, timings, paragraphCount } = await generateAudioWithTimings(text, voice);
    if (audio.length === 0) { console.log('❌ audio vacío'); continue; }

    const path = `don-quijote/es/${chapterNum}.mp3`;
    const { error: upErr } = await supabase.storage
      .from('audio').upload(path, audio, { contentType: 'audio/mpeg', upsert: true });
    if (upErr) throw upErr;

    const { data: urlData } = supabase.storage.from('audio').getPublicUrl(path);
    await supabase.from('chapters').upsert({
      work_id: work.id, chapter_number: chapterNum,
      title, lang: 'es', audio_url: urlData.publicUrl,
      content: cleanText,
      paragraph_timings: timings,
    }, { onConflict: 'work_id,chapter_number,lang' });

    console.log(`✓ ${(audio.length / 1024 / 1024).toFixed(1)}MB  ${paragraphCount} párrafos`);
  } catch (e) {
    console.log(`✗ ${e.message}`);
  }
}

console.log('\n✅ Don Quijote completo con timings reales');
