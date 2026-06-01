/**
 * Agrega fotos de portada a todos los works usando retratos de Wikipedia.
 * Uso: node scripts/add-cover-photos.mjs
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

// Mapa author_slug -> nombre en Wikipedia
const WIKI = {
  'jack-london':          'Jack_London',
  'edgar-allan-poe':      'Edgar_Allan_Poe',
  'guy-de-maupassant':    'Guy_de_Maupassant',
  'anton-chekhov':        'Anton_Chekhov',
  'oscar-wilde':          'Oscar_Wilde',
  'ambrose-bierce':       'Ambrose_Bierce',
  'o-henry':              'O._Henry',
  'franz-kafka':          'Franz_Kafka',
  'lev-tolstoi':          'Leo_Tolstoy',
  'h-g-wells':            'H._G._Wells',
  'h-p-lovecraft':        'H._P._Lovecraft',
  'horacio-quiroga':      'Horacio_Quiroga',
  'kate-chopin':          'Kate_Chopin',
  'rudyard-kipling':      'Rudyard_Kipling',
  'mark-twain':           'Mark_Twain',
  'miguel-de-cervantes':  'Miguel_de_Cervantes',
  'bram-stoker':          'Bram_Stoker',
  'mary-shelley':         'Mary_Shelley',
  'herman-melville':      'Herman_Melville',
  'lewis-carroll':        'Lewis_Carroll',
  'f-scott-fitzgerald':   'F._Scott_Fitzgerald',
};

async function getWikipediaPortrait(wikiSlug) {
  const url = 'https://en.wikipedia.org/api/rest_v1/page/summary/' + wikiSlug;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Lectoria/1.0 (lectoria.app)' }
  });
  if (!res.ok) return null;
  const data = await res.json();
  // Preferir original, sino thumbnail
  return data.originalimage?.source ?? data.thumbnail?.source ?? null;
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

// Cargar todos los autores
const { data: authors } = await supabase.from('authors').select('id, slug, name');
const authorMap = Object.fromEntries(authors.map(a => [a.slug, a]));

console.log('Buscando retratos en Wikipedia...\n');

const portraits = {};
for (const [authorSlug, wikiSlug] of Object.entries(WIKI)) {
  process.stdout.write(authorSlug.padEnd(25) + ' -> ');
  try {
    const url = await getWikipediaPortrait(wikiSlug);
    if (url) {
      portraits[authorSlug] = url;
      console.log('OK');
    } else {
      console.log('sin imagen');
    }
  } catch (e) {
    console.log('ERROR: ' + e.message);
  }
  await delay(300);
}

console.log('\nActualizando works en DB...\n');

let updated = 0, skipped = 0;
for (const [authorSlug, imageUrl] of Object.entries(portraits)) {
  const author = authorMap[authorSlug];
  if (!author) { console.log('Autor no encontrado en DB: ' + authorSlug); continue; }

  const { data: works, error } = await supabase
    .from('works')
    .select('id, slug, title')
    .eq('author_id', author.id);

  if (error || !works?.length) { skipped++; continue; }

  const { error: upErr } = await supabase
    .from('works')
    .update({ cover_url: imageUrl })
    .eq('author_id', author.id);

  if (upErr) {
    console.log('Error en ' + authorSlug + ': ' + upErr.message);
  } else {
    console.log(author.name.padEnd(25) + ' -> ' + works.length + ' work(s) actualizados');
    updated += works.length;
  }
}

console.log('\nListo. ' + updated + ' works con foto de portada.');
