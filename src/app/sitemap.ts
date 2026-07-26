import type { MetadataRoute } from 'next';
import { createAdminClient } from '@/lib/supabase/server';

const BASE = 'https://epovox.com';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const sb = createAdminClient();

  // Páginas estáticas
  const staticPages: MetadataRoute.Sitemap = [
    '', '/biblioteca', '/autores', '/independientes', '/privacidad', '/terminos', '/terminos-autor', '/arrepentimiento',
  ].map((p) => ({
    url: `${BASE}${p}`,
    changeFrequency: p === '' ? 'daily' : 'weekly',
    priority: p === '' ? 1 : 0.6,
  }));

  // Cuentos del catálogo
  const { data: works } = await sb.from('works').select('slug, updated_at');
  const workPages: MetadataRoute.Sitemap = (works ?? []).map((w) => ({
    url: `${BASE}/libro/${w.slug}`,
    lastModified: w.updated_at ? new Date(w.updated_at) : undefined,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  // Autores del catálogo
  const { data: authors } = await sb.from('authors').select('slug');
  const authorPages: MetadataRoute.Sitemap = (authors ?? []).map((a) => ({
    url: `${BASE}/autor/${a.slug}`,
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  // Obras de autores independientes (publicadas)
  const { data: userWorks } = await sb
    .from('user_works')
    .select('id, updated_at')
    .eq('status', 'published');
  const userWorkPages: MetadataRoute.Sitemap = (userWorks ?? []).map((w) => ({
    url: `${BASE}/obra/${w.id}`,
    lastModified: w.updated_at ? new Date(w.updated_at) : undefined,
    changeFrequency: 'weekly',
    priority: 0.5,
  }));

  return [...staticPages, ...workPages, ...authorPages, ...userWorkPages];
}
