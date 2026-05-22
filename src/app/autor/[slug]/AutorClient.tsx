'use client';

import Link from 'next/link';
import { Author, Work } from '@/types';
import BookCard from '@/components/BookCard';

function StatPill({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="text-center">
      <p className="text-2xl font-bold" style={{ color: '#C9933A', fontFamily: 'Georgia, serif' }}>{value}</p>
      <p className="text-xs mt-1" style={{ color: '#8A8478' }}>{label}</p>
    </div>
  );
}

export default function AutorClient({
  author, books, stories, playCount,
}: {
  author: Author;
  books: Work[];
  stories: Work[];
  playCount: Record<string, number>;
}) {
  const totalWorks = books.length + stories.length;
  const totalPlays = Object.values(playCount).reduce((a, b) => a + b, 0);

  // Color de fondo basado en la primera obra del autor
  const firstWork = books[0] ?? stories[0];
  const heroColor = firstWork?.cover_gradient_from ?? '#2A1A08';

  return (
    <div>
      {/* Hero del autor */}
      <div
        className="relative px-6 pt-16 pb-10"
        style={{ background: `linear-gradient(to bottom, ${heroColor}CC 0%, #0D0C0B 100%)` }}
      >
        <div className="max-w-6xl mx-auto flex items-end gap-8">
          {/* Avatar / Foto */}
          <div
            className="w-36 h-36 rounded-full flex-shrink-0 flex items-center justify-center text-5xl font-bold shadow-2xl"
            style={{
              background: `linear-gradient(135deg, ${heroColor}, #0D0C0B)`,
              border: '3px solid rgba(201,147,58,0.3)',
              color: '#F2EDE4',
              fontFamily: 'Georgia, serif',
            }}
          >
            {author.photo_url
              ? <img src={author.photo_url} alt={author.name} className="w-full h-full rounded-full object-cover" />
              : author.name.charAt(0)
            }
          </div>

          <div className="flex-1 pb-2">
            <p className="text-xs uppercase tracking-widest mb-2" style={{ color: '#C9933A' }}>Autor</p>
            <h1 className="text-4xl md:text-6xl font-bold mb-3" style={{ fontFamily: 'Georgia, serif', color: '#F2EDE4' }}>
              {author.name}
            </h1>
            <p className="text-sm" style={{ color: '#8A8478' }}>
              {author.nationality}
              {author.born_year && ` · ${author.born_year}`}
              {author.died_year && ` – ${author.died_year}`}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Stats */}
        <div className="flex gap-10 mb-12 pb-8 border-b" style={{ borderColor: '#2A2720' }}>
          <StatPill label="obras" value={totalWorks} />
          <StatPill label="libros" value={books.length} />
          <StatPill label="cuentos" value={stories.length} />
          {totalPlays > 0 && <StatPill label="reproducciones" value={totalPlays} />}
        </div>

        {/* Bio */}
        {author.bio && (
          <section className="mb-12 max-w-2xl">
            <h2 className="text-lg font-semibold mb-4" style={{ color: '#F2EDE4', fontFamily: 'Georgia, serif' }}>
              Sobre el autor
            </h2>
            <p className="leading-7" style={{ color: '#A09890' }}>{author.bio}</p>
          </section>
        )}

        {/* Libros */}
        {books.length > 0 && (
          <section className="mb-12">
            <h2 className="text-lg font-semibold mb-6" style={{ color: '#F2EDE4', fontFamily: 'Georgia, serif' }}>
              Libros
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
              {books.map((work) => <BookCard key={work.id} work={work} />)}
            </div>
          </section>
        )}

        {/* Cuentos */}
        {stories.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold mb-6" style={{ color: '#F2EDE4', fontFamily: 'Georgia, serif' }}>
              Cuentos cortos
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
              {stories.map((work) => <BookCard key={work.id} work={work} />)}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
