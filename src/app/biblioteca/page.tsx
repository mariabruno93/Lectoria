import { Metadata } from 'next';
import { books } from '@/lib/books';
import BibliotecaClient from './BibliotecaClient';

export const metadata: Metadata = {
  title: 'Biblioteca — Lectoria',
  description: 'Todos los audiolibros disponibles en Lectoria. Clásicos de la literatura en español e inglés.',
};

export default function BibliotecaPage() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-14">
      <div className="mb-10">
        <h1 className="text-4xl font-bold mb-3" style={{ fontFamily: 'Georgia, serif', color: '#F2EDE4' }}>
          Biblioteca
        </h1>
        <p style={{ color: '#8A8478' }}>
          {books.length} títulos · Dominio público · Gratis
        </p>
      </div>
      <BibliotecaClient allBooks={books} />
    </div>
  );
}
