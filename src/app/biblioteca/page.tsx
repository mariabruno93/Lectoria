import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import BibliotecaClient from './BibliotecaClient';

export const metadata: Metadata = {
  title: 'Biblioteca — Epovox',
  description: 'Todos los audiolibros disponibles en Epovox. Clásicos de la literatura en español e inglés.',
};

export default async function BibliotecaPage() {
  const supabase = await createClient();
  const { data: works } = await supabase
    .from('works')
    .select('*, authors(name, slug)')
    .order('language', { ascending: true })
    .order('title', { ascending: true });

  const allWorks = works ?? [];

  return (
    <div className="max-w-6xl mx-auto px-6 py-14">
      <div className="mb-10">
        <h1 className="text-4xl font-bold mb-3" style={{ fontFamily: 'Georgia, serif', color: '#F2EDE4' }}>
          Biblioteca
        </h1>
        <p style={{ color: '#8A8478' }}>
          {allWorks.length} títulos · Dominio público · Gratis
        </p>
      </div>
      <BibliotecaClient allBooks={allWorks} />
    </div>
  );
}
