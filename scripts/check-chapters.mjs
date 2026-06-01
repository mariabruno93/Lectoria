import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const envFile = readFileSync('D:/Documents/Desktop/lectoria/.env.local', 'utf8');
const env = Object.fromEntries(
  envFile.split('\n').filter(l => l.includes('=')).map(l => {
    const [k, ...v] = l.split('=');
    return [k.trim(), v.join('=').trim()];
  })
);

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

// Ver todos los chapters con sus lang y si tienen audio_url
const { data, error } = await supabase
  .from('chapters')
  .select('id, work_id, chapter_number, lang, title, audio_url')
  .order('work_id')
  .order('chapter_number');

if (error) { console.error(error); process.exit(1); }

console.log('Total chapters:', data.length);
console.log('');

// Agrupar por work_id
const byWork = {};
for (const ch of data) {
  const key = ch.work_id;
  if (!byWork[key]) byWork[key] = [];
  byWork[key].push(ch);
}

for (const [workId, chapters] of Object.entries(byWork)) {
  console.log('work_id:', workId);
  for (const ch of chapters) {
    const hasAudio = ch.audio_url ? '✓audio' : '✗noaudio';
    console.log('  cap', ch.chapter_number, '| lang:', ch.lang ?? 'NULL', '|', hasAudio, '|', ch.title?.slice(0,40));
  }
  console.log('');
}

// Detectar duplicados: mismo work_id + chapter_number + lang
const seen = {};
const duplicates = [];
for (const ch of data) {
  const key = `${ch.work_id}__${ch.chapter_number}__${ch.lang ?? 'NULL'}`;
  if (seen[key]) {
    duplicates.push({ key, ch });
  } else {
    seen[key] = ch;
  }
}

if (duplicates.length > 0) {
  console.log('=== DUPLICADOS DETECTADOS ===');
  for (const d of duplicates) {
    console.log('  key:', d.key, '| id duplicado:', d.ch.id);
  }
} else {
  console.log('=== Sin duplicados por (work_id + chapter_number + lang) ===');
}
