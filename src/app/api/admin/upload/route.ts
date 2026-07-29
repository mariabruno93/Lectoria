import { createClient, createAdminClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// Buckets y tipos permitidos (nadie puede subir a un bucket arbitrario).
const ALLOWED_BUCKETS = new Set(['covers', 'protected']);
const ALLOWED_EXT = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif', 'mp3']);
const MAX_BYTES = 25 * 1024 * 1024; // 25 MB

export async function POST(req: NextRequest) {
  // 1) Tiene que estar logueado.
  const auth = await createClient();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const form = await req.formData();
  const file = form.get('file') as File;
  const bucket = (form.get('bucket') as string) ?? 'covers';
  const path = form.get('path') as string;

  if (!file || !path) {
    return NextResponse.json({ error: 'Missing file or path' }, { status: 400 });
  }

  // 2) Validaciones de forma: bucket, extensión, tamaño, sin path traversal.
  if (!ALLOWED_BUCKETS.has(bucket)) {
    return NextResponse.json({ error: 'Bucket no permitido' }, { status: 400 });
  }
  if (path.includes('..') || path.startsWith('/')) {
    return NextResponse.json({ error: 'Ruta inválida' }, { status: 400 });
  }
  const ext = path.split('.').pop()?.toLowerCase() ?? '';
  if (!ALLOWED_EXT.has(ext)) {
    return NextResponse.json({ error: 'Tipo de archivo no permitido' }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'Archivo demasiado grande' }, { status: 413 });
  }

  // 3) Autorización por ruta.
  const admin = createAdminClient();
  const { data: prof } = await admin
    .from('profiles').select('is_admin').eq('id', user.id).single();
  const isAdmin = !!prof?.is_admin;

  const uwMatch = path.match(/^user-works\/([^/]+)\.[a-z0-9]+$/i);
  const avMatch = path.match(/^avatars\/([^/]+)\.[a-z0-9]+$/i);

  let allowed = false;
  if (uwMatch) {
    // Portada / audio de una obra: solo su dueño (o un admin).
    const { data: work } = await admin
      .from('user_works').select('user_id').eq('id', uwMatch[1]).single();
    allowed = (!!work && work.user_id === user.id) || isAdmin;
  } else if (avMatch) {
    // Avatar: solo el propio usuario (o un admin).
    allowed = avMatch[1] === user.id || isAdmin;
  } else {
    // Catálogo clásico (portadas de obras / fotos de autores): solo admin.
    allowed = isAdmin;
  }

  if (!allowed) {
    return NextResponse.json({ error: 'No tenés permiso para subir acá' }, { status: 403 });
  }

  // 4) Subida.
  const bytes = await file.arrayBuffer();
  const { error } = await admin.storage
    .from(bucket)
    .upload(path, bytes, { contentType: file.type, upsert: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data } = admin.storage.from(bucket).getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl });
}
