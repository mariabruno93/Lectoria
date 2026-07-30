// Adapter Cloudflare R2 — reemplaza Supabase Storage.
// Maria 2026-07-30: migración para bajar factura Supabase a $0.
//
// Mapeo de buckets viejos (Supabase) → nuevos (R2 con prefijos):
//   covers    → epovox           / covers/...
//   audio     → epovox           / audio/...
//   protected → epovox-protected / (sin prefijo: el bucket ya es dedicado)
//
// El bucket protegido no lleva prefijo a propósito: así la key en R2 es
// idéntica al path que ya usaba Supabase Storage ("user-works/<id>.mp3") y
// upload, lectura y migración comparten una sola convención.
//
// El bucket "epovox" tiene Public Development URL habilitado
// (NEXT_PUBLIC_R2_PUBLIC_URL). El bucket "epovox-protected" es privado
// y se sirve solo con signed URLs.

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const r2 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? '',
  },
});

const R2_BUCKET_PUBLIC = process.env.R2_BUCKET_PUBLIC ?? 'epovox';
const R2_BUCKET_PROTECTED = process.env.R2_BUCKET_PROTECTED ?? 'epovox-protected';
const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? '';

// Traduce el nombre "estilo Supabase" al par (bucket, prefijo) de R2.
function resolveBucketAndPrefix(supabaseBucket: string): { bucket: string; prefix: string } {
  if (supabaseBucket === 'protected') {
    return { bucket: R2_BUCKET_PROTECTED, prefix: '' };
  }
  if (supabaseBucket === 'audio') {
    return { bucket: R2_BUCKET_PUBLIC, prefix: 'audio/' };
  }
  // Default: covers y cualquier otro bucket público futuro.
  return { bucket: R2_BUCKET_PUBLIC, prefix: 'covers/' };
}

export async function r2Upload(
  supabaseBucket: string,
  path: string,
  body: Buffer | Uint8Array | ArrayBuffer,
  contentType: string,
): Promise<{ key: string; bucket: string }> {
  const { bucket, prefix } = resolveBucketAndPrefix(supabaseBucket);
  const key = prefix + path;
  const bodyBytes =
    body instanceof Uint8Array || Buffer.isBuffer(body)
      ? body
      : new Uint8Array(body);
  await r2.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: bodyBytes,
      ContentType: contentType,
    }),
  );
  return { key, bucket };
}

export function r2GetPublicUrl(supabaseBucket: string, path: string): string {
  if (!R2_PUBLIC_URL) {
    throw new Error(
      'NEXT_PUBLIC_R2_PUBLIC_URL no configurado. Habilitá Public Development URL en el bucket público de R2.',
    );
  }
  const { prefix } = resolveBucketAndPrefix(supabaseBucket);
  return `${R2_PUBLIC_URL.replace(/\/$/, '')}/${prefix}${path}`;
}

export async function r2CreateSignedUrl(
  supabaseBucket: string,
  path: string,
  expiresInSeconds: number,
): Promise<string> {
  const { bucket, prefix } = resolveBucketAndPrefix(supabaseBucket);
  return getSignedUrl(
    r2,
    new GetObjectCommand({ Bucket: bucket, Key: prefix + path }),
    { expiresIn: expiresInSeconds },
  );
}
