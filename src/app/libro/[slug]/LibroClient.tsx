'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePlayer } from '@/context/PlayerContext';

function ChapterRow({ work, chapter }: { work: any; chapter: any }) {
  const { play, togglePlay, book: activeBook, chapter: activeChapter, isPlaying } = usePlayer();
  const isActive = activeBook?.slug === work.slug && activeChapter?.id === chapter.id;

  function handleClick() {
    if (isActive) togglePlay();
    else play(work, chapter);
  }

  return (
    <div
      className="flex items-center justify-between px-4 py-3 rounded-xl"
      style={{
        background: isActive ? '#2A2010' : '#1A1816',
        border: `1px solid ${isActive ? '#C9933A40' : '#2A2720'}`,
      }}
    >
      <div className="flex-1 min-w-0 mr-4">
        <p className="text-sm font-medium truncate" style={{ color: isActive ? '#C9933A' : '#F2EDE4' }}>
          {chapter.title}
        </p>
        {chapter.duration_label && (
          <p className="text-xs mt-0.5" style={{ color: '#8A8478' }}>{chapter.duration_label}</p>
        )}
      </div>
      <button
        onClick={handleClick}
        className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-opacity hover:opacity-80 flex-shrink-0"
        style={isActive ? { background: '#C9933A', color: '#fff' } : { background: '#2A2720', color: '#F2EDE4' }}
      >
        {isActive && isPlaying ? (
          <><svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></svg>Pausar</>
        ) : (
          <><svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21" /></svg>{isActive ? 'Continuar' : 'Reproducir'}</>
        )}
      </button>
    </div>
  );
}

export default function LibroClient({ work }: { work: any }) {
  const { play, book: activeBook, isPlaying } = usePlayer();
  const isThisBookActive = activeBook?.slug === work.slug;
  const isStory = work.type === 'story';
  const authorName: string = work.authors?.name ?? '';

  const allChapters: any[] = (work.chapters ?? []).sort(
    (a: any, b: any) => a.chapter_number - b.chapter_number
  );

  // Detectar idiomas disponibles en los capítulos
  const availableLangs = [...new Set(allChapters.map((c: any) => c.lang ?? 'es'))];
  const hasMultipleLangs = availableLangs.length > 1;
  const defaultLang = availableLangs.includes('es') ? 'es' : availableLangs[0] ?? 'es';
  const [selectedLang, setSelectedLang] = useState<string>(defaultLang);

  const chapters = allChapters.filter((c: any) => (c.lang ?? 'es') === selectedLang);

  const LANG_LABEL: Record<string, string> = { es: 'Español', en: 'English' };
  const LANG_FLAG: Record<string, string> = { es: '🇦🇷', en: '🇬🇧' };

  return (
    <div className="max-w-5xl mx-auto px-6 py-14">
      <Link href="/biblioteca"
        className="inline-flex items-center gap-2 text-sm mb-10 transition-opacity hover:opacity-80"
        style={{ color: '#8A8478' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Volver a la biblioteca
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-12">
        {/* Cover */}
        <div className="flex flex-col gap-5">
          <div
            className={`${isStory ? 'aspect-square' : 'aspect-[2/3]'} rounded-2xl relative overflow-hidden`}
            style={{
              background: `linear-gradient(160deg, ${work.cover_gradient_from ?? '#1A1816'} 0%, ${work.cover_gradient_to ?? '#0D0C0B'} 100%)`,
              boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
            }}
          >
            {work.cover_url && (
              <img src={work.cover_url} alt={work.title} className="absolute inset-0 w-full h-full object-cover" />
            )}
          </div>
          {chapters.length > 0 && (
            <button
              onClick={() => play(work, chapters[0])}
              className="w-full py-3 rounded-full font-semibold flex items-center justify-center gap-2 transition-opacity hover:opacity-80"
              style={{ background: '#C9933A', color: '#fff' }}>
              {isThisBookActive && isPlaying ? (
                <><svg width="15" height="15" viewBox="0 0 24 24" fill="white"><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></svg>En reproducción</>
              ) : (
                <><svg width="15" height="15" viewBox="0 0 24 24" fill="white"><polygon points="5,3 19,12 5,21" /></svg>{isStory ? 'Escuchar cuento' : 'Reproducir libro'}</>
              )}
            </button>
          )}
        </div>

        {/* Info + capítulos */}
        <div>
          <div className="mb-8">
            {/* Toggle EN/ES */}
            {hasMultipleLangs && (
              <div className="flex items-center gap-2 mb-5">
                <span className="text-xs" style={{ color: '#8A8478' }}>Idioma:</span>
                <div className="flex rounded-full p-0.5" style={{ background: '#1A1816' }}>
                  {availableLangs.sort().map(lang => (
                    <button
                      key={lang}
                      onClick={() => setSelectedLang(lang)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                      style={selectedLang === lang
                        ? { background: '#C9933A', color: '#fff' }
                        : { color: '#8A8478' }
                      }
                    >
                      <span>{LANG_FLAG[lang]}</span>
                      <span>{LANG_LABEL[lang] ?? lang.toUpperCase()}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 mb-3">
              {!hasMultipleLangs && (
                <span className="text-xs px-2 py-0.5 rounded-full font-medium tracking-widest"
                  style={{ background: '#2A2720', color: '#8A8478' }}>
                  {(availableLangs[0] ?? 'es').toUpperCase()}
                </span>
              )}
              {isStory && (
                <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ background: 'rgba(201,147,58,0.2)', color: '#C9933A' }}>
                  cuento
                </span>
              )}
              <span className="text-xs" style={{ color: '#8A8478' }}>{work.year}</span>
            </div>

            <h1 className="text-3xl md:text-4xl font-bold mb-2"
              style={{ fontFamily: 'Georgia, serif', color: '#F2EDE4' }}>
              {work.title}
            </h1>
            {authorName && <p className="text-lg mb-1" style={{ color: '#8A8478' }}>{authorName}</p>}
            <p className="text-sm mb-5" style={{ color: '#8A8478' }}>
              {work.duration_label ?? ''}
              {!isStory && chapters.length > 0 && (
                <> · {chapters.length} {chapters.length === 1 ? 'capítulo' : 'capítulos'}</>
              )}
            </p>

            <div className="flex flex-wrap gap-2 mb-6">
              {(work.genre ?? []).map((g: string) => (
                <span key={g} className="text-xs px-3 py-1 rounded-full"
                  style={{ background: '#1A1816', color: '#8A8478', border: '1px solid #2A2720' }}>
                  {g}
                </span>
              ))}
            </div>

            <p className="text-base leading-7" style={{ color: '#A09890' }}>{work.description}</p>
          </div>

          {/* Lista de capítulos */}
          {chapters.length > 0 ? (
            <>
              <h2 className="text-base font-semibold mb-4" style={{ color: '#F2EDE4' }}>
                {isStory ? 'Audio' : 'Capítulos'}
              </h2>
              <div className="flex flex-col gap-2">
                {chapters.map((chapter: any) => (
                  <ChapterRow key={chapter.id} work={work} chapter={chapter} />
                ))}
              </div>
            </>
          ) : (
            <div className="rounded-xl px-5 py-4 text-sm"
              style={{ background: '#1A1816', border: '1px solid #2A2720', color: '#8A8478' }}>
              🎙️ Audio en producción — próximamente
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
