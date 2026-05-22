import { getBookBySlug, books } from '@/lib/books';
import { notFound } from 'next/navigation';
import LibroClient from './LibroClient';
import type { Metadata } from 'next';

export async function generateStaticParams() {
  return books.map((b) => ({ slug: b.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const book = getBookBySlug(slug);
  if (!book) return {};
  return {
    title: `${book.title} — Lectoria`,
    description: book.description,
  };
}

export default async function LibroPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const book = getBookBySlug(slug);
  if (!book) notFound();
  return <LibroClient book={book} />;
}
