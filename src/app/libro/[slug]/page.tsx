import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import LibroClient from './LibroClient';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: work } = await supabase
    .from('works')
    .select('title, description')
    .eq('slug', slug)
    .single();
  if (!work) return {};
  return {
    title: `${work.title} — Epovox`,
    description: work.description ?? undefined,
  };
}

export default async function LibroPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: work } = await supabase
    .from('works')
    .select('*, authors(name, slug, nationality, born_year, died_year), chapters(*)')
    .eq('slug', slug)
    .single();

  if (!work) notFound();

  const { data: { user } } = await supabase.auth.getUser();
  let libraryStatus = null;
  if (user && work.id) {
    const { data } = await supabase
      .from('user_library')
      .select('is_following, is_playing, is_finished')
      .eq('user_id', user.id)
      .eq('work_id', work.id)
      .maybeSingle();
    libraryStatus = data ?? null;
  }

  return <LibroClient work={work} userId={user?.id ?? null} libraryStatus={libraryStatus} />;
}
