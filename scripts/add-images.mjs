/**
 * Busca y guarda fotos de autores (Wikipedia) y portadas (Open Library).
 * Uso: node scripts/add-images.mjs
 * Lee las claves desde .env.local automáticamente.
 */
import { createClient } from '@supabase/supabase-js';
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

async function getWikipediaPhoto(pageTitle) {
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(pageTitle)}`;
  const res = await fetch(url);
  const data = await res.json();
  return data.thumbnail?.source ?? null;
}

async function getBookCover(title, author) {
  const q = encodeURIComponent(`${title} ${author}`);
  const res = await fetch(`https://openlibrary.org/search.json?q=${q}&fields=cover_i&limit=1`);
  const data = await res.json();
  const coverId = data.docs?.[0]?.cover_i;
  return coverId ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg` : null;
}

const authorPhotos = [
  { slug: 'miguel-de-cervantes', wiki: 'Miguel de Cervantes' },
  { slug: 'horacio-quiroga',     wiki: 'Horacio Quiroga' },
  { slug: 'edgar-allan-poe',     wiki: 'Edgar Allan Poe' },
  { slug: 'bram-stoker',         wiki: 'Bram Stoker' },
  { slug: 'mary-shelley',        wiki: 'Mary Shelley' },
  { slug: 'franz-kafka',         wiki: 'Franz Kafka' },
  { slug: 'herman-melville',     wiki: 'Herman Melville' },
  { slug: 'lewis-carroll',       wiki: 'Lewis Carroll' },
  { slug: 'f-scott-fitzgerald',  wiki: 'F. Scott Fitzgerald' },
];

console.log('Buscando fotos de autores...');
for (const { slug, wiki } of authorPhotos) {
  const photo_url = await getWikipediaPhoto(wiki);
  if (photo_url) {
    await supabase.from('authors').update({ photo_url }).eq('slug', slug);
    console.log(`  + ${wiki}`);
  } else {
    console.log(`  - ${wiki} sin foto`);
  }
}

const bookCovers = [
  { slug: 'don-quijote',         title: 'Don Quijote',       author: 'Cervantes' },
  { slug: 'don-quixote',         title: 'Don Quixote',       author: 'Cervantes' },
  { slug: 'dracula',             title: 'Dracula',            author: 'Stoker' },
  { slug: 'dracula-en',          title: 'Dracula',            author: 'Stoker' },
  { slug: 'frankenstein',        title: 'Frankenstein',       author: 'Shelley' },
  { slug: 'frankenstein-en',     title: 'Frankenstein',       author: 'Shelley' },
  { slug: 'la-metamorfosis',     title: 'Metamorphosis',      author: 'Kafka' },
  { slug: 'moby-dick',           title: 'Moby Dick',          author: 'Melville' },
  { slug: 'moby-dick-es',        title: 'Moby Dick',          author: 'Melville' },
  { slug: 'alice-in-wonderland', title: 'Alice Wonderland',   author: 'Carroll' },
  { slug: 'the-great-gatsby',    title: 'Great Gatsby',       author: 'Fitzgerald' },
  { slug: 'el-almohadon-de-plumas', title: 'The Feather Pillow', author: 'Quiroga' },
  { slug: 'the-feather-pillow',  title: 'The Feather Pillow', author: 'Quiroga' },
  { slug: 'a-la-deriva',         title: 'A la deriva',        author: 'Quiroga' },
  { slug: 'the-tell-tale-heart', title: 'Tell Tale Heart',    author: 'Poe' },
  { slug: 'el-corazon-delator',  title: 'Tell Tale Heart',    author: 'Poe' },
];

console.log('\nBuscando portadas...');
for (const { slug, title, author } of bookCovers) {
  const cover_url = await getBookCover(title, author);
  if (cover_url) {
    await supabase.from('works').update({ cover_url }).eq('slug', slug);
    console.log(`  + ${title}`);
  } else {
    console.log(`  - ${title} (usa gradiente)`);
  }
}

console.log('\nListo.');
