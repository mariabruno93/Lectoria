import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const langParam = req.nextUrl.searchParams.get('lang');
  const supabase = await createClient();

  // Traer obra + autores + capítulos con contenido
  const { data: work, error } = await supabase
    .from('works')
    .select('title, type, year, description, authors(name), chapters(chapter_number, title, lang, content)')
    .eq('slug', slug)
    .single();

  if (error || !work) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // Seleccionar idioma: ?lang=en|es, o español por defecto
  const allChapters = (work.chapters as any[]) ?? [];
  const langs = [...new Set(allChapters.map((c: any) => c.lang))];
  const mainLang = langs.includes('es') ? 'es' : langs[0] ?? 'es';
  const selectedLang = langParam && langs.includes(langParam) ? langParam : mainLang;
  const chapters = allChapters
    .filter((c: any) => c.lang === selectedLang && c.content)
    .sort((a: any, b: any) => a.chapter_number - b.chapter_number);

  if (!chapters.length) {
    return NextResponse.json({ error: 'No content available' }, { status: 404 });
  }

  // Generar PDF en memoria (require dinámico para que Vercel no lo bundlee)
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const PDFDocument = require('pdfkit');
  const chunks: Buffer[] = [];

  await new Promise<void>((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 72, bottom: 72, left: 72, right: 72 },
      info: {
        Title: work.title,
        Author: (work.authors as any)?.name ?? '',
        Creator: 'Lectoria',
      },
    });

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', resolve);
    doc.on('error', reject);

    const authorName: string = (work.authors as any)?.name ?? '';

    // ── Portada ────────────────────────────────────────────────────────────
    doc.moveDown(8);
    doc
      .font('Helvetica-Bold')
      .fontSize(28)
      .text(work.title, { align: 'center' });

    if (authorName) {
      doc.moveDown(1);
      doc.font('Helvetica').fontSize(16).text(authorName, { align: 'center' });
    }
    if (work.year) {
      doc.moveDown(0.5);
      doc.font('Helvetica').fontSize(12).fillColor('#888').text(String(work.year), { align: 'center' });
    }

    doc.moveDown(2);
    doc.font('Helvetica').fontSize(10).fillColor('#aaa').text('Lectoria — lectoria.app', { align: 'center' });

    // ── Capítulos ──────────────────────────────────────────────────────────
    for (const chapter of chapters) {
      doc.addPage();

      // Título del capítulo
      doc
        .font('Helvetica-Bold')
        .fontSize(16)
        .fillColor('#111')
        .text(chapter.title, { align: 'left' });

      doc.moveDown(1.2);
      doc.moveTo(72, doc.y).lineTo(doc.page.width - 72, doc.y).strokeColor('#ddd').stroke();
      doc.moveDown(1.2);

      // Texto del capítulo: dividir en párrafos
      const paragraphs: string[] = (chapter.content as string)
        .split('\n\n')
        .map((p: string) => p.trim())
        .filter((p: string) => p.length > 0);

      doc.font('Helvetica').fontSize(11).fillColor('#111');

      for (const para of paragraphs) {
        // Detectar si es diálogo (empieza con --)
        const isDialogue = para.startsWith('--') || para.startsWith('—');
        doc.text(para, {
          align: 'justify',
          indent: isDialogue ? 0 : 20,
          lineGap: 3,
        });
        doc.moveDown(0.6);
      }
    }

    doc.end();
  });

  const pdfBuffer = Buffer.concat(chunks);
  const filename = `${slug}${selectedLang !== 'es' ? `-${selectedLang}` : ''}.pdf`;

  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${filename}"`,
      'Content-Length': String(pdfBuffer.length),
    },
  });
}
