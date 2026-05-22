'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Book, Chapter } from '@/lib/books';
import { usePlayer } from '@/context/PlayerContext';

const LANG_LABELS: Record<string, string> = { es: 'Español', en: 'English' };
const LANG_FLAGS: Record<string, string> = { es: '🇪🇸', en: '🇬🇧' };

function LanguageSelector({ book }: { book: Book }) {
  const router = useRouter();
  if (!book.translations || Object.keys(book.translations).length === 0) return null;

  // Available langs = current + translations
  const available: { lang: string; slug: string }[] = [
    { lang: book.language, slug: book.slug },
    ...Object.entries(book.translations).map(([lang, slug]) => ({ lang, slug: slug! })),
  ].sort((a, b) => a.lang.localeCompare(b.lang));

  return (
    <div className="flex items-center gap-2 mb-5">
      <span className="text-xs" style={{ color: '#8A8478' }}>Disponible en:</span>
      {available.map(({ lang, slug }) => {
        const isCurrent = lang === book.language;
        return (
          <button
            key={lang}
            onClick={() => !isCurrent && router.push(`/libro/${slug}`)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-opacity"
            style={
              isCurrent
                ? { background: '#C9933A', color: '#fff', cursor: 'default' }
                : { background: '#2A2720', color: '#8A8478', cursor: 'pointer' }
            }
          >
            <span>{LANG_FLAGS[lang]}</span>
            <span>{LANG_LABELS[lang] ?? lang.toUpperCase()}</span>
          </button>
        );
      })}
    </div>
  );
}

function ChapterRow({ book, chapter }: { book: Book; chapter: Chapter }) {
  const { play, togglePlay, book: activeBook, chapter: activeChapter, isPlaying } = usePlayer();
  const isActive = activeBook?.slug === book.slug && activeChapter?.id === chapter.id;

  function handleClick() {
    if (isActive) {
      togglePlay();
    } else {
      play(book, chapter);
    }
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
        <p
          className="text-sm font-medium truncate"
          style={{ color: isActive ? '#C9933A' : '#F2EDE4' }}
        >
          {chapter.title}
        </p>
        <p className="text-xs mt-0.5" style={{ color: '#8A8478' }}>
          {chapter.duration}
        </p>
      </div>
      <button
        onClick={handleClick}
        className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-opacity hover:opacity-80 flex-shrink-0"
        style={
          isActive
            ? { background: '#C9933A', color: '#fff' }
            : { background: '#2A2720', color: '#F2EDE4' }
        }
      >
        {isActive && isPlaying ? (
          <>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
            Pausar
          </>
        ) : (
          <>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5,3 19,12 5,21" />
            </svg>
            {isActive ? 'Continuar' : 'Reproducir'}
          </>
        )}
      </button>
    </div>
  );
}

export default function LibroClient({ book }: { book: Book }) {
  const { play, book: activeBook, isPlaying } = usePlayer();
  const isThisBookActive = activeBook?.slug === book.slug;

  return (
    <div className="max-w-5xl mx-auto px-6 py-14">
      {/* Back */}
      <Link
        href="/biblioteca"
        className="inline-flex items-center gap-2 text-sm mb-10 transition-opacity hover:opacity-80"
        style={{ color: '#8A8478' }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Volver a la biblioteca
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-12">
        {/* Cover + main play */}
        <div className="flex flex-col gap-5">
          <div
            className="aspect-[2/3] rounded-2xl"
            style={{
              background: `linear-gradient(160deg, ${book.coverGradient.from} 0%, ${book.coverGradient.to} 100%)`,
              boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
            }}
          />
          <button
            onClick={() => play(book, book.chapters[0])}
            className="w-full py-3 rounded-full font-semibold flex items-center justify-center gap-2 transition-opacity hover:opacity-80"
            style={{ background: '#C9933A', color: '#fff' }}
          >
            {isThisBookActive && isPlaying ? (
              <>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="white">
                  <rect x="6" y="4" width="4" height="16" rx="1" />
                  <rect x="14" y="4" width="4" height="16" rx="1" />
                </svg>
                En reproducción
              </>
            ) : (
              <>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="white">
                  <polygon points="5,3 19,12 5,21" />
                </svg>
                Reproducir libro
              </>
            )}
          </button>
        </div>

        {/* Details + chapters */}
        <div>
          <div className="mb-8">
            <LanguageSelector book={book} />
            <div className="flex items-center gap-2 mb-3">
              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium tracking-widest"
                style={{ background: '#2A2720', color: '#8A8478' }}
              >
                {book.language.toUpperCase()}
              </span>
              <span className="text-xs" style={{ color: '#8A8478' }}>
                {book.year}
              </span>
            </div>

            <h1
              className="text-3xl md:text-4xl font-bold mb-2"
              style={{ fontFamily: 'Georgia, serif', color: '#F2EDE4' }}
            >
              {book.title}
            </h1>
            <p className="text-lg mb-1" style={{ color: '#8A8478' }}>
              {book.author}
            </p>
            <p className="text-sm mb-5" style={{ color: '#8A8478' }}>
              {book.duration} · {book.chapters.length}{' '}
              {book.chapters.length === 1 ? 'capítulo' : 'capítulos'}
            </p>

            <div className="flex flex-wrap gap-2 mb-6">
              {book.genre.map((g) => (
                <span
                  key={g}
                  className="text-xs px-3 py-1 rounded-full"
                  style={{ background: '#1A1816', color: '#8A8478', border: '1px solid #2A2720' }}
                >
                  {g}
                </span>
              ))}
            </div>

            <p className="text-base leading-7" style={{ color: '#A09890' }}>
              {book.description}
            </p>
          </div>

          {/* Chapters list */}
          <h2 className="text-base font-semibold mb-4" style={{ color: '#F2EDE4' }}>
            Capítulos
          </h2>
          <div className="flex flex-col gap-2">
            {book.chapters.map((chapter) => (
              <ChapterRow key={chapter.id} book={book} chapter={chapter} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
