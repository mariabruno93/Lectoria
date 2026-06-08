import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

// La generación pasa por un Space de Hugging Face; damos margen.
export const maxDuration = 60;

// Space gratuito de Hugging Face (modelo Z-Image Turbo).
// Misma filosofía que el TTS con msedge-tts: gratis, sin credenciales.
const HF_SPACE = 'https://mcp-tools-z-image-turbo.hf.space';
const RESOLUTION = '832x1248 ( 2:3 )'; // vertical, proporción de portada

function buildPrompt(title: string, description?: string | null, genre?: unknown): string {
  const genreStr = Array.isArray(genre) ? genre.join(', ') : (typeof genre === 'string' ? genre : '');
  const parts = [
    `Book cover illustration for a story titled "${title}".`,
    description?.trim() ? description.trim() : '',
    genreStr.trim() ? `Genre: ${genreStr.trim()}.` : '',
    'Atmospheric, painterly, evocative, elegant. Vertical book-cover composition.',
  ];
  return parts.filter(Boolean).join(' ');
}

// Llama al Space de Gradio (POST para encolar + GET del stream con el resultado).
async function generateWithSpace(prompt: string): Promise<string> {
  const data = [prompt, RESOLUTION, 0, 8, 3, true]; // prompt, resolution, seed, steps, shift, random_seed

  const post = await fetch(`${HF_SPACE}/gradio_api/call/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data }),
  });
  if (!post.ok) throw new Error(`El generador no respondió (${post.status})`);
  const { event_id } = await post.json();
  if (!event_id) throw new Error('El generador no devolvió un id de trabajo');

  const stream = await fetch(`${HF_SPACE}/gradio_api/call/generate/${event_id}`);
  const text = await stream.text();

  // Parsear el stream SSE: tomamos el data del evento "complete".
  let complete = false;
  let result: any = null;
  for (const line of text.split('\n')) {
    if (line.startsWith('event:')) complete = line.includes('complete');
    else if (line.startsWith('data:') && complete) {
      try { result = JSON.parse(line.slice(5).trim()); } catch { /* ignore */ }
    }
  }
  const first = Array.isArray(result) ? result[0] : null;
  const url = first?.url ?? (typeof first === 'string' ? first : null);
  if (!url) throw new Error('El generador no devolvió una imagen');
  return url;
}

export async function POST(req: NextRequest) {
  // Auth: el usuario tiene que ser el dueño de la obra
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { workId } = await req.json();
  if (!workId) return NextResponse.json({ error: 'workId requerido' }, { status: 400 });

  const { data: work } = await supabase
    .from('user_works')
    .select('id, title, description, genre')
    .eq('id', workId)
    .eq('user_id', user.id)
    .single();

  if (!work) return NextResponse.json({ error: 'Obra no encontrada' }, { status: 404 });

  try {
    const prompt = buildPrompt(work.title, work.description, (work as any).genre);
    const imageUrl = await generateWithSpace(prompt);

    // Descargar la imagen generada
    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) throw new Error('No se pudo descargar la portada generada');
    const imageBuffer = Buffer.from(await imgRes.arrayBuffer());

    // Subir a Storage (bucket público "covers")
    const admin = createAdminClient();
    const path = `user-works/${workId}.webp`;
    const { error: uploadError } = await admin.storage
      .from('covers')
      .upload(path, imageBuffer, { contentType: 'image/webp', upsert: true });
    if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

    // URL pública con cache-buster para ver la portada nueva al regenerar
    const { data } = admin.storage.from('covers').getPublicUrl(path);
    const publicUrl = `${data.publicUrl}?v=${Date.now()}`;

    await supabase
      .from('user_works')
      .update({ cover_url: publicUrl, updated_at: new Date().toISOString() })
      .eq('id', workId);

    return NextResponse.json({ url: publicUrl });
  } catch (e: any) {
    return NextResponse.json(
      { error: (e.message ?? 'Error generando la portada') + '. Probá de nuevo o subí una imagen.' },
      { status: 502 },
    );
  }
}
