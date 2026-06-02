'use client';

import { useState } from 'react';
import { Author, Work, Chapter } from '@/types';
import { usePlayer, PlayerBook, PlayerChapter } from '@/context/PlayerContext';

/* ── helpers ────────────────────────────────────────────────────────────── */
function toPlayerBook(work: Work): PlayerBook {
  return {
    id: work.id,
    slug: work.slug,
    title: work.title,
    cover_gradient_from: work.cover_gradient_from,
    cover_gradient_to: work.cover_gradient_to,
    cover_url: (work as any).cover_url ?? null,
  };
}
function toPlayerChapter(ch: Chapter): PlayerChapter {
  return { id: ch.id, title: ch.title, audio_url: ch.audio_url, duration_label: ch.duration_label };
}

/* ── botón play ─────────────────────────────────────────────────────────── */
function PlayBtn({ onClick, size = 36 }: { onClick: (e: React.MouseEvent) => void; size?: number }) {
  return (
    <button
      onClick={onClick}
      className="flex-shrink-0 rounded-full flex items-center justify-center transition-all hover:scale-105 active:scale-95"
      style={{ width: size, height: size, background: '#C9933A', boxShadow: '0 2px 8px rgba(201,147,58,0.4)' }}
    >
      <svg width={size * 0.35} height={size * 0.35} viewBox="0 0 24 24" fill="white">
        <polygon points="6,3 20,12 6,21" />
      </svg>
    </button>
  );
}

