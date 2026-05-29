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
 *
 * Problemas que resuelve:
 * 1. Saltos de línea cada 72 chars → audio entrecortado (une líneas del mismo párrafo)
 * 2. _cursiva_ con guión bajo → TTS dice "underscore" (elimina marcadores)
 * 3. [Illustration], [eBook #11] → TTS lee el tag (elimina corchetes editoriales)
 * 4. * * * separadores ornamentales → TTS dice "asterisco" (elimina)
 * 5. Asteriscos de énfasis **word** → elimina
 */
function cleanForTTS(text) {
  return text
    .replace(/\r\n/g, '\n')                          // normalizar CRLF → LF
    .replace(/\f/g, '\n')                            // form feeds
    // ── Artefactos de formato Gutenberg ──
    .replace(/_([^_\n]+)_/g, '$1')                  // _cursiva_ → cursiva
    .replace(/_/g, '')                               // guiones bajos sueltos restantes
    .replace(/\*\*([^*\n]+)\*\*/g, '$1')            // **negrita** → negrita
    .replace(/^\s*\*[\s*]+\*\s*$/gm, '')            // * * * separadores ornamentales
    .replace(/\[Illustration[^\]]*\]/gi, '')         // [Illustration: descripción]
    .replace(/\[eBook[^\]]*\]/gi, '')               // [eBook #11]
    .replace(/\[[^\]]{1,40}\]/g, '')                // otros tags cortos entre corchetes
    // ── Formato de líneas ──
    .replace(/([^\n])\n([^\n])/g, '$1 $2')          // une líneas dentro del párrafo
    .replace(/ {2,}/g, ' ')                         // colapsa espacios múltiples
    .replace(/\n{3,}/g, '\n\n')                     // máximo 2 saltos consecutivos
    .trim();
}

/**
 * Corre antes de generar audio. Detecta artefactos que el TTS leería mal
 * y muestra ejemplos para que se pueda verificar que cleanForTTS los resolvió.
 * Retorna true si el texto está limpio, false si hay problemas no resueltos.
 */
function preflightCheck(rawText, slug) {
  const checks = [
    { name: 'guiones bajos (_cursiva_)',   pattern: /_[^_\n]{1,50}_/g },
    { name: 'guiones bajos sueltos',       pattern: /(?<![a-zA-Z])_(?![a-zA-Z])/g },
    { name: 'asteriscos ornamentales',     pattern: /^\s*\*[\s*]+\*/gm },
    { name: 'tags entre corchetes [...]',  pattern: /\[[^\]]{2,40}\]/g },
    { name: 'entidades HTML (&amp; etc.)', pattern: /&[a-z]{2,6};/g },
    { name: 'caracteres de control',       pattern: /[\x00-\x08\x0B\x0C\x0E-\x1F]/g },
  ];

  // Correr checks sobre el texto ya limpio
  const cleanedText = cleanForTTS(rawText);
  let allOk = true;

  console.log(`\n  🔍 Preflight check: ${slug}`);
  for (const { name, pattern } of checks) {
    const rawMatches   = [...rawText.matchAll(pattern)];
    const cleanMatches = [...cleanedText.matchAll(pattern)];
    if (rawMatches.length > 0) {
      if (cleanMatches.length === 0) {
        console.log(`     ✓ ${name}: ${rawMatches.length} encontrados → eliminados`);
      } else {
        console.log(`     ⚠ ${name}: ${cleanMatches.length} QUEDAN después de limpiar`);
        cleanMatches.slice(0, 3).forEach(m =>
          console.log(`       ejemplo: "${m[0].slice(0, 60)}"`)
        );
        allOk = false;
      }
    }
  }
  if (allOk) console.log(`     ✓ Texto limpio — sin artefactos\n`);
  else console.log(`     ⚠ Revisar antes de subir\n`);

  return allOk;
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

/**
 * Genera audio Y captura los tiempos reales de inicio de cada párrafo
 * usando el metadataStream de msedge-tts (eventos WordBoundary).
 *
 * Retorna { audio: Buffer, timings: number[] }
 * donde timings[i] = segundo exacto en que el TTS empieza a leer el párrafo i.
 */
async function generateAudioWithTimings(text, voice) {
  const cleanedText = cleanForTTS(text);
  const chunks = chunkText(text); // ya están limpios (chunkText llama cleanForTTS)

  // Construir mapa global: índice de palabra → índice de párrafo
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
        const offsetMs  = (event.offset  ?? 0) / 10000;   // 100ns → ms
        const durMs     = (event.duration ?? 0) / 10000;
        const absoluteMs = chunkStartMs + offsetMs;
        chunkEndMs = Math.max(chunkEndMs, offsetMs + durMs);

        // Registrar el primer tiempo de cada párrafo
        if (globalWordIdx < wordParaMap.length) {
          const pi = wordParaMap[globalWordIdx];
          if (paraTimingsMs[pi] < 0) paraTimingsMs[pi] = absoluteMs;
        }
        globalWordIdx++;
      });
    });

    const buf = Buffer.concat(bufs);
    allBuffers.push(buf);
    // Si no hubo eventos (metadataStream no disponible), estimar por tamaño de buffer
    chunkStartMs += chunkEndMs > 0 ? chunkEndMs : buf.length / 12;
  }

  // Asegurar que el párrafo 0 empiece en 0
  if (paraTimingsMs[0] < 0) paraTimingsMs[0] = 0;
  // Rellenar huecos hacia adelante
  let last = 0;
  for (let i = 0; i < paraTimingsMs.length; i++) {
    if (paraTimingsMs[i] >= 0) last = paraTimingsMs[i];
    else paraTimingsMs[i] = last;
  }

  return {
    audio: Buffer.concat(allBuffers),
    timings: paraTimingsMs.map(ms => Math.round(ms) / 1000), // ms → segundos
  };
}

async function uploadAndSave(workSlug, workId, chapterNum, title, lang, voice, text) {
  process.stdout.write(`    Cap ${chapterNum}: ${title.slice(0, 50)}... `);
  try {
    const cleanText = cleanForTTS(text);
    const { audio, timings } = await generateAudioWithTimings(text, voice);
    if (audio.length === 0) throw new Error('audio vacío');
    const path = `${workSlug}/${lang}/${chapterNum}.mp3`;
    const { error: upErr } = await supabase.storage
      .from('audio').upload(path, audio, { contentType: 'audio/mpeg', upsert: true });
    if (upErr) throw upErr;
    const { data } = supabase.storage.from('audio').getPublicUrl(path);
    await supabase.from('chapters').upsert({
      work_id: workId, chapter_number: chapterNum,
      title, lang, audio_url: data.publicUrl,
      content: cleanText,
      paragraph_timings: timings,
    }, { onConflict: 'work_id,chapter_number,lang' });
    console.log(`✓ (${timings.length} párrafos timed)`);
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

    // Preflight: verificar el primer capítulo en representación del lote
    preflightCheck(chapters[0].text, `${work.slug} cap 1`);

    for (let i = 0; i < chapters.length; i++) {
      await uploadAndSave(work.slug, workId, i + 1, chapters[i].title, job.lang, job.voice, chapters[i].text);
    }
  }
}

console.log('\n✅ Listo!');
