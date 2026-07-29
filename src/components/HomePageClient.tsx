'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import Link from 'next/link';
import BookCard from '@/components/BookCard';
import LibraryButtons, { type LibraryEntry } from '@/components/LibraryButtons';

interface Section {
  id: string;
  title: string;
  works: any[];
  href?: string;
}

interface Author {
  id: string;
  slug: string;
  name: string;
  photo_url: string | null;
  nationality: string | null;
}

interface IndieAuthor {
  userId: string;
  name: string;
  avatar: string | null;
  count: number;
}

interface Props {
  sections: Section[];
  userId: string | null;
  initialLibraryMap: Record<string, LibraryEntry>;
  authors?: Author[];
  indieAuthors?: IndieAuthor[];
}

/* ─── Arrow button ─────────────────────────────────────────────────────────── */
function ArrowBtn({
  dir,
  visible,
  onClick,
}: {
  dir: 'left' | 'right';
  visible: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={dir === 'left' ? 'Anterior' : 'Siguiente'}
      className="absolute top-1/2 -translate-y-1/2 z-30 w-9 h-9 rounded-full flex items-center justify-center transition-all"
      style={{
        [dir]: '-18px',
        background: '#C9933A',
        color: '#fff',
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? 'auto' : 'none',
        boxShadow: '0 2px 10px rgba(0,0,0,0.5)',
      }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        {dir === 'left'
          ? <polyline points="15 18 9 12 15 6" />
          : <polyline points="9 18 15 12 9 6" />}
      </svg>
    </button>
  );
}

/* ─── Scroll row ───────────────────────────────────────────────────────────── */
function ScrollRow({
  works,
  userId,
  libraryMap,
  onUpdate,
}: {
  works: any[];
  userId: string | null;
  libraryMap: Record<string, LibraryEntry>;
  onUpdate: (workId: string, entry: LibraryEntry) => void;
}) {
  const rowRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  function checkScroll() {
    const el = rowRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }

  useEffect(() => {
    checkScroll();
    const el = rowRef.current;
    if (!el) return;
    const ro = new ResizeObserver(checkScroll);
    ro.observe(el);
    return () => ro.disconnect();
  }, [works]);

  function scroll(dir: 'left' | 'right') {
    const el = rowRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === 'left' ? -el.clientWidth * 0.75 : el.clientWidth * 0.75, behavior: 'smooth' });
  }

  return (
    <div className="relative">
      {/* Left gradient fade */}
      {canLeft && (
        <div className="absolute left-0 top-0 bottom-2 w-10 z-20 pointer-events-none"
          style={{ background: 'linear-gradient(to right, #0D0C0B 0%, transparent 100%)' }} />
      )}

      <ArrowBtn dir="left" visible={canLeft} onClick={() => scroll('left')} />

      <div
        ref={rowRef}
        onScroll={checkScroll}
        className="flex gap-3 overflow-x-auto pb-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}
      >
        {works.map((work: any) => (
          <div key={work.id ?? work.slug} className="flex-none w-36 sm:w-40 relative group/card">
            <BookCard work={work} />
            {userId && work.id && (
              <div
                className="absolute top-2 right-2 z-20 flex flex-col gap-1.5 opacity-0 group-hover/card:opacity-100 transition-opacity"
                onClick={e => e.preventDefault()}
              >
                <LibraryButtons
                  workId={work.id}
                  userId={userId}
                  initialStatus={libraryMap[work.id] ?? null}
                  onUpdate={onUpdate}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      <ArrowBtn dir="right" visible={canRight} onClick={() => scroll('right')} />

      {/* Right gradient fade */}
      {canRight && (
        <div className="absolute right-0 top-0 bottom-2 w-10 z-20 pointer-events-none"
          style={{ background: 'linear-gradient(to left, #0D0C0B 0%, transparent 100%)' }} />
      )}
    </div>
  );
}

/* ─── Author scroll row ────────────────────────────────────────────────────── */
type AuthorItem = { key: string; href: string; name: string; photo: string | null };

function AuthorScrollRow({ authors }: { authors: AuthorItem[] }) {
  const rowRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  function checkScroll() {
    const el = rowRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }

  useEffect(() => {
    checkScroll();
    const el = rowRef.current;
    if (!el) return;
    const ro = new ResizeObserver(checkScroll);
    ro.observe(el);
    return () => ro.disconnect();
  }, [authors]);

  function scroll(dir: 'left' | 'right') {
    const el = rowRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === 'left' ? -el.clientWidth * 0.75 : el.clientWidth * 0.75, behavior: 'smooth' });
  }

  return (
    <div className="relative">
      {canLeft && (
        <div className="absolute left-0 top-0 bottom-2 w-10 z-20 pointer-events-none"
          style={{ background: 'linear-gradient(to right, #0D0C0B 0%, transparent 100%)' }} />
      )}
      <ArrowBtn dir="left" visible={canLeft} onClick={() => scroll('left')} />

      <div
        ref={rowRef}
        onScroll={checkScroll}
        className="flex gap-5 overflow-x-auto pb-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}
      >
        {authors.map(author => (
          <Link
            key={author.key}
            href={author.href}
            className="flex-none flex flex-col items-center gap-2 group"
            style={{ width: '88px' }}
          >
            <div
              className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0 transition-transform group-hover:scale-105"
              style={{ border: '2px solid #2A2720' }}
            >
              {author.photo ? (
                <img src={author.photo} alt={author.name}
                  className="w-full h-full object-cover" loading="lazy" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xl font-bold"
                  style={{ background: '#1A1816', color: '#C9933A', fontFamily: 'Georgia, serif' }}>
                  {author.name.charAt(0)}
                </div>
              )}
            </div>
            <p className="text-xs text-center leading-tight line-clamp-2 group-hover:text-amber-400 transition-colors"
              style={{ color: '#A09890' }}>
              {author.name}
            </p>
          </Link>
        ))}
      </div>

      <ArrowBtn dir="right" visible={canRight} onClick={() => scroll('right')} />
      {canRight && (
        <div className="absolute right-0 top-0 bottom-2 w-10 z-20 pointer-events-none"
          style={{ background: 'linear-gradient(to left, #0D0C0B 0%, transparent 100%)' }} />
      )}
    </div>
  );
}

/* ─── Main component ───────────────────────────────────────────────────────── */
export default function HomePageClient({ sections, userId, initialLibraryMap, authors = [], indieAuthors = [] }: Props) {
  const [libraryMap, setLibraryMap] = useState<Record<string, LibraryEntry>>(initialLibraryMap);

  const handleUpdate = useCallback((workId: string, entry: LibraryEntry) => {
    setLibraryMap(prev => ({ ...prev, [workId]: entry }));
  }, []);

  if (sections.every(s => s.works.length === 0) && authors.length === 0 && indieAuthors.length === 0) return null;

  const classicItems: AuthorItem[] = authors.map(a => ({
    key: a.id, href: `/autor/${a.slug}`, name: a.name, photo: a.photo_url,
  }));
  const indieItems: AuthorItem[] = indieAuthors.map(a => ({
    key: a.userId, href: `/independientes/${a.userId}`, name: a.name, photo: a.avatar,
  }));

  return (
    <div className="py-10 flex flex-col gap-12">

      {/* ── Autores independientes (destacados arriba) ───────────────────── */}
      {indieItems.length > 0 && (
        <section className="max-w-6xl mx-auto w-full px-6">
          <div className="rounded-2xl px-5 sm:px-7 py-6"
            style={{ background: 'linear-gradient(160deg, #2A1A0899 0%, #1A181600 100%)', border: '1px solid #C9933A33' }}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: '#C9933A' }}>
                  Comunidad
                </p>
                <h2 className="text-lg font-semibold" style={{ fontFamily: 'Georgia, serif', color: '#F2EDE4' }}>
                  Autores independientes
                </h2>
              </div>
              <Link
                href="/independientes"
                className="text-sm font-medium px-4 py-1.5 rounded-full transition-opacity hover:opacity-80 flex-shrink-0"
                style={{ background: '#C9933A', color: '#fff' }}
              >
                Ver todos →
              </Link>
            </div>
            <AuthorScrollRow authors={indieItems} />
          </div>
        </section>
      )}

      {/* ── Carrusel de autores clásicos ─────────────────────────────────── */}
      {classicItems.length > 0 && (
        <section className="max-w-6xl mx-auto w-full px-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold"
              style={{ fontFamily: 'Georgia, serif', color: '#F2EDE4' }}>
              Autores clásicos
            </h2>
            <Link
              href="/autores"
              className="text-sm font-medium px-4 py-1.5 rounded-full transition-opacity hover:opacity-80"
              style={{ background: '#1A1816', border: '1px solid #2A2720', color: '#C9933A' }}
            >
              Ver todos →
            </Link>
          </div>
          <AuthorScrollRow authors={classicItems} />
        </section>
      )}

      {sections.map((section) => {
        if (section.works.length === 0) return null;
        return (
          <section key={section.id} className="max-w-6xl mx-auto w-full px-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold"
                style={{ fontFamily: 'Georgia, serif', color: '#F2EDE4' }}>
                {section.title}
              </h2>
              {section.href && (
                <Link
                  href={section.href}
                  className="text-sm font-medium px-4 py-1.5 rounded-full transition-opacity hover:opacity-80"
                  style={{ background: '#1A1816', border: '1px solid #2A2720', color: '#C9933A' }}
                >
                  Ver todos →
                </Link>
              )}
            </div>

            {/* Scroll row with arrows */}
            <ScrollRow
              works={section.works}
              userId={userId}
              libraryMap={libraryMap}
              onUpdate={handleUpdate}
            />
          </section>
        );
      })}
    </div>
  );
}
