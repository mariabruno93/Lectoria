/**
 * Genera audio para todos los libros del catálogo.
 * Uso: node scripts/seed-audio.mjs
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

// ── Helpers ──────────────────────────────────────────────────────────────

/**
 * Limpia el texto de Gutenberg antes de enviarlo al TTS.
 * Gutenberg formatea líneas a ~72 chars, lo que produce saltos de línea
 * dentro de oraciones. El TTS los interpreta como pausas → audio entrecortado.
 * Solución: unir líneas dentro del mismo párrafo (1 \n → espacio).
 * Los párrafos reales (2+ \n) se conservan como pausa natural.
 */
function cleanForTTS(text) {
  return text
    .replace(/\r\n/g, '\n')          // normalizar CRLF → LF
    .replace(/\f/g, '\n')            // form feeds
    .replace(/([^\n])\n([^\n])/g, '$1 $2')  // une líneas dentro del párrafo
    .replace(/ {2,}/g, ' ')          // colapsa espacios múltiples
    .replace(/\n{3,}/g, '\n\n')      // máximo 2 saltos consecutivos
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
    const cleanText = cleanForTTS(text);   // texto limpio para guardar en DB
    const audio = await generateAudio(text, voice);
    const path = `${workSlug}/${lang}/${chapterNum}.mp3`;
    const { error: upErr } = await supabase.storage
      .from('audio').upload(path, audio, { contentType: 'audio/mpeg', upsert: true });
    if (upErr) throw upErr;
    const { data } = supabase.storage.from('audio').getPublicUrl(path);
    await supabase.from('chapters').upsert({
      work_id: workId, chapter_number: chapterNum,
      title, lang, audio_url: data.publicUrl,
      content: cleanText,   // texto para read-along
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

function parseChapters(text, pattern, maxChapters = 5) {
  const matches = [...text.matchAll(pattern)];
  const chapters = [];
  // Iteramos TODOS los matches (no solo los primeros maxChapters)
  // para saltar entradas de TOC (cuerpo muy corto) y llegar a los capítulos reales.
  for (let i = 0; i < matches.length && chapters.length < maxChapters; i++) {
    const start = matches[i].index;
    const end = i + 1 < matches.length ? matches[i + 1].index : text.length;
    const title = matches[i][0].trim().replace(/\n.*/s, '');
    const body = text.slice(start + matches[i][0].length, end).trim();
    if (body.length > 200) chapters.push({ title, text: body });
  }
  return chapters;
}

async function getWorkId(slug) {
  const { data } = await supabase.from('works').select('id').eq('slug', slug).single();
  return data?.id;
}

// ── Catálogo ─────────────────────────────────────────────────────────────

const WORKS = [
  // ── CUENTOS (texto completo, un capítulo) ─────────────────────────────
  // Fuente: pg13507 = "Cuentos de Amor de Locura y de Muerte" de Horacio Quiroga
  // Encabezados con formato #TITULO# — pg6290 era el libro incorrecto (Wild Youth).
  {
    slug: 'el-almohadon-de-plumas',
    jobs: [
      { lang: 'es', voice: 'es-AR-ElenaNeural', source: 'gutenberg',
        url: 'https://www.gutenberg.org/cache/epub/13507/pg13507.txt',
        extract: (txt) => {
          const startMatch = txt.match(/#EL ALMOHADON DE PLUMA#/i);
          if (!startMatch) return [];
          const start = startMatch.index + startMatch[0].length;
          const endMatch = txt.slice(start).match(/#[A-Z]/);
          const end = endMatch ? start + endMatch.index : start + 50000;
          const body = txt.slice(start, end).trim();
          return body.length > 200 ? [{ title: 'El almohadón de plumas', text: body }] : [];
        }
      },
    ]
  },
  {
    slug: 'la-gallina-degollada',
    jobs: [
      { lang: 'es', voice: 'es-MX-JorgeNeural', source: 'gutenberg',
        url: 'https://www.gutenberg.org/cache/epub/13507/pg13507.txt',
        extract: (txt) => {
          const startMatch = txt.match(/#LA GALLINA DEGOLLADA#/i);
          if (!startMatch) return [];
          const start = startMatch.index + startMatch[0].length;
          const endMatch = txt.slice(start).match(/#[A-Z]/);
          const end = endMatch ? start + endMatch.index : start + 50000;
          const body = txt.slice(start, end).trim();
          return body.length > 200 ? [{ title: 'La gallina degollada', text: body }] : [];
        }
      },
    ]
  },
  {
    slug: 'a-la-deriva',
    jobs: [
      { lang: 'es', voice: 'es-MX-JorgeNeural', source: 'gutenberg',
        url: 'https://www.gutenberg.org/cache/epub/13507/pg13507.txt',
        extract: (txt) => {
          const startMatch = txt.match(/#A LA DERIVA#/i);
          if (!startMatch) return [];
          const start = startMatch.index + startMatch[0].length;
          const endMatch = txt.slice(start).match(/#[A-Z]/);
          const end = endMatch ? start + endMatch.index : start + 50000;
          const body = txt.slice(start, end).trim();
          return body.length > 200 ? [{ title: 'A la deriva', text: body }] : [];
        }
      },
    ]
  },
  {
    slug: 'la-insolacion',
    jobs: [
      { lang: 'es', voice: 'es-MX-JorgeNeural', source: 'gutenberg',
        url: 'https://www.gutenberg.org/cache/epub/13507/pg13507.txt',
        extract: (txt) => {
          const startMatch = txt.match(/#LA INSOLACION#/i);
          if (!startMatch) return [];
          const start = startMatch.index + startMatch[0].length;
          const endMatch = txt.slice(start).match(/#[A-Z]/);
          const end = endMatch ? start + endMatch.index : start + 100000;
          const body = txt.slice(start, end).trim();
          return body.length > 200 ? [{ title: 'La insolación', text: body }] : [];
        }
      },
    ]
  },
  {
    slug: 'la-meningitis-y-su-sombra',
    jobs: [
      { lang: 'es', voice: 'es-AR-ElenaNeural', source: 'gutenberg',
        url: 'https://www.gutenberg.org/cache/epub/13507/pg13507.txt',
        extract: (txt) => {
          const startMatch = txt.match(/#LA MENINGITIS Y SU SOMBRA#/i);
          if (!startMatch) return [];
          const start = startMatch.index + startMatch[0].length;
          const endMatch = txt.slice(start).match(/#[A-Z]/);
          const end = endMatch ? start + endMatch.index : start + 100000;
          const body = txt.slice(start, end).trim();
          return body.length > 200 ? [{ title: 'La meningitis y su sombra', text: body }] : [];
        }
      },
    ]
  },
  // ── NOVELAS EN INGLÉS (Project Gutenberg, primeros 5 capítulos) ────────
  {
    slug: 'alice-in-wonderland',
    jobs: [
      { lang: 'en', voice: 'en-US-JennyNeural', source: 'gutenberg',
        url: 'https://www.gutenberg.org/cache/epub/11/pg11.txt',
        // En pg11.txt los capítulos reales son "CHAPTER I." solos en su línea (sin título inline)
        extract: (txt) => parseChapters(txt, /^CHAPTER [IVXLC]+\.\r?$/gm, 5)
      },
    ]
  },
  {
    slug: 'the-great-gatsby',
    jobs: [
      { lang: 'en', voice: 'en-US-JennyNeural', source: 'gutenberg',
        url: 'https://www.gutenberg.org/cache/epub/64317/pg64317.txt',
        extract: (txt) => {
          // pg64317: caps centrados con 20+ espacios: "                    I"
          // El TOC tiene los números sin sangría, se descarta así.
          const matches = [...txt.matchAll(/^ {20,}(I{1,3}|IV|VI{0,3}|IX|X)\s*$/gm)];
          const chapters = [];
          for (let i = 0; i < Math.min(matches.length, 5); i++) {
            const start = matches[i].index + matches[i][0].length;
            const end = i + 1 < matches.length ? matches[i + 1].index : txt.length;
            const body = txt.slice(start, end).trim();
            if (body.length > 200) chapters.push({ title: `Chapter ${i + 1}`, text: body });
          }
          return chapters;
        }
      },
    ]
  },
  {
    slug: 'dracula',
    jobs: [
      { lang: 'en', voice: 'en-US-JennyNeural', source: 'gutenberg',
        url: 'https://www.gutenberg.org/cache/epub/345/pg345.txt',
        extract: (txt) => parseChapters(txt, /CHAPTER [IVXLC]+\s*\n/gi, 5)
      },
    ]
  },
  {
    slug: 'frankenstein',
    jobs: [
      { lang: 'en', voice: 'en-US-JennyNeural', source: 'gutenberg',
        url: 'https://www.gutenberg.org/cache/epub/84/pg84.txt',
        extract: (txt) => parseChapters(txt, /^Chapter \d+\r?$/gim, 5)
      },
    ]
  },
  {
    slug: 'moby-dick',
    jobs: [
      { lang: 'en', voice: 'en-US-JennyNeural', source: 'gutenberg',
        url: 'https://www.gutenberg.org/cache/epub/2701/pg2701.txt',
        extract: (txt) => {
          // pg2701 tiene un TOC con 135 entradas "CHAPTER N. Titulo" al inicio.
          // El último entry del TOC (CHAPTER 135) tiene como cuerpo todo el prefacio
          // y se cuela como cap 1. Fix: encontrar la SEGUNDA aparición de CHAPTER 1.
          // que es el capítulo real, y parsear a partir de ahí.
          const firstIdx = txt.search(/^CHAPTER 1\. /m);
          const secondIdx = txt.indexOf('\nCHAPTER 1. ', firstIdx + 1);
          const actualText = secondIdx !== -1 ? txt.slice(secondIdx + 1) : txt.slice(firstIdx);
          return parseChapters(actualText, /^CHAPTER \d+\.\s+[^\r\n]+/gm, 5);
        }
      },
    ]
  },
  {
    slug: 'don-quijote',
    jobs: [
      { lang: 'es', voice: 'es-MX-JorgeNeural', source: 'gutenberg',
        url: 'https://www.gutenberg.org/cache/epub/2000/pg2000.txt',
        // maxChapters=52: cubre toda la Primera Parte del Quijote
        extract: (txt) => parseChapters(txt, /Capítulo (primero|[IVXLC]+)\.?\s+[^\n]+/gi, 52)
      },
    ]
  },
];

// ── Main ─────────────────────────────────────────────────────────────────

const gutenbergCache = {};

for (const work of WORKS) {
  console.log(`\n📚 ${work.slug}`);
  const workId = await getWorkId(work.slug);
  if (!workId) { console.log('  ✗ No encontrado en DB'); continue; }

  for (const job of work.jobs) {
    console.log(`  🌐 Idioma: ${job.lang.toUpperCase()} — Voz: ${job.voice}`);

    let rawText;
    if (job.source === 'gutenberg') {
      if (!gutenbergCache[job.url]) {
        process.stdout.write('  Descargando texto... ');
        gutenbergCache[job.url] = await fetchGutenberg(job.url);
        console.log('✓');
      }
      rawText = gutenbergCache[job.url];
    }

    const chapters = job.extract(rawText);
    if (!chapters.length) { console.log('  ✗ No se encontraron capítulos'); continue; }

    for (let i = 0; i < chapters.length; i++) {
      await uploadAndSave(work.slug, workId, i + 1, chapters[i].title, job.lang, job.voice, chapters[i].text);
    }
  }
}

console.log('\n✅ Listo!');
