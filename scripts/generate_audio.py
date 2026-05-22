"""
Lectoria - Audio Generator
Usa edge-tts (gratis, voces neuronales de Microsoft) para generar MP3 de cada capitulo.
Los archivos se guardan en public/audio/<slug>/<chapter_id>.mp3
"""

import asyncio
import os
import re
import urllib.request

import edge_tts

# Voces por idioma
VOICES = {
    "es": "es-AR-TomasNeural",
    "en": "en-US-GuyNeural",
}

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "audio")

PUNCTUATION_END = {".", "!", "?", ":", ";", ")", "]", '"', "»"}


def clean_gutenberg_text(raw_fragment: str) -> str:
    """
    Gutenberg parte las lineas cada ~70 chars en medio de oraciones.
    Esto hace que edge-tts pause en cada salto de linea aunque la oracion no termino.

    Algoritmo:
    1. Separar en parrafos (bloques separados por linea en blanco).
    2. Dentro de cada parrafo, unir las lineas en una sola oracion continua.
    3. Normalizar espacios y caracteres especiales.
    """
    # Normalizar saltos de linea Windows
    text = raw_fragment.replace("\r\n", "\n").replace("\r", "\n")

    # Separar en bloques por linea en blanco
    blocks = re.split(r"\n{2,}", text)

    paragraphs = []
    for block in blocks:
        lines = [l.strip() for l in block.splitlines() if l.strip()]
        if not lines:
            continue
        # Unir lineas dentro del parrafo en una sola cadena
        joined = ""
        for line in lines:
            if not joined:
                joined = line
            else:
                # Si la linea anterior termina con puntuacion, agregar espacio normal
                # Si no, era un corte artificial de Gutenberg -> unir con espacio
                if joined[-1] in PUNCTUATION_END:
                    joined += " " + line
                else:
                    joined += " " + line
        paragraphs.append(joined)

    # Unir parrafos con pausa natural (punto y doble espacio)
    result = "  ".join(paragraphs)

    # Limpiar guiones de Gutenberg y caracteres raros
    result = result.replace("--", ", ")
    result = re.sub(r"\s{3,}", "  ", result)
    result = result.strip()

    return result


def fetch_gutenberg(url: str, start_marker: str, end_marker: str, max_chars: int = 5000) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": "Lectoria/1.0"})
    with urllib.request.urlopen(req, timeout=30) as r:
        data = r.read()
    # Intentar UTF-8 primero, luego latin-1 (cubre todos los acentos espanoles)
    try:
        raw = data.decode("utf-8")
    except UnicodeDecodeError:
        raw = data.decode("latin-1")

    start = raw.find(start_marker)
    if start == -1:
        raise ValueError(f"Marker not found: {start_marker!r}")
    end = raw.find(end_marker, start + len(start_marker))
    fragment = raw[start: end if end != -1 else start + max_chars]

    cleaned = clean_gutenberg_text(fragment)
    return cleaned[:max_chars]


CHAPTERS: list[dict] = [
    {
        "slug": "don-quijote",
        "id": 1,
        "lang": "es",
        "text_mode": "gutenberg",
        "gutenberg_url": "https://www.gutenberg.org/files/2000/2000-0.txt",
        "start_marker": "En un lugar de la Mancha",
        "end_marker": "CAPITULO II",
        "max_chars": 5000,
    },
]


async def generate(slug: str, chapter_id: int, text: str, lang: str, force: bool = False) -> None:
    out_dir = os.path.join(OUTPUT_DIR, slug)
    os.makedirs(out_dir, exist_ok=True)
    out_file = os.path.join(out_dir, f"{chapter_id}.mp3")

    if os.path.exists(out_file) and not force:
        print(f"  Sobreescribiendo (--force)..." if force else f"  Regenerando...")
        os.remove(out_file)

    voice = VOICES[lang]
    print(f"  Generando {out_file}")
    print(f"  Voz: {voice} | Chars: {len(text)}")
    communicate = edge_tts.Communicate(text, voice)
    await communicate.save(out_file)
    size_kb = os.path.getsize(out_file) // 1024
    print(f"  OK - {size_kb} KB")


async def main() -> None:
    for ch in CHAPTERS:
        print(f"\n[{ch['slug']} / cap {ch['id']}]")
        if ch["text_mode"] == "gutenberg":
            print(f"  Descargando y limpiando texto de Gutenberg...")
            text = fetch_gutenberg(
                ch["gutenberg_url"],
                ch["start_marker"],
                ch["end_marker"],
                ch.get("max_chars", 5000),
            )
            print(f"  Texto limpio: {len(text)} caracteres")
            print(f"  Preview: {text[:200]}...")
        else:
            text = ch["text"]

        await generate(ch["slug"], ch["id"], text, ch["lang"], force=True)

    print("\nListo. Archivos en public/audio/")


if __name__ == "__main__":
    asyncio.run(main())
