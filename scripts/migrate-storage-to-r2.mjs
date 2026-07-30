#!/usr/bin/env node
// Migración one-shot: Supabase Storage → Cloudflare R2.
// Maria 2026-07-30. Se ejecuta con:
//   node scripts/migrate-storage-to-r2.mjs
//
// Recorre los buckets de Supabase Storage (covers, audio, protected), baja
// cada archivo y lo sube a R2 preservando el path original con el prefijo
// que espera el adapter r2.ts.
//
// Idempotente: si el objeto ya existe en R2, lo sobrescribe (upsert).

import { createClient } from '@supabase/supabase-js';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { config } from 'dotenv';

// Next.js usa .env.local por convención; dotenv por default lee solo .env.
config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const R2_ENDPOINT = process.env.R2_ENDPOINT;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_PUBLIC = process.env.R2_BUCKET_PUBLIC || 'epovox';
const R2_BUCKET_PROTECTED = process.env.R2_BUCKET_PROTECTED || 'epovox-protected';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}
if (!R2_ENDPOINT || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
  console.error('Faltan las env vars de R2 (R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY)');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const r2 = new S3Client({
  region: 'auto',
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

// Mismo mapping que src/lib/r2.ts.
const BUCKET_MAP = {
  covers: { r2Bucket: R2_BUCKET_PUBLIC, prefix: 'covers/' },
  audio: { r2Bucket: R2_BUCKET_PUBLIC, prefix: 'audio/' },
  protected: { r2Bucket: R2_BUCKET_PROTECTED, prefix: '' },
};

const CONTENT_TYPE_BY_EXT = {
  webp: 'image/webp',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  mp3: 'audio/mpeg',
  mp4: 'audio/mp4',
  m4a: 'audio/mp4',
  wav: 'audio/wav',
};

function guessContentType(filename) {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  return CONTENT_TYPE_BY_EXT[ext] ?? 'application/octet-stream';
}

// Recorre recursivamente un bucket de Supabase Storage.
async function listAllFiles(bucket, prefix = '') {
  const all = [];
  let offset = 0;
  const LIMIT = 100;
  while (true) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(prefix, { limit: LIMIT, offset });
    if (error) {
      console.error(`  ✗ list ${bucket}/${prefix}: ${error.message}`);
      break;
    }
    if (!data || data.length === 0) break;
    for (const item of data) {
      // Supabase mezcla archivos (con id) y carpetas (sin id).
      if (item.id) {
        all.push(prefix ? `${prefix}/${item.name}` : item.name);
      } else {
        // Carpeta: recursión.
        const sub = await listAllFiles(bucket, prefix ? `${prefix}/${item.name}` : item.name);
        all.push(...sub);
      }
    }
    if (data.length < LIMIT) break;
    offset += LIMIT;
  }
  return all;
}

async function migrateBucket(supabaseBucket) {
  const cfg = BUCKET_MAP[supabaseBucket];
  if (!cfg) {
    console.error(`✗ bucket "${supabaseBucket}" no está mapeado`);
    return;
  }
  console.log(`\n=== ${supabaseBucket} → R2 ${cfg.r2Bucket}/${cfg.prefix} ===`);

  const files = await listAllFiles(supabaseBucket);
  console.log(`  ${files.length} archivos encontrados`);

  let ok = 0;
  let fail = 0;
  for (const path of files) {
    try {
      const { data: blob, error: dlError } = await supabase.storage
        .from(supabaseBucket)
        .download(path);
      if (dlError || !blob) throw new Error(dlError?.message ?? 'download vacío');

      const bytes = new Uint8Array(await blob.arrayBuffer());
      const key = cfg.prefix + path;
      await r2.send(
        new PutObjectCommand({
          Bucket: cfg.r2Bucket,
          Key: key,
          Body: bytes,
          ContentType: guessContentType(path),
        }),
      );
      ok++;
      process.stdout.write(`\r  ✓ ${ok}/${files.length}   `);
    } catch (err) {
      fail++;
      console.error(`\n  ✗ ${path}: ${err.message}`);
    }
  }
  console.log(`\n  Total: ${ok} OK, ${fail} fallaron`);
}

async function main() {
  console.log('Migración Supabase Storage → Cloudflare R2');
  console.log(`  Origen : ${SUPABASE_URL}`);
  console.log(`  Destino: ${R2_ENDPOINT}`);

  for (const b of ['covers', 'audio', 'protected']) {
    await migrateBucket(b);
  }
  console.log('\n✅ Migración completa.');
}

main().catch((err) => {
  console.error('\n💥 Falla fatal:', err);
  process.exit(1);
});
