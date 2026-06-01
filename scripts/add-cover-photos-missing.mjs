/**
 * Agrega fotos a los autores que quedaron sin imagen usando la API de Wikipedia.
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

const MISSING = {
  'horacio-quiroga':     'Horacio_Quiroga',
  'kate-chopin':         'Kate_Chopin',
  'rudyard-kipling':     'Rudyard_Kipling',
  'miguel-de-cervantes': 'Miguel_de_Cervantes',
  'bram-stoker':         'Bram_Stoker',
  'mary-shelley':        'Mary_Shelley',
  'lewis-carroll':       'Lewis_Carroll',
  'f-scott-fitzgerald':  'F._Scott_Fitzgerald',
};

async function getPortrait(wikiTitle) {
  // Usar action=query con prop=pageimages
  const url = 'https://en.wikipedia.org/w/api.php?action=query&titles=' +
    encodeURIComponent(wikiTitle) +
    '&prop=pageimages&format=json&pithumbsize=600&origin=*';

  const res = await fetch(url, {
    headers: { 'User-Agent': 'Lectoria/1.0 (lectoria.app)' }
  });
  if (!res.ok) return null;
  const data = await res.json();
  const pages = data?.query?.pages ?? {};
  const page = Object.values(pages)[0];
  return page?.thumbnail?.source ?? null;
}

const { data: authors } = await supabase.from('authors').select('id, slug, name');
const authorMap = Object.fromEntries(authors.map(a => [a.slug, a]));

console.log('Buscando retratos faltantes...\n');
let updated = 0;

for (const [authorSlug, wikiTitle] of Object.entries(MISSING)) {
  const author = authorMap[authorSlug];
  if (!author) { console.log('No encontrado en DB: ' + authorSlug); continue; }

  process.stdout.write(author.name.padEnd(25) + ' -> ');
  const imageUrl = await getPortrait(wikiTitle);

  if (!imageUrl) {
    console.log('sin imagen en Wikipedia');
    continue;
  }

  const { data: works } = await supabase.from('works').select('id').eq('author_id', author.id);
  const { error } = await supabase.from('works').update({ cover_url: imageUrl }).eq('author_id', author.id);

  if (error) {
    console.log('DB error: ' + error.message);
  } else {
    console.log('OK (' + (works?.length ?? 0) + ' works) ' + imageUrl.slice(0, 60) + '...');
    updated += works?.length ?? 0;
  }
  await new Promise(r => setTimeout(r, 400));
}

console.log('\nTotal adicionales: ' + updated + ' works con foto.');
