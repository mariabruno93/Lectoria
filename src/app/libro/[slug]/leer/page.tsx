import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function LeerPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: work } = await supabase
    .from('works')
    .select('title, type, year, authors(name), chapters(chapter_number, title, lang, content)')
    .eq('slug', slug)
    .single();

  if (!work) notFound();

  const allChapters = (work.chapters as any[]) ?? [];
  const langs = [...new Set(allChapters.map((c: any) => c.lang))];
  const mainLang = langs.includes('es') ? 'es' : langs[0] ?? 'es';
  const chapters = allChapters
    .filter((c: any) => c.lang === mainLang && c.content)
    .sort((a: any, b: any) => a.chapter_number - b.chapter_number);

  const isStory = work.type === 'story';
  const authorName: string = (work.authors as any)?.name ?? '';

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0D0C0B',
        color: '#E8E0D4',
        fontFamily: 'Georgia, "Times New Roman", serif',
      }}
    >
      {/* Header */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          background: 'rgba(13,12,11,0.95)',
          backdropFilter: 'blur(8px)',
          borderBottom: '1px solid #2A2720',
          zIndex: 10,
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: 0 }}>
          <Link
            href={`/libro/${slug}`}
            style={{
              color: '#8A8478',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              flexShrink: 0,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Volver
          </Link>
          <div style={{ minWidth: 0 }}>
            <p
              style={{
                margin: 0,
                fontSize: '15px',
                fontWeight: 600,
                color: '#F2EDE4',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {work.title}
            </p>
            {authorName && (
              <p style={{ margin: 0, fontSize: '12px', color: '#6A6460' }}>{authorName}</p>
            )}
          </div>
        </div>

        {/* Botón PDF para libros */}
        {!isStory && (
          <a
            href={`/api/libro/${slug}/pdf`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              borderRadius: '20px',
              background: '#C9933A',
              color: '#fff',
              textDecoration: 'none',
              fontSize: '13px',
              fontWeight: 600,
              flexShrink: 0,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="12" y1="18" x2="12" y2="12" />
              <line x1="9" y1="15" x2="15" y2="15" />
            </svg>
            Descargar PDF
          </a>
        )}
      </div>

      {/* Content */}
      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '48px 24px 96px' }}>

        {/* Título de portada */}
        <div style={{ textAlign: 'center', marginBottom: '56px' }}>
          <h1
            style={{
              fontSize: '2.2rem',
              fontWeight: 700,
              color: '#F2EDE4',
              margin: '0 0 12px',
              lineHeight: 1.2,
            }}
          >
            {work.title}
          </h1>
          {authorName && (
            <p style={{ fontSize: '1.1rem', color: '#8A8478', margin: '0 0 6px' }}>{authorName}</p>
          )}
          {work.year && (
            <p style={{ fontSize: '0.9rem', color: '#4A4440', margin: 0 }}>{work.year}</p>
          )}
          <div
            style={{
              width: '48px',
              height: '2px',
              background: '#C9933A',
              margin: '24px auto 0',
              borderRadius: '1px',
            }}
          />
        </div>

        {chapters.length === 0 && (
          <p style={{ color: '#6A6460', textAlign: 'center', fontStyle: 'italic' }}>
            Texto no disponible aún.
          </p>
        )}

        {/* Para cuentos: un solo bloque de texto */}
        {isStory && chapters.map((chapter: any) => (
          <div key={chapter.chapter_number}>
            {(chapter.content as string)
              .split('\n\n')
              .map((p: string) => p.trim())
              .filter((p: string) => p.length > 0)
              .map((para: string, i: number) => (
                <p
                  key={i}
                  style={{
                    fontSize: '1.05rem',
                    lineHeight: 1.85,
                    color: '#C8C0B4',
                    margin: '0 0 1.2em',
                    textAlign: 'justify',
                    textIndent: para.startsWith('--') || para.startsWith('—') ? '0' : '1.5em',
                  }}
                >
                  {para}
                </p>
              ))}
          </div>
        ))}

        {/* Para libros: capítulo por capítulo con separadores */}
        {!isStory && chapters.map((chapter: any, ci: number) => (
          <div key={chapter.chapter_number}>
            {/* Encabezado de capítulo */}
            <div
              id={`cap-${chapter.chapter_number}`}
              style={{
                marginTop: ci === 0 ? 0 : '64px',
                marginBottom: '32px',
              }}
            >
              <h2
                style={{
                  fontSize: '1.3rem',
                  fontWeight: 700,
                  color: '#F2EDE4',
                  margin: '0 0 12px',
                }}
              >
                {chapter.title}
              </h2>
              <div style={{ width: '32px', height: '1px', background: '#C9933A40' }} />
            </div>

            {/* Texto del capítulo */}
            {(chapter.content as string)
              .split('\n\n')
              .map((p: string) => p.trim())
              .filter((p: string) => p.length > 0)
              .map((para: string, i: number) => (
                <p
                  key={i}
                  style={{
                    fontSize: '1.05rem',
                    lineHeight: 1.85,
                    color: '#C8C0B4',
                    margin: '0 0 1.2em',
                    textAlign: 'justify',
                    textIndent: para.startsWith('--') || para.startsWith('—') ? '0' : '1.5em',
                  }}
                >
                  {para}
                </p>
              ))}
          </div>
        ))}
      </div>
    </div>
  );
}
