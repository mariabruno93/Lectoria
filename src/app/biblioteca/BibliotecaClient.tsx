'use client';

import { useState, useMemo } from 'react';
import BookCard from '@/components/BookCard';

export default function BibliotecaClient({ allBooks }: { allBooks: any[] }) {
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return allBooks;
    return allBooks.filter((b) => {
      const inTitle = b.title.toLowerCase().includes(q);
      const altTitles: string[] = b.alt_titles ?? b.altTitles ?? [];
      const inAlt = altTitles.some((t) => t.toLowerCase().includes(q));
      const authorName: string = b.authors?.name ?? (typeof b.author === 'string' ? b.author : '');
      const inAuthor = authorName.toLowerCase().includes(q);
      return inTitle || inAlt || inAuthor;
    });
  }, [query, allBooks]);

  const isSearching = query.trim().length > 0;
  const esResults = isSearching ? results : results.filter((b) => b.language === 'es');
  const enResults = isSearching ? results : results.filter((b) => b.language === 'en');

  return (
    <div>
      {/* Search bar */}
      <div className="relative mb-10">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8A8478" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscá por título o autor… (ej: Kafka, Dracula, Fitzgerald)"
          className="w-full pl-12 pr-4 py-3.5 rounded-xl text-sm outline-none transition-all"
          style={{
            background: '#1A1816',
            border: '1px solid #2A2720',
            color: '#F2EDE4',
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = '#C9933A')}
          onBlur={(e) => (e.currentTarget.style.borderColor = '#2A2720')}
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute inset-y-0 right-4 flex items-center"
            style={{ color: '#8A8478' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      {/* Searching: flat list of results */}
      {isSearching && (
        <div>
          {results.length === 0 ? (
            <div className="py-20 text-center" style={{ color: '#8A8478' }}>
              <p className="text-lg mb-2">Sin resultados para &ldquo;{query}&rdquo;</p>
              <p className="text-sm">Probá con el título en otro idioma o con el nombre del autor.</p>
            </div>
          ) : (
            <>
              <p className="text-sm mb-6" style={{ color: '#8A8478' }}>
                {results.length} {results.length === 1 ? 'resultado' : 'resultados'} para &ldquo;{query}&rdquo;
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
                {results.map((book) => (
                  <BookCard key={book.slug} work={book} />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Not searching: grouped by language */}
      {!isSearching && (
        <>
          <section className="mb-14">
            <h2 className="text-lg font-semibold mb-6 flex items-center gap-3" style={{ color: '#F2EDE4' }}>
              En español
              <span className="text-xs px-2 py-0.5 rounded-full font-normal" style={{ background: '#2A2720', color: '#8A8478' }}>
                {esResults.length} títulos
              </span>
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
              {esResults.map((book) => (
                <BookCard key={book.slug} work={book} />
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-6 flex items-center gap-3" style={{ color: '#F2EDE4' }}>
              In English
              <span className="text-xs px-2 py-0.5 rounded-full font-normal" style={{ background: '#2A2720', color: '#8A8478' }}>
                {enResults.length} titles
              </span>
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
              {enResults.map((book) => (
                <BookCard key={book.slug} work={book} />
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
