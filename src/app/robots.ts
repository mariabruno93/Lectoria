import type { MetadataRoute } from 'next';

const BASE = 'https://epovox.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Áreas privadas / no indexables
      disallow: ['/admin', '/perfil', '/api', '/login'],
    },
    sitemap: `${BASE}/sitemap.xml`,
    host: BASE,
  };
}
