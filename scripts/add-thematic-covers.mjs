/**
 * Reemplaza las fotos de autores por imágenes temáticas de cada cuento.
 * Fuente 1: artículo de Wikipedia del cuento (REST API media-list)
 * Fuente 2: búsqueda en Wikimedia Commons por keywords del cuento
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

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

async function fetchWithRetry(url, opts, retries = 3) {
  for (let i = 0; i < retries; i++) {
    const res = await fetch(url, opts);
    if (res.status === 429 || res.status === 503) {
      await delay(3000 * (i + 1));
      continue;
    }
    return res;
  }
  return null;
}

// SKIP list: títulos de archivo que no queremos (logos, mapas, íconos, etc.)
const SKIP_PATTERNS = [
  /logo/i, /icon/i, /commons/i, /wikimedia/i, /flag/i, /stamp/i,
  /signature/i, /portal/i, /disambig/i, /question/i, /lock/i,
  /edit-clear/i, /audio/i, /\.svg$/i, /\.pdf$/i, /\.ogg$/i, /\.webm$/i,
];

function isGoodImage(title) {
  return !SKIP_PATTERNS.some(p => p.test(title));
}

// Wikipedia REST API: media-list de un artículo
async function getWikipediaArticleImage(wikiTitle) {
  const decoded = decodeURIComponent(wikiTitle);
  const url = 'https://en.wikipedia.org/api/rest_v1/page/media-list/' +
    encodeURIComponent(decoded);
  const res = await fetchWithRetry(url, { headers: { 'User-Agent': 'Lectoria/1.0 (lectoria.app)' } });
  if (!res || !res.ok) return null;
  const data = await res.json();
  const items = data?.items ?? [];

  // Filtrar: tipo image, con srcset, nombre de archivo aceptable
  const imgs = items.filter(i =>
    i.type === 'image' &&
    i.srcset?.length > 0 &&
    isGoodImage(i.title ?? '')
  );

  if (imgs.length === 0) return null;

  // Tomar la mayor resolución disponible de la primera imagen buena
  const item = imgs[0];
  const best = item.srcset[item.srcset.length - 1]?.src;
  if (!best) return null;

  // Asegurar https://
  return best.startsWith('//') ? 'https:' + best : best;
}

// Wikimedia Commons: buscar imagen por keywords usando generator=search
async function getCommonsImage(query) {
  const searchUrl = 'https://commons.wikimedia.org/w/api.php?action=query' +
    '&generator=search&gsrsearch=' + encodeURIComponent(query) +
    '&gsrnamespace=6&gsrlimit=5&prop=imageinfo&iiprop=url&iiurlwidth=600' +
    '&format=json&origin=*';
  const res = await fetchWithRetry(searchUrl, { headers: { 'User-Agent': 'Lectoria/1.0 (lectoria.app)' } });
  if (!res || !res.ok) return null;
  const data = await res.json();
  const pages = data?.query?.pages ?? {};
  // Filtrar imágenes válidas (jpg/png/webp) y que pasen el filtro
  const imgs = Object.values(pages).filter(p =>
    p.imageinfo?.[0]?.url &&
    isGoodImage(p.title ?? '') &&
    /\.(jpe?g|png|webp)$/i.test(p.title ?? '')
  );
  if (imgs.length === 0) return null;
  return imgs[0].imageinfo[0].url;
}

// Wikipedia título del cuento Y/O keywords para buscar imagen temática
// wikipedia: artículo en EN Wikipedia (REST API media-list)
// commons: búsqueda en Wikimedia Commons si Wikipedia no tiene imagen
const COVERS = {
  // Jack London
  'amor-a-la-vida':              { wikipedia: 'Love_of_Life_(short_story)', commons: 'Yukon wilderness landscape' },
  'el-silencio-blanco':          { wikipedia: 'The_White_Silence', commons: 'Yukon winter wilderness snow' },
  'batard':                      { wikipedia: 'Batard_(short_story)', commons: 'sled dog Alaska Yukon' },
  'el-hijo-del-lobo':            { wikipedia: 'The_Son_of_the_Wolf', commons: 'Klondike gold rush 1898' },
  'el-fuego-de-la-hoguera':      { wikipedia: 'To_Build_a_Fire', commons: 'campfire snow winter wilderness' },
  'la-ley-de-la-vida':           { commons: 'wilderness campfire' },
  'aloha-oe':                    { commons: 'Hawaii ocean beach landscape' },
  'el-pagano':                   { commons: 'Polynesia island ocean Pacific' },
  'el-chinago':                  { commons: 'Tahiti 1900' },
  'el-vagabundo-y-el-hada':      { commons: 'American countryside road 1900' },
  'donde-se-bifurca-el-camino':  { commons: 'Yukon wilderness winter' },

  // Poe
  'el-corazon-delator':          { wikipedia: 'The_Tell-Tale_Heart', commons: 'dark room floorboards candle' },
  'el-gato-negro':               { wikipedia: 'The_Black_Cat_(short_story)', commons: 'black cat dark cellar Victorian' },
  'la-caida-de-la-casa-usher':   { wikipedia: 'The_Fall_of_the_House_of_Usher', commons: 'gothic mansion ruins dark lake' },
  'berenice':                    { wikipedia: 'Berenice_(short_story)', commons: 'gothic cemetery tomb 1800s' },
  'el-barril-de-amontillado':    { wikipedia: 'The_Cask_of_Amontillado', commons: 'wine cellar cask barrel brick' },
  'el-pozo-y-el-pendulo':        { wikipedia: 'The_Pit_and_the_Pendulum', commons: 'dungeon pendulum Inquisition' },
  'william-wilson':              { wikipedia: 'William_Wilson_(short_story)', commons: 'doppelganger mirror Victorian' },
  'ligeia':                      { wikipedia: 'Ligeia', commons: 'gothic revival Victorian interior candle' },
  'los-crimenes-de-la-calle-morgue': { wikipedia: 'The_Murders_in_the_Rue_Morgue', commons: 'Paris street 1800s night' },

  // Maupassant
  'el-collar':                   { wikipedia: 'The_Necklace', commons: 'diamond necklace jewelry Victorian' },
  'bola-de-sebo':                { wikipedia: 'Boule_de_Suif', commons: 'Franco-Prussian War 1870 snow carriage' },
  'el-horla':                    { wikipedia: 'The_Horla', commons: 'Normandy France countryside manor' },
  'dos-amigos':                  { commons: 'Paris siege 1870 Franco-Prussian War' },
  'miss-harriet':                { commons: 'Normandy France 1880' },

  // Chekhov
  'el-estudiante':               { commons: 'Russian Easter Orthodox bonfire spring' },
  'el-obispo':                   { commons: 'Russian Orthodox church bishop ceremony' },
  'el-monje-negro':              { wikipedia: 'The_Black_Monk', commons: 'Russian monastery garden orchard' },

  // Wilde
  'el-fantasma-de-canterville':  { wikipedia: 'The_Canterville_Ghost', commons: 'English manor ghost Victorian castle' },
  'el-principe-feliz':           { wikipedia: 'The_Happy_Prince_and_Other_Tales', commons: 'golden statue swallow city' },
  'el-ruisenor-y-la-rosa':       { commons: 'nightingale rose garden' },
  'el-gigante-egoista':          { commons: 'garden children play' },
  'el-crimen-de-lord-arthur-savile': { commons: 'Victorian London society ball' },

  // Bierce
  'el-jinete-en-el-cielo':       { wikipedia: 'A_Horseman_in_the_Sky', commons: 'Civil War soldier cliff horse' },
  'parker-adderson-filosofo':    { commons: 'Civil War soldier prisoner' },

  // O. Henry
  'el-regalo-de-los-reyes-magos':{ wikipedia: 'The_Gift_of_the_Magi', commons: 'Christmas gift Victorian couple' },
  'la-ultima-hoja':              { commons: 'ivy vine wall' },

  // Kafka
  'ante-la-ley':                 { wikipedia: 'Before_the_Law', commons: 'door gate guard law entrance' },
  'la-metamorfosis':             { wikipedia: 'The_Metamorphosis', commons: 'insect giant beetle room' },

  // Tolstoy
  'cuanta-tierra-necesita-un-hombre': { wikipedia: 'How_Much_Land_Does_a_Man_Need%3F', commons: 'Russian steppe field peasant running' },
  'despues-del-baile':           { commons: 'Russian dance ballroom' },
  'dios-ve-la-verdad-pero-no-la-dice-cuando-quiere': { commons: 'Siberia Russia exile prison' },

  // Wells
  'el-bacilo-robado':            { commons: 'laboratory scientist microscope' },
  'el-pais-de-los-ciegos':       { wikipedia: 'The_Country_of_the_Blind', commons: 'Andean valley hidden village mountains' },
  'la-puerta-en-el-muro':        { wikipedia: 'The_Door_in_the_Wall_(short_story)', commons: 'green door garden wall London' },

  // Lovecraft
  'la-llamada-de-cthulhu':       { wikipedia: 'The_Call_of_Cthulhu', commons: 'ocean deep sea monster tentacle' },
  'dagon':                       { wikipedia: 'Dagon_(short_story)', commons: 'ocean abyss sea creature island' },
  'el-color-que-cayo-del-cielo': { wikipedia: 'The_Colour_Out_of_Space', commons: 'meteorite crater farm strange light' },

  // Quiroga (new)
  'el-hijo':                     { commons: 'Misiones Argentina jungle forest dense' },
  'el-alambre-de-pua':           { commons: 'barbed wire fence field rural' },
  'la-miel-silvestre':           { commons: 'wild honeybee nest forest' },

  // Chopin
  'historia-de-una-hora':        { commons: 'woman sitting window room' },
  'la-tormenta-chopin':          { commons: 'bayou Louisiana' },

  // Kipling
  'el-hombre-que-pudo-ser-rey':  { wikipedia: 'The_Man_Who_Would_Be_King', commons: 'Afghanistan mountains Kafiristan king' },
  'rikki-tikki-tavi':            { wikipedia: 'Rikki-Tikki-Tavi', commons: 'mongoose cobra snake India garden' },
  'el-gato-que-caminaba-solo':   { wikipedia: 'The_Cat_That_Walked_by_Himself', commons: 'wild cat forest prehistoric cave' },

  // Twain
  'como-dirigi-un-diario-de-agricultura-una-vez': { commons: 'American farm countryside 1870' },

  // Libros existentes
  'don-quijote':                 { wikipedia: 'Don_Quixote', commons: 'Don Quixote windmill Sancho Panza' },
  'don-quixote':                 { wikipedia: 'Don_Quixote', commons: 'Don Quixote windmill Sancho Panza' },
  'dracula':                     { wikipedia: 'Dracula', commons: 'Dracula vampire gothic castle Transylvania' },
  'dracula-en':                  { wikipedia: 'Dracula', commons: 'Dracula vampire gothic castle Transylvania' },
  'frankenstein':                { wikipedia: 'Frankenstein', commons: 'Frankenstein monster laboratory gothic' },
  'frankenstein-en':             { wikipedia: 'Frankenstein', commons: 'Frankenstein monster laboratory gothic' },
  'moby-dick':                   { wikipedia: 'Moby-Dick', commons: 'whale ship sea ocean hunt Ahab' },
  'moby-dick-es':                { wikipedia: 'Moby-Dick', commons: 'whale ship sea ocean hunt Ahab' },
  'alice-in-wonderland':         { wikipedia: "Alice's_Adventures_in_Wonderland", commons: 'Alice Wonderland rabbit hole illustration' },
  'the-great-gatsby':            { wikipedia: 'The_Great_Gatsby', commons: 'jazz age 1920s party mansion' },

  // Quiroga existentes
  'el-almohadon-de-plumas':      { commons: 'Victorian bedroom interior' },
  'la-gallina-degollada':        { commons: 'hen chicken farmyard' },
  'a-la-deriva':                 { commons: 'Amazon river jungle boat' },
  'la-insolacion':               { commons: 'Argentine landscape sunset' },
  'la-meningitis-y-su-sombra':   { commons: 'hospital interior Victorian' },
};

// Main
const { data: allWorks } = await supabase.from('works').select('id, slug, title');
const workBySlug = Object.fromEntries(allWorks.map(w => [w.slug, w]));

console.log('Buscando imagenes tematicas...\n');
let updated = 0, notFound = 0;

for (const [slug, source] of Object.entries(COVERS)) {
  const work = workBySlug[slug];
  if (!work) { continue; }

  process.stdout.write(slug.padEnd(50) + ' -> ');

  let imageUrl = null;

  try {
    if (source.wikipedia) {
      imageUrl = await getWikipediaArticleImage(source.wikipedia);
    }
    if (!imageUrl && source.commons) {
      imageUrl = await getCommonsImage(source.commons);
    }
  } catch(e) {
    console.log('ERROR: ' + e.message);
    notFound++;
    await delay(500);
    continue;
  }

  if (!imageUrl) {
    console.log('sin imagen');
    notFound++;
    await delay(300);
    continue;
  }

  const { error } = await supabase.from('works').update({ cover_url: imageUrl }).eq('id', work.id);
  if (error) {
    console.log('DB error: ' + error.message);
  } else {
    console.log('OK');
    updated++;
  }

  await delay(2500);
}

console.log('\n--------------------------------------');
console.log('Actualizados: ' + updated + '  Sin imagen: ' + notFound);
