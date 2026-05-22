import { NextRequest, NextResponse } from 'next/server';
// @ts-ignore
import pdfParse from 'pdf-parse';

// Detecta capítulos por patrones comunes en ES e EN
function detectChapters(text: string): Array<{ number: number; title: string; text: string }> {
  const patterns = [
    /^(cap[ií]tulo\s+[\divxlc]+[\.\s\-–—]*.{0,80})/im,
    /^(chapter\s+[\divxlc]+[\.\s\-–—]*.{0,80})/im,
    /^(parte\s+[\divxlc]+[\.\s\-–—]*.{0,80})/im,
    /^(part\s+[\divxlc]+[\.\s\-–—]*.{0,80})/im,
  ];

  const combined = new RegExp(
    patterns.map((p) => p.source).join('|'),
    'gim'
  );

  const matches: Array<{ index: number; title: string }> = [];
  let m;
  while ((m = combined.exec(text)) !== null) {
    const title = (m[0] ?? '').trim().replace(/\s+/g, ' ').slice(0, 100);
    matches.push({ index: m.index, title });
  }

  if (matches.length === 0) {
    // Sin capítulos detectados → todo como un solo "capítulo"
    return [{ number: 1, title: 'Texto completo', text: text.slice(0, 50000) }];
  }

  return matches.map((match, i) => {
    const start = match.index;
    const end = matches[i + 1]?.index ?? text.length;
    const chapterText = text.slice(start, end).trim();
    return {
      number: i + 1,
      title: match.title,
      text: chapterText.slice(0, 50000), // límite por capítulo
    };
  });
}

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const file = form.get('file') as File;

  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const parsed = await pdfParse(buffer);
  const chapters = detectChapters(parsed.text);

  return NextResponse.json({
    pages: parsed.numpages,
    totalChars: parsed.text.length,
    chapters: chapters.map((c) => ({
      number: c.number,
      title: c.title,
      preview: c.text.slice(0, 300),
      text: c.text,
      charCount: c.text.length,
    })),
  });
}
