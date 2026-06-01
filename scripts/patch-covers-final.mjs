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

const d = ms => new Promise(r => setTimeout(r, ms));
const SKIP = [/logo/i,/icon/i,/commons/i,/wikimedia/i,/flag/i,/stamp/i,/signature/i,/portal/i,/disambig/i,/question/i,/lock/i,/edit-clear/i,/audio/i,/\.svg$/i,/\.pdf$/i,/\.ogg$/i,/\.webm$/i];
const isGood = t => !SKIP.some(p => p.test(t));

async function ci(query) {
  const url = 'https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=' +
    encodeURIComponent(query) +
    '&gsrnamespace=6&gsrlimit=5&prop=imageinfo&iiprop=url&iiurlwidth=600&format=json&origin=*';
  const res = await fetch(url, { headers: { 'User-Agent': 'Lectoria/1.0' } });
  if (!res.ok) return null;
  const pages = (await res.json())?.query?.pages ?? {};
  const imgs = Object.values(pages).filter(p =>
    p.imageinfo?.[0]?.url && isGood(p.title ?? '') && /\.(jpe?g|png|webp)$/i.test(p.title ?? '')
  );
  return imgs.length > 0 ? imgs[0].imageinfo[0].url : null;
}

const TARGETS = [
  ['el-estudiante',                               'Easter bonfire flame night'],
  ['el-obispo',                                   'Orthodox bishop church Russia'],
  ['el-crimen-de-lord-arthur-savile',             'Victorian formal evening London'],
  ['el-bacilo-robado',                            'laboratory chemist 1890'],
  ['la-miel-silvestre',                           'bee swarm tree'],
  ['el-gato-que-caminaba-solo',                   'cat night illustration'],
  ['como-dirigi-un-diario-de-agricultura-una-vez', 'American farm barn 1890'],
];

const { data: works } = await supabase.from('works').select('id, slug');
const bySlug = Object.fromEntries(works.map(w => [w.slug, w]));

for (const [slug, query] of TARGETS) {
  await d(3000);
  const img = await ci(query);
  process.stdout.write(slug.padEnd(48) + ' -> ');
  if (!img) { console.log('sin imagen'); continue; }
  const work = bySlug[slug];
  if (!work) { console.log('no en DB'); continue; }
  const { error } = await supabase.from('works').update({ cover_url: img }).eq('id', work.id);
  console.log(error ? 'ERROR: ' + error.message : 'OK');
}
console.log('\nListo.');
