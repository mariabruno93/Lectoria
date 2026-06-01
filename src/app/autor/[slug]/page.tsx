import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import AutorClient from './AutorClient';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: author } = await supabase.from('authors').select('*').eq('slug', slug).single();
  if (!author) return {};
  return { title: `${author.name} — Epovox`, description: author.bio ?? undefined };
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

  return <AutorClient author={author} books={books} stories={stories} playCount={playCount} />;
}
