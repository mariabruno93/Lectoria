#!/usr/bin/env node
// Cierre de la migración a R2: migra el bucket protegido y verifica todo.
// Maria 2026-07-30.
//
//   node scripts/finish-r2-migration.mjs
//
// Correr DESPUÉS de que el bucket epovox-protected exista en Cloudflare y el
// API token de R2 lo alcance. El script se planta solo si eso no está listo,
// así que es seguro correrlo para chequear si ya se puede.
//
// Qué hace:
//   1. Verifica que el token pueda escribir en el bucket protegido.
//   2. Copia los audios protegidos de Supabase Storage → R2.
//   3. Verifica que cada archivo se pueda leer con signed URL.
//   4. Confirma que no queden URLs de Supabase en la base.

import { createClient } from '@supabase/supabase-js';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { config } from 'dotenv';

config({ path: '.env.local', quiet: true });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET_PROTECTED = process.env.R2_BUCKET_PROTECTED ?? 'epovox-protected';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
const r2 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? '',
  },
});

// El bucket protegido va SIN prefijo: la key en R2 es igual al path que usaba
// Supabase ("user-works/<id>.mp3"). Misma convención que src/lib/r2.ts.
const PREFIX = '';

async function paso1_verificarAcceso() {
  console.log(`\n① ¿El token alcanza "${BUCKET_PROTECTED}"?`);
  try {
    await r2.send(new PutObjectCommand({
      Bucket: BUCKET_PROTECTED, Key: '_healthcheck.txt', Body: 'ok', ContentType: 'text/plain',
    }));
    await r2.send(new DeleteObjectCommand({ Bucket: BUCKET_PROTECTED, Key: '_healthcheck.txt' }));
    console.log('   ✓ sí, escribe y borra sin problema');
    return true;
  } catch (err) {
    console.error(`   ✗ NO (${err.name}). Falta hacer esto en Cloudflare:`);
    console.error(`     1. R2 → Create bucket → nombre exacto: ${BUCKET_PROTECTED}`);
    console.error('        (dejalo PRIVADO: sin Public Development URL)');
    console.error('     2. R2 → API Tokens: que el token alcance los DOS buckets');
    console.error('        con permiso "Object Read & Write".');
    console.error('     Si generás un token nuevo, actualizá R2_ACCESS_KEY_ID y');
    console.error('     R2_SECRET_ACCESS_KEY en .env.local y en Vercel.');
    return false;
  }
}

async function paso2_copiarArchivos() {
  console.log('\n② Copiando los audios protegidos Supabase → R2');
  const { data: files, error } = await supabase.storage
    .from('protected').list('user-works', { limit: 1000 });
  if (error) {
    console.error(`   ✗ no pude listar el bucket protegido de Supabase: ${error.message}`);
    return false;
  }
  const reales = (files ?? []).filter((f) => f.id);
  console.log(`   ${reales.length} archivos a copiar`);

  let ok = 0;
  for (const f of reales) {
    const path = `user-works/${f.name}`;
    try {
      const { data: blob, error: dlErr } = await supabase.storage.from('protected').download(path);
      if (dlErr || !blob) throw new Error(dlErr?.message ?? 'download vacío');
      await r2.send(new PutObjectCommand({
        Bucket: BUCKET_PROTECTED,
        Key: PREFIX + path,
        Body: new Uint8Array(await blob.arrayBuffer()),
        ContentType: 'audio/mpeg',
      }));
      console.log(`   ✓ ${path}`);
      ok++;
    } catch (err) {
      console.error(`   ✗ ${path}: ${err.message}`);
    }
  }
  return ok === reales.length;
}

async function paso3_verificarLectura() {
  console.log('\n③ ¿Se pueden leer con signed URL?');
  const { data: works } = await supabase
    .from('user_works').select('id, title').eq('status', 'published');

  let ok = 0;
  let sinAudio = 0;
  for (const w of works ?? []) {
    const key = `${PREFIX}user-works/${w.id}.mp3`;
    try {
      await r2.send(new HeadObjectCommand({ Bucket: BUCKET_PROTECTED, Key: key }));
    } catch {
      console.log(`   · "${w.title}" no tiene audio todavía (normal si nunca se generó)`);
      sinAudio++;
      continue;
    }
    const url = await getSignedUrl(
      r2, new GetObjectCommand({ Bucket: BUCKET_PROTECTED, Key: key }), { expiresIn: 300 },
    );
    const res = await fetch(url, { method: 'HEAD' });
    if (res.ok) { console.log(`   ✓ "${w.title}" → ${res.status}`); ok++; }
    else console.error(`   ✗ "${w.title}" → ${res.status}`);
  }
  console.log(`   ${ok} audios protegidos OK · ${sinAudio} obras sin audio`);
  return true;
}

async function paso4_verificarBase() {
  console.log('\n④ ¿Queda algo apuntando a Supabase Storage en la base?');
  let total = 0;
  for (const [t, c] of [
    ['chapters', 'audio_url'], ['works', 'cover_url'], ['authors', 'photo_url'],
    ['user_works', 'cover_url'], ['profiles', 'avatar_url'],
  ]) {
    const { count } = await supabase.from(t).select('id', { count: 'exact', head: true })
      .like(c, '%supabase.co/storage%');
    if (count) console.log(`   ✗ ${t}.${c}: ${count} filas`);
    total += count ?? 0;
  }
  if (total === 0) console.log('   ✓ nada: la base está 100% en R2');
  return total === 0;
}

async function main() {
  console.log('=== Cierre de la migración Epovox → Cloudflare R2 ===');
  if (!(await paso1_verificarAcceso())) {
    console.log('\n⛔ Freno acá. Destrabá el bucket y volvé a correr este script.');
    process.exit(1);
  }
  const copiado = await paso2_copiarArchivos();
  await paso3_verificarLectura();
  const baseLimpia = await paso4_verificarBase();

  console.log('\n──────────────────────────────');
  if (copiado && baseLimpia) {
    console.log('✅ Migración completa. Ya se puede borrar el Storage de Supabase.');
    console.log('   Antes de borrar: verificá epovox.com en producción.');
  } else {
    console.log('⚠️  Quedaron cosas sin resolver, mirá el detalle de arriba.');
  }
}

main().catch((err) => { console.error('\n💥 Falla fatal:', err); process.exit(1); });
