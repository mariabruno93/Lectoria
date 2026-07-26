import { createClient, createAdminClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import AutorClient from './AutorClient';
import JsonLd from '@/components/JsonLd';

const BASE = 'https://epovox.com';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const supabase = createAdminClient();
  const { data: author } = await supabase.from('authors').select('name, bio, photo_url').eq('slug', slug).single();
  if (!author) return {};
  const title = `${author.name} — Cuentos en audiolibro gratis | Epovox`;
  const description = author.bio ?? `Escuchá los cuentos de ${author.name} narrados en audio, gratis, en Epovox.`;
  return {
    title,
    description,
    alternates: { canonical: `/autor/${slug}` },
    openGraph: { title, description, type: 'profile', url: `${BASE}/autor/${slug}`, images: author.photo_url ? [{ url: author.photo_url }] : undefined },
  };
}

export default async function AutorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: author } = await supabase.from('authors').select('*').eq('slug', slug).single();
  if (!author) notFound();

  const { data: works } = await supabase
    .from('works')
    .select('*, chapters(*)')
    .eq('author_id', author.id)
    .order('year', { ascending: true });

  const { data: playsData } = await supabase
    .from('plays')
    .select('work_id')
    .in('work_id', (works ?? []).map((w) => w.id));

  const playCount: Record<string, number> = {};
  (playsData ?? []).forEach((p) => {
    playCount[p.work_id] = (playCount[p.work_id] ?? 0) + 1;
  });

  const books = (works ?? []).filter((w) => w.type === 'book');
  const stories = (works ?? []).filter((w) => w.type === 'story');

  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: author.name,
    url: `${BASE}/autor/${author.slug}`,
    ...(author.bio ? { description: author.bio } : {}),
    ...(author.photo_url ? { image: author.photo_url } : {}),
    ...(author.nationality ? { nationality: author.nationality } : {}),
    ...(author.born_year ? { birthDate: String(author.born_year) } : {}),
    ...(author.died_year ? { deathDate: String(author.died_year) } : {}),
    jobTitle: 'Escritor',
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <AutorClient author={author} books={books} stories={stories} playCount={playCount} />
    </>
  );
}
