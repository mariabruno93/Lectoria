import type { Metadata } from 'next';
import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/server';
import UserWorkCard from '@/components/UserWorkCard';

export const metadata: Metadata = {
  title: 'Autores independientes — Epovox',
  description: 'Obras publicadas por autores independientes en Epovox.',
};

export const dynamic = 'force-dynamic';

// Lectura pública: se usa el cliente admin del lado del servidor (la clave nunca
// llega al navegador) para que cualquier visitante vea las obras publicadas, sin
// depender del RLS de user_works/profiles. No se trae `content` (queda protegido).
export default async function IndependientesPage() {
  const supabase = createAdminClient();

  // Todas las obras publicadas (públicas y de pago) — sin el texto de la obra
  const { data: works } = await supabase
    .from('user_works')
    .select('id, title, description, language, is_public, cover_url, price_ars, created_at, user_id')
    .eq('status', 'published')
    .order('created_at', { ascending: false });

  // Perfiles de los autores (consulta aparte: no hay relación declarada en la DB)
  const userIds = [...new Set((works ?? []).map(w => w.user_id))];
  const { data: profs } = userIds.length
    ? await supabase
        .from('profiles')
        .select('id, display_name, avatar_url, profile_public')
        .in('id', userIds)
    : { data: [] };
  const profById = new Map((profs ?? []).map(p => [p.id, p]));
  const worksWithProfile: any[] = (works ?? []).map(w => ({ ...w, profiles: profById.get(w.user_id) ?? null }));

  // Solo obras de autores con perfil público
  const allPublished = worksWithProfile.filter(w => w.profiles?.profile_public !== false);

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
          Obras originales compartidas por la comunidad de Epovox.
        </p>
      </div>

      {authors.length === 0 ? (
        <div className="py-24 text-center rounded-2xl" style={{ background: '#1A1816', border: '1px solid #2A2720' }}>
          <p className="text-4xl mb-4">✍️</p>
          <p className="text-lg font-semibold mb-2" style={{ fontFamily: 'Georgia, serif', color: '#F2EDE4' }}>
            Aún no hay obras compartidas
          </p>
          <p className="text-sm mb-6" style={{ color: '#8A8478' }}>
            Sé el primero en compartir tu escritura con la comunidad.
          </p>
          <Link href="/perfil/obras/nueva"
            className="inline-block px-6 py-3 rounded-full text-sm font-semibold transition-opacity hover:opacity-80"
            style={{ background: '#C9933A', color: '#fff' }}>
            Compartir una obra
          </Link>
        </div>
      ) : (
        <>
          {/* ── Autores ────────────────────────────────────────────────── */}
          <section className="mb-14">
            <h2 className="text-xs font-semibold uppercase tracking-widest mb-5" style={{ color: '#C9933A' }}>
              Autores · {authors.length}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
              {authors.map(a => (
                <Link key={a.userId} href={`/independientes/${a.userId}`}
                  className="group flex flex-col items-center text-center gap-3 p-4 rounded-2xl transition-colors hover:bg-white/[0.04]">
                  <div className="w-24 h-24 rounded-full overflow-hidden flex-shrink-0 transition-transform group-hover:scale-105"
                    style={{ border: '2px solid #2A2720' }}>
                    {a.avatar
                      ? <img src={a.avatar} alt={a.name} className="w-full h-full object-cover" loading="lazy" />
                      : <div className="w-full h-full flex items-center justify-center text-2xl font-bold"
                          style={{ background: '#1A1816', color: '#C9933A', fontFamily: 'Georgia, serif' }}>
                          {a.name.charAt(0)}
                        </div>
                    }
                  </div>
                  <div>
                    <p className="text-sm font-medium leading-tight group-hover:text-amber-400 transition-colors" style={{ color: '#F2EDE4' }}>{a.name}</p>
                    <p className="text-xs mt-1" style={{ color: '#C9933A' }}>
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
