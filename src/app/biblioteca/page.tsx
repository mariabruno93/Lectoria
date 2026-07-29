import { Metadata } from 'next';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import BibliotecaClient from './BibliotecaClient';
import UserWorkCard from '@/components/UserWorkCard';

export const metadata: Metadata = {
  title: 'Biblioteca — Epovox',
  description: 'Audiolibros clásicos y obras de autores independientes en Epovox.',
};

export const dynamic = 'force-dynamic';

export default async function BibliotecaPage() {
  const supabase = await createClient();
  const { data: works } = await supabase
    .from('works')
    .select('*, authors(name, slug)')
    .order('language', { ascending: true })
    .order('title', { ascending: true });

  const allWorks = works ?? [];

  // ── Obras de autores independientes (lectura pública por admin) ─────────
  const admin = createAdminClient();
  const { data: uWorks } = await admin
    .from('user_works')
    .select('id, title, description, language, is_public, cover_url, price_ars, created_at, user_id')
    .eq('status', 'published')
    .order('created_at', { ascending: false });
  const uIds = [...new Set((uWorks ?? []).map(w => w.user_id))];
  const { data: profs } = uIds.length
    ? await admin.from('profiles').select('id, display_name, avatar_url, profile_public').in('id', uIds)
    : { data: [] };
  const profById = new Map((profs ?? []).map(p => [p.id, p]));
  const indieWorks = (uWorks ?? [])
    .map(w => ({ ...w, profiles: profById.get(w.user_id) ?? null }))
    .filter(w => (w.profiles as any)?.profile_public !== false);

  return (
    <div className="max-w-6xl mx-auto px-6 py-14">
      <div className="mb-10">
        <h1 className="text-4xl font-bold mb-3" style={{ fontFamily: 'Georgia, serif', color: '#F2EDE4' }}>
          Biblioteca
        </h1>
        <p style={{ color: '#8A8478' }}>
          {allWorks.length} clásicos gratis{indieWorks.length > 0 ? ` · ${indieWorks.length} de autores independientes` : ''}
        </p>
      </div>

      {/* Obras de autores independientes (destacadas, arriba) */}
      {indieWorks.length > 0 && (
        <section className="mb-14">
          <h2 className="text-xs font-semibold uppercase tracking-widest mb-5" style={{ color: '#C9933A' }}>
            Obras de autores independientes · {indieWorks.length}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
            {indieWorks.map(work => (
              <UserWorkCard key={work.id} work={work as any} />
            ))}
          </div>
        </section>
      )}

      {/* Clásicos */}
      <h2 className="text-xs font-semibold uppercase tracking-widest mb-5" style={{ color: '#C9933A' }}>
        Clásicos
      </h2>
      <BibliotecaClient allBooks={allWorks} />
    </div>
  );
}
