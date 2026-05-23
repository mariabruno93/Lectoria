'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function PerfilClient({ user, profile }: { user: any; profile: any }) {
  const router = useRouter();
  const supabase = createClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(profile?.display_name ?? '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? '');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  async function handleAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    e.target.value = '';
    const form = new FormData();
    form.append('file', file);
    form.append('bucket', 'covers');
    form.append('path', `avatars/${user.id}.${file.name.split('.').pop()}`);
    const res = await fetch('/api/admin/upload', { method: 'POST', body: form });
    const data = await res.json();
    if (data.url) {
      setAvatarUrl(data.url);
      await supabase.from('profiles').update({ avatar_url: data.url }).eq('id', user.id);
      setMsg('Foto actualizada');
      router.refresh();
    } else {
      setMsg('Error al subir foto: ' + (data.error ?? 'sin respuesta'));
    }
    setUploading(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ display_name: name, avatar_url: avatarUrl })
      .eq('id', user.id);
    setMsg(error ? 'Error: ' + error.message : '¡Perfil actualizado!');
    setSaving(false);
    if (!error) router.refresh();
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }

  const INPUT = "w-full px-4 py-3 rounded-xl text-sm outline-none";
  const INPUT_STYLE = { background: '#1A1816', border: '1px solid #2A2720', color: '#F2EDE4' };

  return (
    <div className="max-w-lg mx-auto px-6 py-14">
      <h1 className="text-3xl font-bold mb-10"
        style={{ fontFamily: 'Georgia, serif', color: '#F2EDE4' }}>
        Mi perfil
      </h1>

      <form onSubmit={handleSave} className="flex flex-col gap-6">
        {/* Avatar */}
        <div className="flex items-center gap-5">
          <div className="relative w-20 h-20 flex-shrink-0">
            <div className="w-20 h-20 rounded-full overflow-hidden flex items-center justify-center text-2xl font-bold"
              style={{ background: '#C9933A33', color: '#C9933A', fontFamily: 'Georgia, serif' }}>
              {avatarUrl
                ? <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                : (name || user.email).charAt(0).toUpperCase()}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <button type="button" onClick={() => fileRef.current?.click()}
              className="px-4 py-2 rounded-full text-sm transition-opacity hover:opacity-80"
              style={{ background: '#2A2720', color: '#F2EDE4' }}>
              {uploading ? 'Subiendo...' : 'Cambiar foto'}
            </button>
            <p className="text-xs" style={{ color: '#8A8478' }}>{user.email}</p>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatar} />
          </div>
        </div>

        {/* Nombre */}
        <div>
          <label className="block text-xs mb-1.5" style={{ color: '#8A8478' }}>Nombre</label>
          <input value={name} onChange={e => setName(e.target.value)}
            placeholder="Tu nombre" className={INPUT} style={INPUT_STYLE} />
        </div>

        {msg && (
          <p className="text-xs py-2 px-3 rounded-lg"
            style={{ background: msg.includes('Error') ? '#2D0A0A' : '#0A2D0A', color: msg.includes('Error') ? '#ef4444' : '#22c55e' }}>
            {msg}
          </p>
        )}

        <button type="submit" disabled={saving}
          className="py-3 rounded-full font-semibold transition-opacity hover:opacity-80"
          style={{ background: '#C9933A', color: '#fff' }}>
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </form>

      <div className="mt-10 pt-8" style={{ borderTop: '1px solid #2A2720' }}>
        <button onClick={handleLogout}
          className="w-full py-3 rounded-full text-sm font-medium transition-opacity hover:opacity-80"
          style={{ background: '#1A1816', border: '1px solid #2A2720', color: '#8A8478' }}>
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}
