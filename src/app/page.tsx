import Link from 'next/link';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import HomePageClient from '@/components/HomePageClient';
import AdSlot from '@/components/AdSlot';
import type { LibraryEntry } from '@/components/LibraryButtons';
import type { Author } from '@/types';

// Géneros que califican como "Terror"
const TERROR_GENRES = new Set([
  'terror', 'gotico', 'gótico', 'horror', 'misterio',
  'horror cósmico', 'horror cosmico',
]);

function isTerror(genre: string[]) {
  return genre?.some(g => TERROR_GENRES.has(g.toLowerCase()));
}

export default async function Home() {
  const supabase = await createClient();

  // ─── Auth ────────────────────────────────────────────────────────────────
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id ?? null;

  // ─── Works + Authors ─────────────────────────────────────────────────────
  const { data: allWorks } = await supabase
    .from('works')
    .select('*, authors(name, slug, nationality)')
    .order('created_at', { ascending: false });

  const works = allWorks ?? [];

  // ─── Autores para carrusel ───────────────────────────────────────────────
  const { data: authorsRaw } = await supabase
    .from('authors')
    .select('id, slug, name, photo_url, nationality')
    .order('name', { ascending: true });

  // Solo autores que tienen obras
  const authorIdsWithWorks = new Set(works.map(w => w.author_id).filter(Boolean));
  const authors = (authorsRaw ?? []).filter(a => authorIdsWithWorks.has(a.id));

  // ─── Autores independientes (comunidad, destacados en la home) ────────────
  // Lectura server-side con admin (RLS bloquea user_works/profiles para anónimos).
  const admin = createAdminClient();
  const { data: indieWorks } = await admin
    .from('user_works').select('user_id').eq('status', 'published');
  const indieUids = [...new Set((indieWorks ?? []).map(w => w.user_id))];
  const { data: indieProfs } = indieUids.length
    ? await admin.from('profiles').select('id, display_name, avatar_url, profile_public').in('id', indieUids)
    : { data: [] };
  const indieCounts: Record<string, number> = {};
  (indieWorks ?? []).forEach(w => { indieCounts[w.user_id] = (indieCounts[w.user_id] ?? 0) + 1; });
  const indieAuthors = (indieProfs ?? [])
    .filter(p => p.profile_public !== false)
    .map(p => ({ userId: p.id, name: p.display_name ?? 'Autor', avatar: p.avatar_url ?? null, count: indieCounts[p.id] ?? 0 }));

  // ─── Popularidad (plays count) ───────────────────────────────────────────
  const { data: plays } = await supabase.from('plays').select('work_id');
  const playCounts: Record<string, number> = {};
  plays?.forEach(p => { playCounts[p.work_id] = (playCounts[p.work_id] || 0) + 1; });
  const hasPlays = Object.keys(playCounts).length > 0;

  let popularWorks: typeof works;
  if (hasPlays) {
    const topIds = new Set(
      Object.entries(playCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 12)
        .map(([id]) => id)
    );
    popularWorks = works.filter(w => topIds.has(w.id));
  } else {
    // Fallback: obras destacadas
    popularWorks = works.filter(w => w.featured).slice(0, 12);
  }

  // ─── User library ────────────────────────────────────────────────────────
  let libraryMap: Record<string, LibraryEntry> = {};
  if (userId) {
    try {
      const { data: lib } = await supabase
        .from('user_library')
        .select('work_id, is_following, is_playing, is_finished')
        .eq('user_id', userId);
      lib?.forEach(row => {
        libraryMap[row.work_id] = {
          is_following: row.is_following,
          is_playing: row.is_playing,
          is_finished: row.is_finished,
        };
      });
    } catch {
      // tabla aún no creada — ignorar
    }
  }

  // ─── Secciones personalizadas (solo si logueado) ─────────────────────────
  const playingWorks = userId
    ? works.filter(w => libraryMap[w.id]?.is_playing && !libraryMap[w.id]?.is_finished)
    : [];
  const followingWorks = userId
    ? works.filter(w => libraryMap[w.id]?.is_following)
    : [];

  // ─── Secciones fijas ─────────────────────────────────────────────────────
  const shortStories = works.filter(w => w.type === 'story' && w.language === 'es');
  const esBooks      = works.filter(w => w.type === 'book'  && w.language === 'es');
  const quirogaWorks = works.filter(w => w.authors?.slug === 'horacio-quiroga');
  const terrorWorks  = works.filter(w => w.language === 'es' && isTerror(w.genre));
  const englishWorks = works.filter(w => w.language === 'en');

  // ─── Armar secciones en orden ────────────────────────────────────────────
  const sections = [
    // Logged-in: personalizadas primero
    ...(playingWorks.length > 0
      ? [{ id: 'playing',   title: '▶ En reproducción', works: playingWorks }]
      : []),
    ...(followingWorks.length > 0
      ? [{ id: 'following', title: '＋ Seguidos',         works: followingWorks }]
      : []),

    // Fijas
    { id: 'popular',   title: '✦ Populares',        works: popularWorks,  href: '/biblioteca' },
    { id: 'stories',   title: 'Cuentos cortos',     works: shortStories,  href: '/biblioteca' },
    { id: 'books',     title: 'Libros',             works: esBooks,       href: '/biblioteca' },
    { id: 'argentina', title: 'Horacio Quiroga',    works: quirogaWorks },
    { id: 'terror',    title: 'Terror y misterio',  works: terrorWorks,   href: '/biblioteca' },
    { id: 'english',   title: 'En inglés',          works: englishWorks },
  ].filter(s => s.works.length > 0);

  return (
    <div>
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden px-6 pt-10 pb-16 md:pt-14 md:pb-24 flex flex-col items-center text-center"
        style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 0%, #2A1A08 0%, #0D0C0B 70%)' }}
      >
        <div className="max-w-2xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-widest mb-6" style={{ color: '#C9933A' }}>
            Audiolibros · Voz IA · Gratis
          </p>
          <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6"
            style={{ fontFamily: 'Georgia, serif', color: '#F2EDE4' }}>
            Escuchá a los grandes.
          </h1>
          <p className="text-lg md:text-xl mb-10" style={{ color: '#8A8478', lineHeight: 1.7 }}>
            Los clásicos de la literatura narrados con voz IA.
            <br />
            En español e inglés. Sin costo, sin registro.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/biblioteca"
              className="px-8 py-3 rounded-full text-sm font-semibold transition-opacity hover:opacity-80"
              style={{ background: '#C9933A', color: '#fff' }}>
              Explorar biblioteca
            </Link>
          </div>
        </div>
      </section>

      {/* ── Secciones ────────────────────────────────────────────────────── */}
      <HomePageClient
        sections={sections}
        userId={userId}
        initialLibraryMap={libraryMap}
        authors={authors}
        indieAuthors={indieAuthors}
      />

      {/* ── Sos autor: publicá y vendé tus obras ─────────────────────────── */}
      <section className="py-14 px-6">
        <div className="max-w-3xl mx-auto rounded-2xl p-8 sm:p-10 text-center"
          style={{ background: 'linear-gradient(160deg, #2A1A08 0%, #1A1816 100%)', border: '1px solid #C9933A40' }}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#C9933A' }}>
            Para autores
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold mb-3" style={{ fontFamily: 'Georgia, serif', color: '#F2EDE4' }}>
            ¿Escribís? Publicá tus obras en Epovox
          </h2>
          <p className="text-base leading-7 mb-7 max-w-xl mx-auto" style={{ color: '#B4ADA2' }}>
            Subí tus cuentos, generá el audio con IA en segundos y compartilos con la comunidad
            —gratis o poniéndoles un precio—. De cada venta, vos cobrás el <strong style={{ color: '#F2EDE4' }}>70%</strong>,
            directo a tu Mercado Pago.
          </p>
          <Link href="/perfil/obras/nueva"
            className="inline-block px-7 py-3 rounded-full text-sm font-semibold transition-opacity hover:opacity-80"
            style={{ background: '#C9933A', color: '#fff' }}>
            Publicá tu primera obra
          </Link>
        </div>
      </section>

      {/* Aviso in-page (AdSense) — se activa al configurar NEXT_PUBLIC_ADSENSE_SLOT */}
      <div className="max-w-5xl mx-auto px-6">
        <AdSlot />
      </div>

    </div>
  );
}
