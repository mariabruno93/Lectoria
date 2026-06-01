import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import NavbarUserMenu from './NavbarUserMenu';

export default async function Navbar() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let profile: { display_name: string | null; avatar_url: string | null; is_admin: boolean } | null = null;
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('display_name, avatar_url, is_admin')
      .eq('id', user.id)
      .single();
    profile = data;
  }

  return (
    <nav className="sticky top-0 z-40 border-b" style={{ background: 'rgba(13,12,11,0.92)', borderColor: '#2A2720', backdropFilter: 'blur(8px)' }}>
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <img src="/logo.png" alt="Epovox" width={32} height={32} style={{ objectFit: 'contain' }} />
          <span className="text-xl font-semibold" style={{ color: '#F2EDE4', fontFamily: 'Georgia, serif', letterSpacing: '-0.01em' }}>
            Epovox
          </span>
        </Link>

        <div className="flex items-center gap-6">
          <Link href="/" className="nav-link text-sm">Inicio</Link>
          <Link href="/biblioteca" className="nav-link text-sm">Biblioteca</Link>

          {user ? (
            <NavbarUserMenu
              email={user.email!}
              displayName={profile?.display_name ?? null}
              avatarUrl={profile?.avatar_url ?? null}
              isAdmin={profile?.is_admin ?? false}
            />
          ) : (
            <Link href="/login"
              className="px-4 py-2 rounded-full text-sm font-medium transition-opacity hover:opacity-80"
              style={{ background: '#C9933A', color: '#fff' }}>
              Ingresar
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
