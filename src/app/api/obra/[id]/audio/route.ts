import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { r2CreateSignedUrl } from '@/lib/r2';
import { hasAccess } from '@/lib/entitlements';

// Sirve el audio de una obra de usuario SOLO a quien tiene acceso (gratis /
// autor / comprador). El archivo vive en el bucket privado de R2
// (epovox-protected); se entrega un link firmado de corta duración → no se
// puede descargar libremente ni compartir.
const BUCKET = 'protected';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const admin = createAdminClient();
  const { data: work } = await admin
    .from('user_works')
    .select('id, user_id, is_public, status')
    .eq('id', id)
    .single();
  if (!work || work.status !== 'published') {
    return new NextResponse('No encontrado', { status: 404 });
  }

  // ¿Quién pide? (gratis no requiere compra; de pago sí)
  const auth = await createClient();
  const { data: { user } } = await auth.auth.getUser();
  const ok = await hasAccess(admin, user?.id ?? null, work);
  if (!ok) return new NextResponse('Necesitás comprar esta obra para escucharla', { status: 403 });

  // Link firmado que vence en 30 minutos (no sirve para compartir permanente).
  try {
    const signedUrl = await r2CreateSignedUrl(BUCKET, `user-works/${id}.mp3`, 60 * 30);
    return NextResponse.redirect(signedUrl, 302);
  } catch {
    return new NextResponse('Audio no disponible', { status: 404 });
  }
}
