/**
 * Crea autores y works en Supabase para los cuentos de ciudadseva.
 * Uso: node scripts/setup-ciudadseva-db.mjs
 *
 * - Hace upsert de autores (seguro si ya existen: edgar-allan-poe, franz-kafka, horacio-quiroga)
 * - Hace upsert de works (crea o actualiza por slug)
 * - NO toca capítulos ni audio — eso lo hace seed-ciudadseva.mjs
 */
import { createClient } from '@supabase/supabase-js';
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

// ── 1. Upsert autores ─────────────────────────────────────────────────────

console.log('\n── Autores ──────────────────────────────────────────────');
const authorRows = AUTHORS.map(a => ({
  slug: a.slug,
  name: a.name,
  nationality: a.nationality,
  born_year: a.born_year,
  died_year: a.died_year,
  bio: a.bio,
}));

const { error: authErr } = await supabase
  .from('authors')
  .upsert(authorRows, { onConflict: 'slug' });

if (authErr) {
  console.error('Error upsertando autores:', authErr.message);
  process.exit(1);
}
console.log(`✓ ${authorRows.length} autores upserted`);

// ── 2. Cargar mapa slug→id de autores ────────────────────────────────────

const { data: allAuthors } = await supabase.from('authors').select('id, slug');
const authorById = Object.fromEntries(allAuthors.map(a => [a.slug, a.id]));

// ── 3. Upsert works ───────────────────────────────────────────────────────

console.log('\n── Works ────────────────────────────────────────────────');

// Colores y voces vienen del catálogo de autores
const authorMeta = Object.fromEntries(AUTHORS.map(a => [a.slug, a]));

const workRows = STORIES
  .filter(s => !s.skipIfExists)  // Excluir los que explícitamente pedimos saltar
  .map(s => {
    const meta = authorMeta[s.authorSlug] ?? {};
    return {
      slug: s.slug,
      title: s.title,
      type: 'story',
      author_id: authorById[s.authorSlug],
      language: 'es',
      year: s.year,
      description: s.description,
      genre: meta.genre ?? ['Clásico'],
      cover_gradient_from: meta.coverFrom ?? '#1A1816',
      cover_gradient_to: meta.coverTo ?? '#0D0C0B',
      featured: false,
      translation_slug: null,
    };
  });

// Verificar que todos tienen author_id
const missing = workRows.filter(w => !w.author_id);
if (missing.length > 0) {
  console.error('⚠ Autores faltantes en DB:', missing.map(w => w.slug));
}

const validRows = workRows.filter(w => w.author_id);
const { error: workErr } = await supabase
  .from('works')
  .upsert(validRows, { onConflict: 'slug' });

if (workErr) {
  console.error('Error upsertando works:', workErr.message);
  process.exit(1);
}
console.log(`✓ ${validRows.length} works upserted`);

// ── 4. Resumen ────────────────────────────────────────────────────────────

const { data: counts } = await supabase
  .from('works')
  .select('slug', { count: 'exact' })
  .eq('type', 'story');

console.log(`\n✓ Total cuentos en DB: ${counts?.length ?? '?'}`);
console.log('\nListo. Ahora ejecuta: node scripts/seed-ciudadseva.mjs\n');
