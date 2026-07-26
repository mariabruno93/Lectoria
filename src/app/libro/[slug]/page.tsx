import { createClient, createAdminClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import LibroClient from './LibroClient';
import JsonLd from '@/components/JsonLd';
import type { Metadata } from 'next';

const BASE = 'https://epovox.com';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const supabase = createAdminClient();
  const { data: work } = await supabase
    .from('works')
    .select('title, description, cover_url, authors(name)')
    .eq('slug', slug)
    .single();
  if (!work) return {};
  const author = (work as any).authors?.name;
  const title = `${work.title}${author ? `, de ${author}` : ''} — Audiolibro gratis para escuchar | Epovox`;
  const description =
    (work.description ? work.description + ' ' : '') +
    `Escuchá el audiolibro completo de "${work.title}" gratis en Epovox, con voz IA y texto para seguir la lectura.`;
  return {
    title,
    description,
    alternates: { canonical: `/libro/${slug}` },
    openGraph: {
      title,
      description,
      type: 'article',
      url: `${BASE}/libro/${slug}`,
      images: work.cover_url ? [{ url: work.cover_url }] : undefined,
    },
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

  const author = (work as any).authors;
  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'AudioBook',
    name: work.title,
    url: `${BASE}/libro/${work.slug}`,
    inLanguage: work.language ?? 'es',
    ...(work.description ? { description: work.description } : {}),
    ...(work.cover_url ? { image: work.cover_url } : {}),
    ...(work.year ? { datePublished: String(work.year) } : {}),
    ...(Array.isArray(work.genre) && work.genre.length ? { genre: work.genre } : {}),
    ...(author?.name ? { author: { '@type': 'Person', name: author.name } } : {}),
    publisher: { '@type': 'Organization', name: 'Epovox', url: BASE },
    isAccessibleForFree: true,
  };
  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: BASE },
      { '@type': 'ListItem', position: 2, name: 'Biblioteca', item: `${BASE}/biblioteca` },
      { '@type': 'ListItem', position: 3, name: work.title, item: `${BASE}/libro/${work.slug}` },
    ],
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <JsonLd data={breadcrumb} />
      <LibroClient work={work} userId={user?.id ?? null} libraryStatus={libraryStatus} />
    </>
  );
}
