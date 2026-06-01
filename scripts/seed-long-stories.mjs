/**
 * Re-genera audio para los cuentos que fallaron por exceder 50MB.
 * Usa 48kbps (en vez de 96kbps) para que quepan en Supabase Storage.
 * Cuentos: los-crimenes-de-la-calle-morgue, bola-de-sebo, el-monje-negro,
 *          el-crimen-de-lord-arthur-savile, el-color-que-cayo-del-cielo,
 *          el-hombre-que-pudo-ser-rey
 */
import { createClient } from '@supabase/supabase-js';
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
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

// Slugs que fallaron por tamaño
const RETRY_SLUGS = new Set([
  'los-crimenes-de-la-calle-morgue',
  'bola-de-sebo',
  'el-monje-negro',
  'el-crimen-de-lord-arthur-savile',
  'el-color-que-cayo-del-cielo',
  'el-hombre-que-pudo-ser-rey',
]);

const authorMeta = Object.fromEntries(AUTHORS.map(a => [a.slug, a]));
const storiesToProcess = STORIES.filter(s => RETRY_SLUGS.has(s.slug));
console.log('Cuentos a re-generar:', storiesToProcess.length);

// ---- HTML entities ----
const HTML_ENTITIES = {
  '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&apos;': "'",
  '&iacute;': 'í', '&eacute;': 'é', '&aacute;': 'á',
  '&oacute;': 'ó', '&uacute;': 'ú',
  '&Iacute;': 'Í', '&Eacute;': 'É', '&Aacute;': 'Á',
  '&Oacute;': 'Ó', '&Uacute;': 'Ú',
  '&ntilde;': 'ñ', '&Ntilde;': 'Ñ', '&uuml;': 'ü', '&Uuml;': 'Ü',
  '&agrave;': 'à', '&egrave;': 'è', '&ograve;': 'ò', '&ugrave;': 'ù',
  '&acirc;': 'â', '&ecirc;': 'ê', '&icirc;': 'î', '&ocirc;': 'ô', '&ucirc;': 'û',
  '&atilde;': 'ã', '&otilde;': 'õ', '&aring;': 'å',
  '&ae;': 'æ', '&oslash;': 'ø', '&ccedil;': 'ç', '&Ccedil;': 'Ç',
  '&nbsp;': ' ', '&mdash;': '—', '&ndash;': '–',
  '&laquo;': '«', '&raquo;': '»',
  '&iquest;': '¿', '&iexcl;': '¡',
  '&ldquo;': '“', '&rdquo;': '”',
  '&lsquo;': '‘', '&rsquo;': '’',
  '&hellip;': '…',
};

function decodeHTMLEntities(str) {
  return str
    .replace(/&[a-zA-Z]+;/g, m => HTML_ENTITIES[m] ?? m)
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
}

async function scrapeCiudadseva(slug) {
  const url = 'https://ciudadseva.com/texto/' + slug + '/';
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept-Language': 'es-ES,es;q=0.9',
    },
  });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  const html = await res.text();
  const divMatch = html.match(/<div[^>]*class="[^"]*text-justify[^"]*"[^>]*>([\s\S]*?)<\/div\s*>/i);
  if (!divMatch) throw new Error('No se encontro el texto');
  const paragraphs = [];
  const pMatches = [...divMatch[1].matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)];
  if (pMatches.length > 0) {
    for (const match of pMatches) {
      let text = match[1].replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, '');
      text = decodeHTMLEntities(text).replace(/\s+/g, ' ').trim();
      if (text.length > 0) paragraphs.push(text);
    }
  }
  if (paragraphs.length === 0) throw new Error('No se extrajo texto');
  return paragraphs.join('\n\n');
}

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

function chunkText(text, max) {
  max = max || 4000;
  const clean = cleanForTTS(text);
  const sentences = clean.split(/(?<=[.!?])\s+/);
  const chunks = [];
  let cur = '';
  for (const s of sentences) {
    if (cur.length + s.length > max && cur) { chunks.push(cur.trim()); cur = s; }
    else cur += (cur ? ' ' : '') + s;
  }
  if (cur.trim()) chunks.push(cur.trim());
  return chunks.length > 0 ? chunks : [clean];
}

async function generateAudioWithTimings(text, voice) {
  const cleanedText = cleanForTTS(text);
  const chunks = chunkText(text);
  const paragraphs = cleanedText.split('\n\n').map(p => p.trim()).filter(p => p.length > 20);

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
    // 48kbps para cuentos largos (<=50MB para ~90min)
    await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
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
        chunkEndMs = Math.max(chunkEndMs, offsetMs + durMs);
        if (globalWordIdx < wordParaMap.length) {
          const pi = wordParaMap[globalWordIdx];
          if (paraTimingsMs[pi] < 0) paraTimingsMs[pi] = chunkStartMs + offsetMs;
        }
        globalWordIdx++;
      });
    });

    const buf = Buffer.concat(bufs);
    allBuffers.push(buf);
    chunkStartMs += chunkEndMs > 0 ? chunkEndMs : buf.length / 6;
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
  };
}

async function uploadAndSave(workSlug, workId, voice, title, text) {
  const cleanText = cleanForTTS(text);
  const { audio, timings } = await generateAudioWithTimings(text, voice);
  if (audio.length === 0) throw new Error('Audio vacio');

  const mb = (audio.length / 1024 / 1024).toFixed(1);
  console.log('  Audio: ' + mb + 'MB, ' + timings.length + ' parrafos');

  const path = workSlug + '/es/1.mp3';
  const { error: upErr } = await supabase.storage
    .from('audio').upload(path, audio, { contentType: 'audio/mpeg', upsert: true });
  if (upErr) throw upErr;

  const { data: urlData } = supabase.storage.from('audio').getPublicUrl(path);

  const { error: dbErr } = await supabase.from('chapters').upsert({
    work_id: workId,
    chapter_number: 1,
    title,
    lang: 'es',
    audio_url: urlData.publicUrl,
    content: cleanText,
    paragraph_timings: timings,
  }, { onConflict: 'work_id,chapter_number,lang' });
  if (dbErr) throw dbErr;
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

const { data: allWorks } = await supabase.from('works').select('id, slug');
const workBySlug = Object.fromEntries(allWorks.map(w => [w.slug, w.id]));

let processed = 0, failed = 0;
console.log('-------------------------------------------------------');
console.log('Re-seed cuentos largos (48kbps)');
console.log('-------------------------------------------------------');

for (const story of storiesToProcess) {
  const meta = authorMeta[story.authorSlug];
  const workId = workBySlug[story.slug];

  if (!workId) {
    console.log('AVISO: ' + story.slug + ' no esta en DB');
    failed++;
    continue;
  }

  console.log('Procesando: ' + story.slug);
  try {
    const text = await scrapeCiudadseva(story.ciudasdevaSlug ?? story.slug);
    await delay(1200);
    const voice = (meta && meta.voiceEs) ? meta.voiceEs : 'es-MX-JorgeNeural';
    await uploadAndSave(story.slug, workId, voice, story.title, text);
    console.log('  -> OK');
    processed++;
  } catch (e) {
    console.log('  -> ERROR: ' + e.message);
    failed++;
  }
  await delay(2000);
}

console.log('\nProcesados: ' + processed + '  Errores: ' + failed);
