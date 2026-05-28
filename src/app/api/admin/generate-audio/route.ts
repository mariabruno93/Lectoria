import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';

// Voces oficiales de Lectoria
// ES general: Jorge (México) — elegida por sonido natural
// ES argentino (futuro): Elena o Jorge — el escritor elige
// EN: Jenny (USA) — elegida por claridad y calidez
const VOICES: Record<string, string> = {
  es: 'es-MX-JorgeNeural',
  en: 'en-US-JennyNeural',
  'es-ar-elena': 'es-AR-ElenaNeural',
  'es-ar-jorge': 'es-MX-JorgeNeural',
};

export async function POST(req: NextRequest) {
  const { text, workSlug, chapterNumber, lang = 'es' } = await req.json();

  if (!text || !workSlug || !chapterNumber) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const voice = VOICES[lang] ?? VOICES.es;

  // Generar audio con msedge-tts
  const tts = new MsEdgeTTS();
  await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);

  const chunks: Buffer[] = [];
  await new Promise<void>((resolve, reject) => {
    const { audioStream } = tts.toStream(text);
    audioStream.on('data', (chunk: Buffer) => chunks.push(chunk));
    audioStream.on('end', resolve);
    audioStream.on('error', reject);
  });

  const audioBuffer = Buffer.concat(chunks);

  // Subir a Supabase Storage
  const supabase = createAdminClient();
  const path = `${workSlug}/${chapterNumber}.mp3`;
  const { error } = await supabase.storage
    .from('audio')
    .upload(path, audioBuffer, { contentType: 'audio/mpeg', upsert: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data } = supabase.storage.from('audio').getPublicUrl(path);

  // Actualizar el capítulo en la DB
  await supabase
    .from('chapters')
    .update({ audio_url: data.publicUrl })
    .match({ work_id: (await supabase.from('works').select('id').eq('slug', workSlug).single()).data?.id, chapter_number: chapterNumber });

  return NextResponse.json({ url: data.publicUrl });
}
