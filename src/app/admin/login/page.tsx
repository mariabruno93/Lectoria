'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError('Email o contraseña incorrectos');
      setLoading(false);
    } else {
      router.push('/admin');
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#0D0C0B' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-6">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <polygon points="6,3 20,12 6,21" fill="#C9933A" />
            </svg>
            <span className="text-xl font-semibold" style={{ color: '#F2EDE4', fontFamily: 'Georgia, serif' }}>Lectoria</span>
          </div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: '#F2EDE4' }}>Panel de administración</h1>
          <p className="text-sm" style={{ color: '#8A8478' }}>Ingresá con tu cuenta de administrador</p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <input
            type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="Email" required
            className="w-full px-4 py-3 rounded-xl text-sm outline-none"
            style={{ background: '#1A1816', border: '1px solid #2A2720', color: '#F2EDE4' }}
          />
          <input
            type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder="Contraseña" required
            className="w-full px-4 py-3 rounded-xl text-sm outline-none"
            style={{ background: '#1A1816', border: '1px solid #2A2720', color: '#F2EDE4' }}
          />
          {error && <p className="text-sm text-center" style={{ color: '#ef4444' }}>{error}</p>}
          <button
            type="submit" disabled={loading}
            className="w-full py-3 rounded-full font-semibold transition-opacity hover:opacity-80 disabled:opacity-50"
            style={{ background: '#C9933A', color: '#fff' }}
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  );
}
