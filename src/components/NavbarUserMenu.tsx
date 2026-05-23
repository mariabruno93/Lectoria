'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface Props {
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  isAdmin?: boolean;
}

export default function NavbarUserMenu({ email, displayName, avatarUrl, isAdmin = false }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  async function handleLogout() {
    setOpen(false);
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }

  const initial = (displayName || email).charAt(0).toUpperCase();

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 rounded-full px-2 py-1 transition-opacity hover:opacity-80"
        style={{ background: '#1A1816' }}>
        <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center text-sm font-bold flex-shrink-0"
          style={{ background: '#C9933A33', color: '#C9933A', fontFamily: 'Georgia, serif' }}>
          {avatarUrl
            ? <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
            : initial}
        </div>
        <span className="text-sm hidden sm:block" style={{ color: '#F2EDE4' }}>
          {displayName || email.split('@')[0]}
        </span>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ color: '#8A8478' }}>
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-48 rounded-xl py-1 z-50 shadow-xl"
          style={{ background: '#1A1816', border: '1px solid #2A2720' }}>
          <div className="px-4 py-2 border-b" style={{ borderColor: '#2A2720' }}>
            <p className="text-xs font-medium truncate" style={{ color: '#F2EDE4' }}>
              {displayName || email.split('@')[0]}
            </p>
            <p className="text-xs truncate" style={{ color: '#8A8478' }}>{email}</p>
          </div>
          {isAdmin && (
            <Link href="/admin" onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-4 py-2 text-sm transition-colors hover:opacity-80"
              style={{ color: '#C9933A', fontWeight: 600 }}>
              ◈ Panel admin
            </Link>
          )}
          <Link href="/perfil" onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-4 py-2 text-sm transition-colors hover:opacity-80"
            style={{ color: '#F2EDE4' }}>
            Mi perfil
          </Link>
          <button onClick={handleLogout}
            className="flex items-center gap-2 w-full px-4 py-2 text-sm transition-colors hover:opacity-80 text-left"
            style={{ color: '#8A8478' }}>
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}
