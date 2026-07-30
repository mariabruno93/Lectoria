#!/usr/bin/env node
// Segunda mitad de la migración a Cloudflare R2: reescribir las URLs que
// quedaron guardadas en la base apuntando a Supabase Storage.
// Maria 2026-07-30.
//
//   node scripts/rewrite-db-urls-to-r2.mjs                   → dry-run (no toca nada)
//   node scripts/rewrite-db-urls-to-r2.mjs --apply           → escribe de verdad
//   node scripts/rewrite-db-urls-to-r2.mjs --revert          → dry-run de la vuelta atrás
//   node scripts/rewrite-db-urls-to-r2.mjs --revert --apply  → vuelve todo a Supabase
//
// La conversión es determinista en los dos sentidos, así que --revert deshace
// exactamente lo que hizo --apply (mientras Supabase Storage siga vivo).
//
// Convierte
//   https://<proj>.supabase.co/storage/v1/object/public/<bucket>/<path>
// en
//   <NEXT_PUBLIC_R2_PUBLIC_URL>/<bucket>/<path>
//
// Sirve solo para los buckets públicos (covers, audio). El audio protegido no
// se toca: en la base guarda el endpoint gated /api/obra/<id>/audio, no la URL
// del archivo.
//
// Antes de correrlo con --apply, migrá los archivos: migrate-storage-to-r2.mjs.

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const APPLY = process.argv.includes('--apply');
const REVERT = process.argv.includes('--revert');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const R2_PUBLIC_URL = (process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? '').replace(/\/$/, '');

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}
if (!R2_PUBLIC_URL) {
  console.error('Falta NEXT_PUBLIC_R2_PUBLIC_URL (la Public Development URL del bucket epovox)');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

// Tablas y columnas donde puede haber una URL de Storage guardada.
const TARGETS = [
  { table: 'chapters', column: 'audio_url' },
  { table: 'works', column: 'cover_url' },
  { table: 'authors', column: 'photo_url' },
  { table: 'user_works', column: 'cover_url' },
  { table: 'profiles', column: 'avatar_url' },
];

// Los buckets públicos que se mudaron con el mismo nombre de prefijo en R2.
const PUBLIC_BUCKETS = new Set(['covers', 'audio']);

const STORAGE_RE = /^https?:\/\/[^/]+\.supabase\.co\/storage\/v1\/object\/(?:public|sign)\/([^/]+)\/(.+)$/;

// Devuelve la URL nueva, o null si no hay que tocarla.
function toR2Url(oldUrl) {
  if (typeof oldUrl !== 'string') return null;
  const m = oldUrl.match(STORAGE_RE);
  if (!m) return null;
  const [, bucket, rest] = m;
  if (!PUBLIC_BUCKETS.has(bucket)) return null;
  // El path puede traer cache-buster (?v=123) o token de firma: lo descartamos,
  // en R2 el objeto es público y estable.
  const path = rest.split('?')[0];
  return `${R2_PUBLIC_URL}/${bucket}/${decodeURIComponent(path)}`;
}

// La vuelta atrás: R2 → Supabase Storage.
function toSupabaseUrl(r2Url) {
  if (typeof r2Url !== 'string' || !r2Url.startsWith(`${R2_PUBLIC_URL}/`)) return null;
  const rest = r2Url.slice(R2_PUBLIC_URL.length + 1);
  const bucket = rest.split('/')[0];
  if (!PUBLIC_BUCKETS.has(bucket)) return null;
  return `${SUPABASE_URL.replace(/\/$/, '')}/storage/v1/object/public/${rest}`;
}

// Patrón con el que se buscan las filas a tocar, según la dirección.
const MATCH_LIKE = REVERT ? `${R2_PUBLIC_URL}%` : '%supabase.co/storage%';
const convert = REVERT ? toSupabaseUrl : toR2Url;

async function processTarget({ table, column }) {
  const { data, error } = await supabase
    .from(table)
    .select(`id, ${column}`)
    .like(column, MATCH_LIKE);

  if (error) {
    console.log(`\n${table}.${column} → no aplica (${error.message})`);
    return { changed: 0, skipped: 0, failed: 0 };
  }

  console.log(`\n=== ${table}.${column} — ${data.length} filas a convertir ===`);

  let changed = 0;
  let skipped = 0;
  let failed = 0;
  let shown = 0;

  for (const row of data) {
    const oldUrl = row[column];
    const newUrl = convert(oldUrl);

    if (!newUrl) {
      skipped++;
      if (shown < 3) {
        console.log(`  · sin mapeo, queda igual: ${oldUrl.slice(0, 90)}`);
        shown++;
      }
      continue;
    }

    if (shown < 3) {
      console.log(`  ${oldUrl.slice(0, 88)}`);
      console.log(`  → ${newUrl.slice(0, 88)}`);
      shown++;
    }

    if (APPLY) {
      const { error: upErr } = await supabase
        .from(table)
        .update({ [column]: newUrl })
        .eq('id', row.id);
      if (upErr) {
        failed++;
        console.error(`  ✗ ${row.id}: ${upErr.message}`);
        continue;
      }
    }
    changed++;
  }

  console.log(`  ${APPLY ? 'Actualizadas' : 'A actualizar'}: ${changed} · sin mapeo: ${skipped} · fallaron: ${failed}`);
  return { changed, skipped, failed };
}

async function main() {
  console.log(`Dirección: ${REVERT ? 'R2 → Supabase Storage (vuelta atrás)' : 'Supabase Storage → R2'}`);
  console.log(APPLY ? '⚠️  MODO ESCRITURA (--apply)' : '🔍 DRY-RUN — no se escribe nada. Usá --apply para aplicar.');
  console.log(`  R2: ${R2_PUBLIC_URL}`);

  const totals = { changed: 0, skipped: 0, failed: 0 };
  for (const t of TARGETS) {
    const r = await processTarget(t);
    totals.changed += r.changed;
    totals.skipped += r.skipped;
    totals.failed += r.failed;
  }

  console.log(`\n──────────────────────────────`);
  console.log(`Total ${APPLY ? 'actualizadas' : 'a actualizar'}: ${totals.changed}`);
  console.log(`Sin mapeo (quedan como están): ${totals.skipped}`);
  console.log(`Fallaron: ${totals.failed}`);
  if (!APPLY) {
    console.log(`\nSi la vista previa está bien: node scripts/rewrite-db-urls-to-r2.mjs${REVERT ? ' --revert' : ''} --apply`);
  }
}

main().catch((err) => {
  console.error('\n💥 Falla fatal:', err);
  process.exit(1);
});
