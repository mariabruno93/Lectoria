/**
 * Regenera audio para libros que fallaron en la primera pasada.
 * Uso: node scripts/seed-audio-missing.mjs
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

async function uploadAndSave(workSlug, workId, chapterNum, title, lang, voice, text) {
  process.stdout.write(`    Cap ${chapterNum}: ${title.slice(0, 50)}... `);
  try {
    const audio = await generateAudio(text, voice);
    const path = `${workSlug}/${lang}/${chapterNum}.mp3`;
    const { error: upErr } = await supabase.storage
      .from('audio').upload(path, audio, { contentType: 'audio/mpeg', upsert: true });
    if (upErr) throw upErr;
    const { data } = supabase.storage.from('audio').getPublicUrl(path);
    await supabase.from('chapters').upsert({
      work_id: workId, chapter_number: chapterNum,
      title, lang, audio_url: data.publicUrl,
    }, { onConflict: 'work_id,chapter_number,lang' });
    console.log('✓');
  } catch (e) { console.log('✗', e.message); }
}

async function fetchGutenberg(url) {
  const res = await fetch(url);
  let txt = await res.text();
  const s = txt.search(/\*\*\* START OF (THE|THIS) PROJECT/i);
  const e = txt.search(/\*\*\* END OF (THE|THIS) PROJECT/i);
  if (s !== -1) txt = txt.slice(txt.indexOf('\n', s) + 1);
  if (e !== -1) txt = txt.slice(0, e);
  return txt.trim();
}

// ── Alice in Wonderland ───────────────────────────────────────────────────
// pg11.txt: cabeceras reales son "CHAPTER I." solos en su línea (sin espacio inicial)
// El TOC tiene " CHAPTER I.   título" (con espacio inicial) → no matchea ^CHAPTER
console.log('\n📚 alice-in-wonderland');
{
  const { data: w } = await supabase.from('works').select('id').eq('slug', 'alice-in-wonderland').single();
  if (!w) { console.log('  ✗ No encontrado en DB'); }
  else {
    process.stdout.write('  Descargando texto... ');
    const txt = await fetchGutenberg('https://www.gutenberg.org/cache/epub/11/pg11.txt');
    console.log('✓');
    const matches = [...txt.matchAll(/^CHAPTER [IVXLC]+\.\r?$/gm)];
    console.log(`  ${matches.length} capítulos encontrados`);
    const chapters = [];
    for (let i = 0; i < Math.min(matches.length, 5); i++) {
      const start = matches[i].index + matches[i][0].length;
      const end = i + 1 < matches.length ? matches[i + 1].index : txt.length;
      const body = txt.slice(start, end).trim();
      if (body.length > 200) chapters.push({ title: matches[i][0].trim().replace(/\r/, ''), text: body });
    }
    console.log(`  ${chapters.length} capítulos con contenido`);
    for (let i = 0; i < chapters.length; i++) {
      await uploadAndSave('alice-in-wonderland', w.id, i + 1, chapters[i].title, 'en', 'en-US-JennyNeural', chapters[i].text);
    }
  }
}

// ── The Great Gatsby ──────────────────────────────────────────────────────
// pg64317.txt: caps centrados con 34 espacios: "                                  I"
// El TOC tiene números sin sangría (I, II, ...) → no matchea ^ {20,}
console.log('\n📚 the-great-gatsby');
{
  const { data: w } = await supabase.from('works').select('id').eq('slug', 'the-great-gatsby').single();
  if (!w) { console.log('  ✗ No encontrado en DB'); }
  else {
    process.stdout.write('  Descargando texto... ');
    const txt = await fetchGutenberg('https://www.gutenberg.org/cache/epub/64317/pg64317.txt');
    console.log('✓');
    const matches = [...txt.matchAll(/^ {20,}(I{1,3}|IV|VI{0,3}|IX|X)\s*$/gm)];
    console.log(`  ${matches.length} capítulos encontrados`);
    const chapters = [];
    for (let i = 0; i < Math.min(matches.length, 5); i++) {
      const start = matches[i].index + matches[i][0].length;
      const end = i + 1 < matches.length ? matches[i + 1].index : txt.length;
      const body = txt.slice(start, end).trim();
      if (body.length > 200) chapters.push({ title: `Chapter ${i + 1}`, text: body });
    }
    console.log(`  ${chapters.length} capítulos con contenido`);
    for (let i = 0; i < chapters.length; i++) {
      await uploadAndSave('the-great-gatsby', w.id, i + 1, chapters[i].title, 'en', 'en-US-JennyNeural', chapters[i].text);
    }
  }
}

// ── Moby Dick ─────────────────────────────────────────────────────────────
// pg2701.txt: el TOC tiene "CHAPTER 1. Loomings." en líneas pares con blancos entre ellas.
// Los capítulos reales tienen el mismo formato pero con cuerpo > 200 chars.
// Fix: iterar TODOS los matches y tomar los primeros 5 con cuerpo sustancial.
console.log('\n📚 moby-dick');
{
  const { data: w } = await supabase.from('works').select('id').eq('slug', 'moby-dick').single();
  if (!w) { console.log('  ✗ No encontrado en DB'); }
  else {
    process.stdout.write('  Descargando texto... ');
    const txt = await fetchGutenberg('https://www.gutenberg.org/cache/epub/2701/pg2701.txt');
    console.log('✓');
    const pattern = /^CHAPTER \d+\.\s+[^\r\n]+/gm;
    const matches = [...txt.matchAll(pattern)];
    console.log(`  ${matches.length} matches totales (TOC + reales)`);
    const chapters = [];
    for (let i = 0; i < matches.length && chapters.length < 5; i++) {
      const start = matches[i].index + matches[i][0].length;
      const end = i + 1 < matches.length ? matches[i + 1].index : txt.length;
      const body = txt.slice(start, end).trim();
      if (body.length > 200) chapters.push({ title: matches[i][0].trim(), text: body });
    }
    console.log(`  ${chapters.length} capítulos con contenido`);
    for (let i = 0; i < chapters.length; i++) {
      await uploadAndSave('moby-dick', w.id, i + 1, chapters[i].title, 'en', 'en-US-JennyNeural', chapters[i].text);
    }
  }
}

console.log('\n✅ Listo!');
