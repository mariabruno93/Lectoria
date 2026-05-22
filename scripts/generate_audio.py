"""
Lectoria — Audio Generator
Usa edge-tts (gratis, voces neuronales de Microsoft) para generar MP3 de cada capitulo.
Los archivos se guardan en public/audio/<slug>/<chapter_id>.mp3
"""

import asyncio
import os
import urllib.request

import edge_tts

# Voces por idioma
VOICES = {
    "es": "es-AR-TomasNeural",   # argentino masculino
    "en": "en-US-GuyNeural",
}

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "audio")

# ---------------------------------------------------------------------------
# Textos de capitulos (primeros parrafos, dominio publico)
# ---------------------------------------------------------------------------

def fetch_gutenberg(url: str, start_marker: str, end_marker: str, max_chars: int = 4000) -> str:
    """Descarga texto de Project Gutenberg y extrae un fragmento."""
    req = urllib.request.Request(url, headers={"User-Agent": "Lectoria/1.0"})
    with urllib.request.urlopen(req, timeout=30) as r:
        raw = r.read().decode("utf-8", errors="ignore")
    start = raw.find(start_marker)
    if start == -1:
        raise ValueError(f"Marker not found: {start_marker!r}")
    end = raw.find(end_marker, start + len(start_marker))
    fragment = raw[start: end if end != -1 else start + max_chars]
    # Limpiar lineas vacias multiples
    lines = [l.strip() for l in fragment.splitlines()]
    cleaned = "\n".join(l for l in lines if l)
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
        "max_chars": 4000,
    },
]


async def generate(slug: str, chapter_id: int, text: str, lang: str) -> None:
    out_dir = os.path.join(OUTPUT_DIR, slug)
    os.makedirs(out_dir, exist_ok=True)
    out_file = os.path.join(out_dir, f"{chapter_id}.mp3")

    if os.path.exists(out_file):
        print(f"  Ya existe: {out_file} — saltando.")
        return

    voice = VOICES[lang]
    print(f"  Generando {out_file} con voz {voice}...")
    communicate = edge_tts.Communicate(text, voice)
    await communicate.save(out_file)
    size_kb = os.path.getsize(out_file) // 1024
    print(f"  OK — {size_kb} KB")


async def main() -> None:
    for ch in CHAPTERS:
        print(f"\n[{ch['slug']} / cap {ch['id']}]")
        if ch["text_mode"] == "gutenberg":
            print(f"  Descargando texto de Gutenberg...")
            text = fetch_gutenberg(
                ch["gutenberg_url"],
                ch["start_marker"],
                ch["end_marker"],
                ch.get("max_chars", 4000),
            )
            print(f"  {len(text)} caracteres extraidos.")
        else:
            text = ch["text"]

        await generate(ch["slug"], ch["id"], text, ch["lang"])

    print("\nListo. Archivos en public/audio/")


if __name__ == "__main__":
    asyncio.run(main())
