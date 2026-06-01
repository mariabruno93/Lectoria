'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: '◈' },
  { href: '/admin/autores', label: 'Autores', icon: '👤' },
  { href: '/admin/obras', label: 'Obras', icon: '📚' },
  { href: '/admin/usuarios', label: 'Usuarios', icon: '👥' },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/admin/login');
    router.refresh();
  }

  return (
    <aside className="w-56 flex flex-col py-6 px-4 border-r flex-shrink-0" style={{ background: '#111009', borderColor: '#2A2720' }}>
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 mb-8 px-2">
        <img src="/logo.png" alt="Epovox" width={24} height={24} style={{ objectFit: 'contain' }} />
        <span className="font-semibold text-sm" style={{ color: '#F2EDE4', fontFamily: 'Georgia, serif' }}>Epovox</span>
      </Link>

      <p className="text-xs uppercase tracking-widest px-2 mb-3" style={{ color: '#8A8478' }}>Admin</p>

      <nav className="flex flex-col gap-1 flex-1">
        {NAV.map(({ href, label, icon }) => {
          const active = pathname === href || (href !== '/admin' && pathname.startsWith(href));
          return (
            <Link
              key={href} href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors"
              style={active
                ? { background: '#2A2010', color: '#C9933A', fontWeight: 600 }
                : { color: '#8A8478' }
              }
            >
              <span>{icon}</span>
              {label}
            </Link>
          );
        })}
      </nav>

      <button
        onClick={handleLogout}
        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors mt-4"
        style={{ color: '#8A8478' }}
      >
        <span>↩</span> Cerrar sesión
      </button>
    </aside>
  );
}