/* ── fila de obra ───────────────────────────────────────────────────────── */
function WorkRow({ work, onPlay }: { work: Work; onPlay: (ch: Chapter) => void }) {
  const [open, setOpen] = useState(false);
  const chapters = (work.chapters ?? []).slice().sort((a, b) => (a as any).chapter_number - (b as any).chapter_number);
  const isStory = work.type === 'story';
  const firstAudio = chapters.find(c => c.audio_url);

  return (
    <div className="border-b" style={{ borderColor: '#1E1C1A' }}>
      {/* cabecera de la obra */}
      <div className="flex items-center gap-4 py-3.5">
        {/* mini portada */}
        <div
          className={`flex-shrink-0 rounded-lg overflow-hidden ${isStory ? 'w-10 h-10' : 'w-10 h-14'}`}
          style={{ background: `linear-gradient(140deg, ${work.cover_gradient_from}, ${work.cover_gradient_to})` }}
        >
          {(work as any).cover_url && (
            <img src={(work as any).cover_url} alt={work.title} className="w-full h-full object-cover" />
          )}
        </div>

        {/* info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-tight" style={{ color: '#F2EDE4' }}>{work.title}</p>
          <p className="text-xs mt-0.5" style={{ color: '#6A6460' }}>
            {work.year}
            {isStory ? ' · cuento' : chapters.length > 0 ? ` · ${chapters.length} caps.` : ''}
            {work.duration_label ? ` · ${work.duration_label}` : ''}
          </p>
        </div>

        {/* acciones */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* expandir capítulos (solo libros con múltiples caps) */}
          {!isStory && chapters.length > 1 && (
            <button
              onClick={() => setOpen(o => !o)}
              className="text-xs px-3 py-1 rounded-full transition-colors"
              style={{ background: '#2A2720', color: '#8A8478' }}
            >
              {open ? 'Cerrar ▲' : `${chapters.length} caps ▼`}
            </button>
          )}
          {/* play del primer capítulo */}
          {firstAudio && <PlayBtn size={34} onClick={(e) => { e.stopPropagation(); onPlay(firstAudio); }} />}
        </div>
      </div>

      {/* lista de capítulos (expandida) */}
      {open && chapters.length > 0 && (
        <div className="pb-3 pl-14 pr-2">
          {chapters.map((ch, i) => (
            <div key={ch.id} className="flex items-center gap-3 py-2 rounded-lg px-2 -mx-2 hover:bg-white/[0.03] transition-colors">
              <span className="text-xs w-5 text-right flex-shrink-0 tabular-nums" style={{ color: '#3A3728' }}>
                {i + 1}
              </span>
              <p className="flex-1 text-sm truncate" style={{ color: '#A09890' }}>{ch.title}</p>
              {ch.duration_label && (
                <span className="text-xs flex-shrink-0" style={{ color: '#3A3728' }}>{ch.duration_label}</span>
              )}
              {ch.audio_url
                ? <PlayBtn size={26} onClick={(e) => { e.stopPropagation(); onPlay(ch); }} />
                : <span className="w-[26px]" />
              }
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── componente principal ───────────────────────────────────────────────── */
export default function AutorClient({
  author, books, stories, playCount,
}: {
  author: Author;
  books: Work[];
  stories: Work[];
  playCount: Record<string, number>;
}) {
  const { play } = usePlayer();

  const allWorks = [...books, ...stories];
  const totalWorks = allWorks.length;
  const totalPlays = Object.values(playCount).reduce((a, b) => a + b, 0);

  // Color héroe
  const heroFrom = books[0]?.cover_gradient_from ?? stories[0]?.cover_gradient_from ?? '#2A1A08';

  function handlePlay(work: Work, ch: Chapter) {
    play(toPlayerBook(work), toPlayerChapter(ch));
  }

  function handlePlayAll() {
    for (const work of allWorks) {
      const chs = (work.chapters ?? []).slice().sort((a, b) => (a as any).chapter_number - (b as any).chapter_number);
      const first = chs.find(c => c.audio_url);
      if (first) { play(toPlayerBook(work), toPlayerChapter(first)); break; }
    }
  }

  return (
    <div>
      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <div
        className="relative px-6 pt-16 pb-14"
        style={{ background: `linear-gradient(180deg, ${heroFrom}E0 0%, #0D0C0B 100%)` }}
      >
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center sm:items-end gap-8">

          {/* Foto del autor */}
          <div
            className="w-48 h-48 rounded-full flex-shrink-0 overflow-hidden shadow-2xl"
            style={{ border: '4px solid rgba(201,147,58,0.35)' }}
          >
            {author.photo_url ? (
              <img src={author.photo_url} alt={author.name} className="w-full h-full object-cover" />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center text-7xl font-bold"
                style={{
                  background: `linear-gradient(145deg, ${heroFrom} 0%, #0D0C0B 100%)`,
                  color: '#F2EDE4',
                  fontFamily: 'Georgia, serif',
                }}
              >
                {author.name.charAt(0)}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 text-center sm:text-left pb-2">
            <p className="text-xs uppercase tracking-widest mb-2" style={{ color: '#C9933A' }}>Autor</p>
            <h1
              className="text-4xl md:text-5xl font-bold mb-2 leading-tight"
              style={{ fontFamily: 'Georgia, serif', color: '#F2EDE4' }}
            >
              {author.name}
            </h1>
            <p className="text-sm mb-8" style={{ color: '#8A8478' }}>
              {[author.nationality, author.born_year && `${author.born_year}${author.died_year ? ` – ${author.died_year}` : ''}`]
                .filter(Boolean).join(' · ')}
            </p>

            {/* Botones */}
            <div className="flex items-center gap-4 justify-center sm:justify-start flex-wrap">
              <button
                onClick={handlePlayAll}
                className="flex items-center gap-2.5 px-7 py-3 rounded-full text-sm font-semibold transition-opacity hover:opacity-80"
                style={{ background: '#C9933A', color: '#fff' }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="white"><polygon points="6,3 20,12 6,21" /></svg>
                Reproducir todo
              </button>
              <div className="flex gap-5">
                <span className="text-center">
                  <p className="text-xl font-bold" style={{ fontFamily: 'Georgia, serif', color: '#F2EDE4' }}>{totalWorks}</p>
                  <p className="text-xs" style={{ color: '#6A6460' }}>obras</p>
                </span>
                {totalPlays > 0 && (
                  <span className="text-center">
                    <p className="text-xl font-bold" style={{ fontFamily: 'Georgia, serif', color: '#F2EDE4' }}>{totalPlays}</p>
                    <p className="text-xs" style={{ color: '#6A6460' }}>reproducciones</p>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── CONTENIDO ─────────────────────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-6 py-10">

        {/* Bio */}
        {author.bio && (
          <p className="text-sm leading-7 mb-10 max-w-2xl" style={{ color: '#8A8478' }}>
            {author.bio}
          </p>
        )}

        {/* Libros */}
        {books.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#C9933A' }}>
              Libros · {books.length}
            </h2>
            <div>
              {books.map(work => (
                <WorkRow key={work.id} work={work} onPlay={ch => handlePlay(work, ch)} />
              ))}
            </div>
          </section>
        )}

        {/* Cuentos */}
        {stories.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#C9933A' }}>
              Cuentos · {stories.length}
            </h2>
            <div>
              {stories.map(work => (
                <WorkRow key={work.id} work={work} onPlay={ch => handlePlay(work, ch)} />
              ))}
            </div>
          </section>
        )}

        {totalWorks === 0 && (
          <p className="text-sm" style={{ color: '#6A6460' }}>No hay obras cargadas para este autor todavía.</p>
        )}
      </div>
    </div>
  );
}
