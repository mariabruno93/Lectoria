/**
 * Genera muestras de audio en diferentes voces.
 * Uso: node scripts/test-voices.mjs
 * Guarda los MP3 en scripts/voice-samples/
 */
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';
import { writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const dir = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(dir, 'voice-samples');
mkdirSync(outDir, { recursive: true });

const TEXT_ES = `El conde Drácula me recibió en la puerta del castillo. Era un hombre alto y anciano, de bigote blanco y espeso, ataviado de negro de los pies a la cabeza. No había ni una sola mancha de color en todo su cuerpo. Su rostro era fuerte, muy fuerte, con una nariz aguileña y delgada, con ventanas de la nariz arqueadas de manera peculiar.`;

const TEXT_EN = `I must have been asleep, for certainly if I had been fully awake I must have noticed the approach of such a remarkable place. In the gloom the castle loomed before us, with its tall black windows and the dark outline of the walls against the sky.`;

const VOICES = [
  { id: 'es-AR-ElenaNeural',  lang: 'es', label: '1. Elena — Argentina (mujer)' },
  { id: 'es-AR-TomasNeural',  lang: 'es', label: '2. Tomas — Argentina (hombre) [actual]' },
  { id: 'es-ES-AlvaroNeural', lang: 'es', label: '3. Alvaro — España (hombre)' },
  { id: 'es-ES-ElviraNeural', lang: 'es', label: '4. Elvira — España (mujer)' },
  { id: 'es-MX-JorgeNeural',  lang: 'es', label: '5. Jorge — México (hombre)' },
  { id: 'en-GB-RyanNeural',   lang: 'en', label: '6. Ryan — UK (hombre)' },
  { id: 'en-US-JennyNeural',  lang: 'en', label: '7. Jenny — USA (mujer)' },
];

for (const voice of VOICES) {
  const text = voice.lang === 'es' ? TEXT_ES : TEXT_EN;
  console.log(`Generando: ${voice.label}...`);
  try {
    const tts = new MsEdgeTTS();
    await tts.setMetadata(voice.id, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);
    const chunks = [];
    await new Promise((resolve, reject) => {
      const { audioStream } = tts.toStream(text);
      audioStream.on('data', chunk => chunks.push(chunk));
      audioStream.on('end', resolve);
      audioStream.on('error', reject);
    });
    const outPath = resolve(outDir, `${voice.id}.mp3`);
    writeFileSync(outPath, Buffer.concat(chunks));
    console.log(`  ✓ Guardado: scripts/voice-samples/${voice.id}.mp3`);
  } catch (e) {
    console.error(`  ✗ Error: ${e.message}`);
  }
}

console.log('\n¡Listo! Abrí la carpeta scripts/voice-samples/ y escuchá los MP3.');
