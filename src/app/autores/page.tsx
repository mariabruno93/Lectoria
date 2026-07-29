import type { Metadata } from 'next';
import Link from 'next/link';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Autores — Epovox',
  description: 'Autores clásicos e independientes disponibles en Epovox.',
};

export const dynamic = 'force-dynamic';

export default async function AutoresPage() {
  const supabase = await createClient();

  const { data: authors } = await supabase
    .from('authors')
    .select('id, slug, name, nationality, born_year, died_year, photo_url')
    .order('name', { ascending: true });

  // Contar obras por autor
  const { data: works } = await supabase
    .from('works')
    .select('author_id');

  const workCount: Record<string, number> = {};
  works?.forEach(w => {
    workCount[w.author_id] = (workCount[w.author_id] ?? 0) + 1;
  });

  const list = (authors ?? []).filter(a => (workCount[a.id] ?? 0) > 0);

  // ── Autores independientes (comunidad) — lectura pública por admin ──────
  const admin = createAdminClient();
  const { data: uWorks } = await admin
    .from('user_works').select('user_id').eq('status', 'published');
  const uCount: Record<string, number> = {};
  (uWorks ?? []).forEach(w => { uCount[w.user_id] = (uCount[w.user_id] ?? 0) + 1; });
  const uIds = Object.keys(uCount);
  const { data: profs } = uIds.length
    ? await admin.from('profiles').select('id, display_name, avatar_url, profile_public').in('id', uIds)
    : { data: [] };
  const indieAuthors = (profs ?? [])
    .filter(p => (p as any).profile_public !== false)
    .map(p => ({ userId: p.id as string, name: (p.display_name as string) ?? 'Autor', avatar: (p.avatar_url as string | null) ?? null, count: uCount[p.id] ?? 0 }));

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="mb-10">
        <p className="text-xs uppercase tracking-widest mb-2" style={{ color: '#C9933A' }}>
          Catálogo
        </p>
        <h1 className="text-3xl font-bold" style={{ fontFamily: 'Georgia, serif', color: '#F2EDE4' }}>
          Autores
        </h1>
        <p className="mt-2 text-sm" style={{ color: '#8A8478' }}>
          {list.length + indieAuthors.length} autores disponibles
        </p>
      </div>

      {/* Independientes (destacados, arriba) */}
      {indieAuthors.length > 0 && (
        <>
          <h2 className="text-xs font-semibold uppercase tracking-widest mb-5" style={{ color: '#C9933A' }}>
            Independientes · {indieAuthors.length}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
            {indieAuthors.map(a => (
              <Link key={a.userId} href={`/independientes/${a.userId}`}
                className="group flex flex-col items-center text-center gap-3 p-4 rounded-2xl transition-colors hover:bg-white/[0.04]">
                <div className="w-24 h-24 rounded-full overflow-hidden flex-shrink-0 transition-transform group-hover:scale-105"
                  style={{ border: '2px solid #2A2720' }}>
                  {a.avatar
                    ? <img src={a.avatar} alt={a.name} className="w-full h-full object-cover" loading="lazy" />
                    : <div className="w-full h-full flex items-center justify-center text-2xl font-bold"
                        style={{ background: '#1A1816', color: '#C9933A', fontFamily: 'Georgia, serif' }}>
                        {a.name.charAt(0)}
                      </div>}
                </div>
                <div>
                  <p className="text-sm font-medium leading-tight group-hover:text-amber-400 transition-colors" style={{ color: '#F2EDE4' }}>{a.name}</p>
                  <p className="text-xs mt-1" style={{ color: '#C9933A' }}>{a.count} {a.count === 1 ? 'obra' : 'obras'}</p>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}

      {/* Clásicos */}
      <h2 className="text-xs font-semibold uppercase tracking-widest mt-14 mb-5" style={{ color: '#C9933A' }}>
        Clásicos · {list.length}
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
        {list.map(author => (
          <Link
            key={author.id}
            href={`/autor/${author.slug}`}
            className="group flex flex-col items-center text-center gap-3 p-4 rounded-2xl transition-colors hover:bg-white/[0.04]"
          >
            {/* Foto */}
            <div
              className="w-24 h-24 rounded-full overflow-hidden flex-shrink-0 transition-transform group-hover:scale-105"
              style={{ border: '2px solid #2A2720' }}
            >
              {author.photo_url ? (
                <img
                  src={author.photo_url}
                  alt={author.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center text-2xl font-bold"
                  style={{ background: '#1A1816', color: '#C9933A', fontFamily: 'Georgia, serif' }}
                >
                  {author.name.charAt(0)}
                </div>
              )}
            </div>

            {/* Info */}
            <div>
              <p className="text-sm font-medium leading-tight group-hover:text-amber-400 transition-colors"
                style={{ color: '#F2EDE4' }}>
                {author.name}
              </p>
              <p className="text-xs mt-0.5" style={{ color: '#6A6460' }}>
                {author.nationality}
                {author.born_year && ` · ${author.born_year}${author.died_year ? `–${author.died_year}` : ''}`}
              </p>
              <p className="text-xs mt-1" style={{ color: '#C9933A' }}>
                {workCount[author.id] ?? 0} {(workCount[author.id] ?? 0) === 1 ? 'obra' : 'obras'}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
