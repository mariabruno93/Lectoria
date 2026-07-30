import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { r2Upload } from '@/lib/r2';
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';

const VOICES: Record<string, string> = {
  'es-jorge': 'es-MX-JorgeNeural',
  'es-elena': 'es-AR-ElenaNeural',
  'en-jenny': 'en-US-JennyNeural',
};

function cleanForTTS(raw: string): string {
  return raw
    .replace(/\r\n/g, '\n')
    .replace(/\f/g, '\n')
    .replace(/([^\n])\n([^\n])/g, '$1 $2')
    .replace(/ {2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function chunkText(t: string, max = 4000): string[] {
  const sentences = t.split(/(?<=[.!?»])\s+/);
  const result: string[] = [];
  let cur = '';
  for (const s of sentences) {
    if (cur.length + s.length > max && cur) { result.push(cur.trim()); cur = s; }
    else cur += (cur ? ' ' : '') + s;
  }
  if (cur.trim()) result.push(cur.trim());
  return result;
}

export async function POST(req: NextRequest) {
  // Auth: verificar que el usuario sea el dueño
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { workId, voice = 'es-jorge' } = await req.json();
  if (!workId) return NextResponse.json({ error: 'workId requerido' }, { status: 400 });

  // Verificar propiedad
  const { data: work } = await supabase
    .from('user_works')
    .select('id, content, title')
    .eq('id', workId)
    .eq('user_id', user.id)
    .single();

  if (!work) return NextResponse.json({ error: 'Obra no encontrada' }, { status: 404 });
  if (!work.content?.trim()) return NextResponse.json({ error: 'La obra no tiene texto' }, { status: 400 });

  const voiceName = VOICES[voice] ?? VOICES['es-jorge'];

  try {
    const tts = new MsEdgeTTS();
    await tts.setMetadata(voiceName, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);

    const allBuffers: Buffer[] = [];
    for (const chunk of chunkText(cleanForTTS(work.content))) {
      const chunks: Buffer[] = [];
      await new Promise<void>((resolve, reject) => {
        const { audioStream } = tts.toStream(chunk);
        audioStream.on('data', (c: Buffer) => chunks.push(c));
        audioStream.on('end', resolve);
        audioStream.on('error', reject);
      });
      allBuffers.push(...chunks);
    }

    const audioBuffer = Buffer.concat(allBuffers);

    // Subir al bucket PRIVADO de R2 (el audio se sirve solo a quien tiene acceso).
    const admin = createAdminClient();
    const path = `user-works/${workId}.mp3`;
    try {
      await r2Upload('protected', path, audioBuffer, 'audio/mpeg');
    } catch (err) {
      return NextResponse.json({ error: (err as Error).message }, { status: 500 });
    }

    // El audio_url apunta al endpoint protegido (no al archivo directo).
    const gatedUrl = `/api/obra/${workId}/audio`;
    await supabase
      .from('user_works')
      .update({ audio_url: gatedUrl, updated_at: new Date().toISOString() })
      .eq('id', workId);

    return NextResponse.json({ url: gatedUrl });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Error generando audio' }, { status: 500 });
  }
}
