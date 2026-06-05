import type { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import UserWorkCard from '@/components/UserWorkCard';

export async function generateMetadata({ params }: { params: Promise<{ userId: string }> }): Promise<Metadata> {
  const { userId } = await params;
  const supabase = await createClient();
  const { data: profile } = await supabase.from('profiles').select('display_name, bio').eq('id', userId).single();
  const name = profile?.display_name ?? 'Autor independiente';
  return {
    title: `${name} — Epovox`,
    description: profile?.bio ?? `Obras publicadas por ${name} en Epovox.`,
  };
}

export default async function AutorIndependientePage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, avatar_url, nationality, bio, profile_public')
    .eq('id', userId)
    .single();

  if (!profile) notFound();

  // Perfil privado — no mostrar contenido
  if (profile.profile_public === false) {
    return (
      <div className="max-w-md mx-auto px-6 py-32 text-center">
        <p className="text-4xl mb-5">🔒</p>
        <h1 className="text-2xl font-bold mb-3" style={{ fontFamily: 'Georgia, serif', color: '#F2EDE4' }}>
          Perfil privado
        </h1>
        <p className="text-sm mb-8" style={{ color: '#8A8478' }}>
          Este autor eligió mantener su perfil privado por el momento.
        </p>
        <Link href="/independientes"
          className="text-xs uppercase tracking-widest hover:opacity-70 transition-opacity"
          style={{ color: '#C9933A' }}>
          ← Ver otros autores
        </Link>
      </div>
    );
  }

  // Todas las obras publicadas (públicas y privadas/de pago)
  const { data: works } = await supabase
    .from('user_works')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'published')
    .order('created_at', { ascending: false });

  if (!works || works.length === 0) notFound();

  const name   = profile.display_name ?? 'Autor';
  const avatar = profile.avatar_url;
  const publicWorks  = works.filter(w => w.is_public);
  const privateWorks = works.filter(w => !w.is_public);

  return (
    <div>
      {/* Hero */}
      <div className="px-6 pt-16 pb-12"
        style={{ background: 'linear-gradient(180deg, #2A1A0899 0%, #0D0C0B 100%)' }}>
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center sm:items-end gap-8">
          {/* Avatar */}
          <div className="w-36 h-36 rounded-full overflow-hidden flex-shrink-0 shadow-2xl"
            style={{ border: '4px solid rgba(201,147,58,0.35)' }}>
            {avatar
              ? <img src={avatar} alt={name} className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center text-6xl font-bold"
                  style={{ background: '#1A1816', color: '#C9933A', fontFamily: 'Georgia, serif' }}>
                  {name.charAt(0)}
                </div>
            }
          </div>

          <div className="flex-1 text-center sm:text-left pb-2">
            <p className="text-xs uppercase tracking-widest mb-2" style={{ color: '#C9933A' }}>
              Autor independiente{profile.nationality ? ` · ${profile.nationality}` : ''}
            </p>
            <h1 className="text-4xl md:text-5xl font-bold mb-3"
              style={{ fontFamily: 'Georgia, serif', color: '#F2EDE4' }}>
              {name}
            </h1>
            {profile.bio && (
              <p className="text-base italic mb-5 max-w-lg"
                style={{ color: '#8A8478', fontFamily: 'Georgia, serif' }}>
                "{profile.bio}"
              </p>
            )}
            <div className="flex gap-6 justify-center sm:justify-start">
              <span className="text-center">
                <p className="text-xl font-bold" style={{ fontFamily: 'Georgia, serif', color: '#F2EDE4' }}>
                  {publicWorks.length}
                </p>
                <p className="text-xs" style={{ color: '#6A6460' }}>gratuitas</p>
              </span>
              {privateWorks.length > 0 && (
                <span className="text-center">
                  <p className="text-xl font-bold" style={{ fontFamily: 'Georgia, serif', color: '#C9933A' }}>
                    {privateWorks.length}
                  </p>
                  <p className="text-xs" style={{ color: '#6A6460' }}>de pago</p>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Obras */}
      <div className="max-w-4xl mx-auto px-6 py-10">
        <Link href="/independientes"
          className="text-xs uppercase tracking-widest hover:opacity-70 transition-opacity inline-block mb-8"
          style={{ color: '#C9933A' }}>
          ← Autores independientes
        </Link>

        {/* Obras gratuitas */}
        {publicWorks.length > 0 && (
          <div className="mb-10">
            <h2 className="text-xs font-semibold uppercase tracking-widest mb-5" style={{ color: '#C9933A' }}>
              Obras gratuitas · {publicWorks.length}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
              {publicWorks.map(work => (
                <UserWorkCard
                  key={work.id}
                  work={{ ...work, profiles: profile, user_id: userId } as any}
                />
              ))}
            </div>
          </div>
        )}

        {/* Obras de pago */}
        {privateWorks.length > 0 && (
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-widest mb-5" style={{ color: '#C9933A' }}>
              Obras de pago · {privateWorks.length}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
              {privateWorks.map(work => (
                <UserWorkCard
                  key={work.id}
                  work={{ ...work, is_public: false, profiles: profile, user_id: userId } as any}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
