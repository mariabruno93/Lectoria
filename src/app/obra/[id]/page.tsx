import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import ObraPlayer from './ObraPlayer';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from('user_works').select('title, description').eq('id', id).single();
  if (!data) return {};
  return { title: `${data.title} — Epovox`, description: data.description ?? undefined };
}

export default async function ObraPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: work } = await supabase
    .from('user_works')
    .select('*, profiles(display_name, avatar_url)')
    .eq('id', id)
    .eq('status', 'published')
    .eq('is_public', true)
    .single();

  if (!work) notFound();

  const author = work.profiles as any;
  const authorName = author?.display_name ?? 'Autor';
  const authorAvatar = author?.avatar_url ?? null;

  return (
    <div className="max-w-2xl mx-auto px-6 py-14">
      {/* Breadcrumb */}
      <Link href="/independientes"
        className="text-xs uppercase tracking-widest hover:opacity-70 transition-opacity"
        style={{ color: '#C9933A' }}>
        ← Autores independientes
      </Link>

      {/* Header */}
      <div className="mt-8 mb-10">
        <h1 className="text-4xl font-bold leading-tight mb-4"
          style={{ fontFamily: 'Georgia, serif', color: '#F2EDE4' }}>
          {work.title}
        </h1>

        {/* Autor */}
        <Link href={`/independientes/${work.user_id}`}
          className="flex items-center gap-3 w-fit hover:opacity-80 transition-opacity">
          <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0"
            style={{ border: '2px solid #2A2720' }}>
            {authorAvatar
              ? <img src={authorAvatar} alt={authorName} className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center text-sm font-bold"
                  style={{ background: '#1A1816', color: '#C9933A', fontFamily: 'Georgia, serif' }}>
                  {authorName.charAt(0)}
                </div>
            }
          </div>
          <div>
            <p className="text-sm font-medium" style={{ color: '#F2EDE4' }}>{authorName}</p>
            <p className="text-xs" style={{ color: '#6A6460' }}>
              {new Date(work.created_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
              {' · '}{work.language.toUpperCase()}
            </p>
          </div>
        </Link>

        {work.description && (
          <p className="mt-5 text-base leading-7" style={{ color: '#8A8478' }}>{work.description}</p>
        )}
      </div>

      {/* Player de audio */}
      {work.audio_url && (
        <ObraPlayer
          workId={work.id}
          title={work.title}
          audioUrl={work.audio_url}
          authorName={authorName}
        />
      )}

      {/* Texto */}
      {work.content && (
        <div className="mt-10 pt-8" style={{ borderTop: '1px solid #2A2720' }}>
          <div
            className="prose prose-invert max-w-none leading-8 text-base whitespace-pre-wrap"
            style={{
              color: '#C9C3B8',
              fontFamily: 'Georgia, serif',
              lineHeight: 1.9,
              fontSize: '1.05rem',
            }}
          >
            {work.content}
          </div>
        </div>
      )}
    </div>
  );
}
