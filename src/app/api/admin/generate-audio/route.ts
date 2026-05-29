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
  // Limpia saltos de línea de 72 chars de Gutenberg (y PDFs con wrap duro)
  // para evitar que el TTS genere pausas en medio de oraciones.
  function cleanForTTS(raw: string): string {
    return raw
      .replace(/\r\n/g, '\n')
      .replace(/\f/g, '\n')
      .replace(/([^\n])\n([^\n])/g, '$1 $2')
      .replace(/ {2,}/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  const cleanText = cleanForTTS(text);

  // Divide en chunks de 4000 chars (límite seguro de Edge TTS)
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

  const tts = new MsEdgeTTS();
  await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);

  const allBuffers: Buffer[] = [];
  for (const chunk of chunkText(cleanText)) {
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
