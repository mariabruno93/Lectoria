import type { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import UserWorkCard from '@/components/UserWorkCard';

export const metadata: Metadata = {
  title: 'Autores independientes — Epovox',
  description: 'Obras publicadas por autores independientes en Epovox.',
};

export default async function IndependientesPage() {
  const supabase = await createClient();

  // Todas las obras publicadas (públicas y privadas), con perfil del autor
  const { data: works } = await supabase
    .from('user_works')
    .select('*, profiles(display_name, avatar_url, profile_public)')
    .eq('status', 'published')
    .order('created_at', { ascending: false });

  // Solo obras de autores con perfil público
  const allPublished = (works ?? []).filter(w => (w.profiles as any)?.profile_public !== false);

  // Autores únicos: aparecen si tienen al menos 1 obra publicada y perfil público
  const authorMap = new Map<string, { userId: string; name: string; avatar: string | null; count: number }>();
  allPublished.forEach(w => {
    const uid = w.user_id;
    if (!authorMap.has(uid)) {
      authorMap.set(uid, {
        userId: uid,
        name:   (w.profiles as any)?.display_name ?? 'Autor',
        avatar: (w.profiles as any)?.avatar_url ?? null,
        count:  0,
      });
    }
    authorMap.get(uid)!.count++;
  });
  const authors = Array.from(authorMap.values());

  // Todas las obras publicadas de autores con perfil público (gratuitas y de pago)
  const list = allPublished;

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">

      {/* Header */}
      <div className="mb-12">
        <p className="text-xs uppercase tracking-widest mb-2" style={{ color: '#C9933A' }}>
          Comunidad
        </p>
        <h1 className="text-3xl font-bold" style={{ fontFamily: 'Georgia, serif', color: '#F2EDE4' }}>
          Autores independientes
        </h1>
        <p className="mt-2 text-sm" style={{ color: '#8A8478' }}>
          Obras originales publicadas por la comunidad de Epovox.
        </p>
      </div>

      {authors.length === 0 ? (
        <div className="py-24 text-center rounded-2xl" style={{ background: '#1A1816', border: '1px solid #2A2720' }}>
          <p className="text-4xl mb-4">✍️</p>
          <p className="text-lg font-semibold mb-2" style={{ fontFamily: 'Georgia, serif', color: '#F2EDE4' }}>
            Aún no hay obras publicadas
          </p>
          <p className="text-sm mb-6" style={{ color: '#8A8478' }}>
            Sé el primero en compartir tu escritura con la comunidad.
          </p>
          <Link href="/perfil/obras/nueva"
            className="inline-block px-6 py-3 rounded-full text-sm font-semibold transition-opacity hover:opacity-80"
            style={{ background: '#C9933A', color: '#fff' }}>
            Publicar una obra
          </Link>
        </div>
      ) : (
        <>
          {/* ── Autores ────────────────────────────────────────────────── */}
          <section className="mb-14">
            <h2 className="text-xs font-semibold uppercase tracking-widest mb-5" style={{ color: '#C9933A' }}>
              Autores · {authors.length}
            </h2>
            <div className="flex flex-wrap gap-4">
              {authors.map(a => (
                <Link key={a.userId} href={`/independientes/${a.userId}`}
                  className="flex items-center gap-3 px-4 py-3 rounded-2xl transition-colors hover:bg-white/[0.04]"
                  style={{ background: '#1A1816', border: '1px solid #2A2720' }}>
                  <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0"
                    style={{ border: '2px solid #2A2720' }}>
                    {a.avatar
                      ? <img src={a.avatar} alt={a.name} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-base font-bold"
                          style={{ background: '#2A2720', color: '#C9933A', fontFamily: 'Georgia, serif' }}>
                          {a.name.charAt(0)}
                        </div>
                    }
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: '#F2EDE4' }}>{a.name}</p>
                    <p className="text-xs" style={{ color: '#6A6460' }}>
                      {a.count} {a.count === 1 ? 'obra' : 'obras'}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* ── Obras ──────────────────────────────────────────────────── */}
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-widest mb-5" style={{ color: '#C9933A' }}>
              Obras recientes · {list.length}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
              {list.map(work => (
                <UserWorkCard key={work.id} work={work as any} />
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
