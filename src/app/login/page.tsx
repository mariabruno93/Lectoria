'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get('redirect') ?? '/';
  const supabase = createClient();

  const [tab, setTab] = useState<'login' | 'registro'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const INPUT = "w-full px-4 py-3 rounded-xl text-sm outline-none";
  const INPUT_STYLE = { background: '#1A1816', border: '1px solid #2A2720', color: '#F2EDE4' };

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setMsg('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setMsg(error.message); setLoading(false); return; }
    router.push(redirect);
    router.refresh();
  }

  async function handleRegistro(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setMsg('');
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { display_name: name } },
    });
    if (error) { setMsg(error.message); setLoading(false); return; }
    setMsg('¡Cuenta creada! Revisá tu email para confirmar.');
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: '#0D0C0B' }}>
      <div className="w-full max-w-sm">
        <Link href="/" className="flex items-center justify-center gap-3 mb-8">
          <img src="/logo-transparent.png" alt="Epovox" width={40} height={40} style={{ objectFit: 'contain' }} />
          <span className="text-2xl font-bold" style={{ fontFamily: 'Georgia, serif', color: '#F2EDE4' }}>
            Epovox
          </span>
        </Link>

        {/* Tabs */}
        <div className="flex rounded-xl p-1 mb-6" style={{ background: '#1A1816' }}>
          {(['login', 'registro'] as const).map((t) => (
            <button key={t} onClick={() => { setTab(t); setMsg(''); }}
              className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
              style={tab === t
                ? { background: '#C9933A', color: '#fff' }
                : { color: '#8A8478' }}>
              {t === 'login' ? 'Iniciar sesión' : 'Registrarse'}
            </button>
          ))}
        </div>

        <form onSubmit={tab === 'login' ? handleLogin : handleRegistro}
          className="flex flex-col gap-4">
          {tab === 'registro' && (
            <div>
              <label className="block text-xs mb-1.5" style={{ color: '#8A8478' }}>Nombre</label>
              <input required value={name} onChange={e => setName(e.target.value)}
                placeholder="Tu nombre" className={INPUT} style={INPUT_STYLE} />
            </div>
          )}
          <div>
            <label className="block text-xs mb-1.5" style={{ color: '#8A8478' }}>Email</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
              placeholder="tu@email.com" className={INPUT} style={INPUT_STYLE} />
          </div>
          <div>
            <label className="block text-xs mb-1.5" style={{ color: '#8A8478' }}>Contraseña</label>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••" className={INPUT} style={INPUT_STYLE} />
          </div>

          {msg && (
            <p className="text-xs py-2 px-3 rounded-lg"
              style={{ background: msg.includes('creada') ? '#0A2D0A' : '#2D0A0A', color: msg.includes('creada') ? '#22c55e' : '#ef4444' }}>
              {msg}
            </p>
          )}

          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-full font-semibold transition-opacity hover:opacity-80 mt-1"
            style={{ background: '#C9933A', color: '#fff' }}>
            {loading ? '...' : tab === 'login' ? 'Entrar' : 'Crear cuenta'}
          </button>
        </form>

        <p className="text-center text-xs mt-6" style={{ color: '#8A8478' }}>
          Al registrarte aceptás escuchar libros increíbles 📚
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
