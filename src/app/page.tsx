import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import HomePageClient from '@/components/HomePageClient';
import type { LibraryEntry } from '@/components/LibraryButtons';

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
          <img src="/logo.png" alt="Epovox" width={72} height={72} className="mx-auto mb-6" style={{ objectFit: 'contain' }} />
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
            <Link href="#como-funciona"
              className="px-8 py-3 rounded-full text-sm font-semibold border transition-colors hover:opacity-80"
              style={{ borderColor: '#2A2720', color: '#8A8478' }}>
              ¿Cómo funciona?
            </Link>
          </div>
        </div>
      </section>

      {/* ── Secciones ────────────────────────────────────────────────────── */}
      <HomePageClient
        sections={sections}
        userId={userId}
        initialLibraryMap={libraryMap}
      />

      {/* ── Cómo funciona ────────────────────────────────────────────────── */}
      <section id="como-funciona" className="border-t py-16 px-6"
        style={{ borderColor: '#2A2720' }}>
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-semibold mb-12"
            style={{ fontFamily: 'Georgia, serif', color: '#F2EDE4' }}>
            ¿Cómo funciona?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
            {[
              { n: '01', title: 'Elegí un título', desc: 'Navegá nuestra biblioteca de clásicos en español e inglés.' },
              { n: '02', title: 'Escuchá o leé', desc: 'Reproductor de audio con read-along sincronizado.' },
              { n: '03', title: 'Seguí tu progreso', desc: 'Marcá lo que estás escuchando y lo que terminaste.' },
            ].map(({ n, title, desc }) => (
              <div key={n} className="flex flex-col items-center gap-3">
                <span className="text-3xl font-bold"
                  style={{ fontFamily: 'Georgia, serif', color: '#C9933A', opacity: 0.4 }}>
                  {n}
                </span>
                <h3 className="font-semibold" style={{ color: '#F2EDE4' }}>{title}</h3>
                <p className="text-sm text-center" style={{ color: '#8A8478', lineHeight: 1.7 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PDF teaser ───────────────────────────────────────────────────── */}
      <section className="py-12 px-6">
        <div className="max-w-3xl mx-auto rounded-2xl p-8 text-center"
          style={{ background: '#1A1816', border: '1px solid #2A2720' }}>
          <span className="text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full inline-block mb-4"
            style={{ background: '#2A2720', color: '#C9933A' }}>
            Próximamente
          </span>
          <h3 className="text-xl font-semibold mb-3"
            style={{ fontFamily: 'Georgia, serif', color: '#F2EDE4' }}>
            ¿Tenés un PDF o Word?
          </h3>
          <p style={{ color: '#8A8478', lineHeight: 1.7 }}>
            Muy pronto vas a poder subir cualquier documento y convertirlo en audiolibro con voz IA en segundos.
          </p>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="border-t py-8 px-6 text-center text-xs"
        style={{ borderColor: '#2A2720', color: '#8A8478' }}>
        © {new Date().getFullYear()} Epovox · Todos los libros son de dominio público
      </footer>
    </div>
  );
}
