import { Metadata } from 'next';
import BookCard from '@/components/BookCard';
import { books } from '@/lib/books';

export const metadata: Metadata = {
  title: 'Biblioteca — Lectoria',
  description: 'Todos los audiolibros disponibles en Lectoria. Clásicos de la literatura en español e inglés.',
};

export default function BibliotecaPage() {
  const es = books.filter((b) => b.language === 'es');
  const en = books.filter((b) => b.language === 'en');

  return (
    <div className="max-w-6xl mx-auto px-6 py-14">
      <div className="mb-12">
        <h1
          className="text-4xl font-bold mb-3"
          style={{ fontFamily: 'Georgia, serif', color: '#F2EDE4' }}
        >
          Biblioteca
        </h1>
        <p style={{ color: '#8A8478' }}>
          {books.length} libros disponibles · Dominio público · Gratis
        </p>
      </div>

      {/* Spanish */}
      <section className="mb-14">
        <h2
          className="text-lg font-semibold mb-6 flex items-center gap-3"
          style={{ color: '#F2EDE4' }}
        >
          En español
          <span
            className="text-xs px-2 py-0.5 rounded-full font-normal"
            style={{ background: '#2A2720', color: '#8A8478' }}
          >
            {es.length} títulos
          </span>
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
          {es.map((book) => (
            <BookCard key={book.slug} book={book} />
          ))}
        </div>
      </section>

      {/* English */}
      <section>
        <h2
          className="text-lg font-semibold mb-6 flex items-center gap-3"
          style={{ color: '#F2EDE4' }}
        >
          In English
          <span
            className="text-xs px-2 py-0.5 rounded-full font-normal"
            style={{ background: '#2A2720', color: '#8A8478' }}
          >
            {en.length} titles
          </span>
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
          {en.map((book) => (
            <BookCard key={book.slug} book={book} />
          ))}
        </div>
      </section>
    </div>
  );
}
