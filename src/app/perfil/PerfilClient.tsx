'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function PerfilClient({
  user,
  profile,
}: {
  user: any;
  profile: any;
}) {
  const router = useRouter();
  const supabase = createClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(profile?.display_name ?? '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? '');
  const [nationality, setNationality] = useState(profile?.nationality ?? '');
  const [bio, setBio] = useState(profile?.bio ?? '');
  const [profilePublic, setProfilePublic] = useState<boolean>(profile?.profile_public ?? true);
  const [togglingPublic, setTogglingPublic] = useState(false);
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
      .update({ display_name: name, avatar_url: avatarUrl, nationality: nationality.trim() || null, bio: bio.trim() || null })
      .eq('id', user.id);
    setMsg(error ? 'Error: ' + error.message : '¡Perfil actualizado!');
    setSaving(false);
    if (!error) router.refresh();
  }

  async function handleTogglePublic() {
    setTogglingPublic(true);
    const next = !profilePublic;
    const { error } = await supabase
      .from('profiles')
      .update({ profile_public: next })
      .eq('id', user.id);
    if (!error) setProfilePublic(next);
    setTogglingPublic(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }

  const INPUT = 'w-full px-4 py-3 rounded-xl text-sm outline-none';
  const INPUT_STYLE = { background: '#1A1816', border: '1px solid #2A2720', color: '#F2EDE4' };

  return (
    <div className="max-w-2xl mx-auto px-6 py-14">
      <h1 className="text-3xl font-bold mb-10"
        style={{ fontFamily: 'Georgia, serif', color: '#F2EDE4' }}>
        Mi cuenta
      </h1>

      {/* ── Perfil ──────────────────────────────────────────────────── */}
      <form onSubmit={handleSave} className="flex flex-col gap-6">
        <div className="flex items-center gap-5">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center text-2xl font-bold"
            style={{ background: '#C9933A33', color: '#C9933A', fontFamily: 'Georgia, serif' }}>
            {avatarUrl
              ? <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
              : (name || user.email).charAt(0).toUpperCase()}
          </div>

          {/* Cambiar foto + email */}
          <div className="flex flex-col gap-2 flex-1">
            <button type="button" onClick={() => fileRef.current?.click()}
              className="px-4 py-2 rounded-full text-sm transition-opacity hover:opacity-80 w-fit"
              style={{ background: '#2A2720', color: '#F2EDE4' }}>
              {uploading ? 'Subiendo...' : 'Cambiar foto'}
            </button>
            <p className="text-xs" style={{ color: '#8A8478' }}>{user.email}</p>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatar} />
          </div>

          {/* Toggle perfil público / privado */}
          <button
            type="button"
            onClick={handleTogglePublic}
            disabled={togglingPublic}
            className="flex-shrink-0 flex flex-col items-center gap-2 px-4 py-3 rounded-2xl transition-colors hover:bg-white/[0.03]"
            style={{ border: '1px solid #2A2720', minWidth: 110 }}
          >
            <div
              className="relative w-11 h-6 rounded-full transition-all duration-200"
              style={{ background: profilePublic ? '#C9933A' : '#2A2720' }}
            >
              <span
                className="absolute top-0.5 w-5 h-5 rounded-full transition-all duration-200"
                style={{
                  background: '#fff',
                  left: profilePublic ? '22px' : '2px',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
                }}
              />
            </div>
            <span className="text-xs font-medium" style={{ color: profilePublic ? '#C9933A' : '#6A6460' }}>
              {profilePublic ? '🌐 Perfil público' : '🔒 Perfil privado'}
            </span>
          </button>
        </div>

        <div>
          <label className="block text-xs mb-1.5" style={{ color: '#8A8478' }}>Nombre</label>
          <input value={name} onChange={e => setName(e.target.value)}
            placeholder="Tu nombre" className={INPUT} style={INPUT_STYLE} />
        </div>

        <div>
          <label className="block text-xs mb-1.5" style={{ color: '#8A8478' }}>Nacionalidad</label>
          <input value={nationality} onChange={e => setNationality(e.target.value)}
            placeholder="Ej: Argentina, México, España…" className={INPUT} style={INPUT_STYLE} />
        </div>

        <div>
          <label className="flex justify-between text-xs mb-1.5" style={{ color: '#8A8478' }}>
            <span>Frase o bio</span>
            <span style={{ color: bio.length > 140 ? '#ef4444' : '#6A6460' }}>{bio.length}/160</span>
          </label>
          <textarea
            value={bio}
            onChange={e => { if (e.target.value.length <= 160) setBio(e.target.value); }}
            placeholder="Una frase que te describe como escritor/a…"
            rows={2}
            className={INPUT}
            style={{ ...INPUT_STYLE, resize: 'none', lineHeight: '1.6' }}
          />
        </div>

        {msg && (
          <p className="text-xs py-2 px-3 rounded-lg"
            style={{
              background: msg.includes('Error') ? '#2D0A0A' : '#0A2D0A',
              color: msg.includes('Error') ? '#ef4444' : '#22c55e',
            }}>
            {msg}
          </p>
        )}

        <button type="submit" disabled={saving}
          className="py-3 rounded-full font-semibold transition-opacity hover:opacity-80"
          style={{ background: '#C9933A', color: '#fff' }}>
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </form>

      {/* ── Mis listas ──────────────────────────────────────────────── */}
      <div className="mt-10 pt-8" style={{ borderTop: '1px solid #2A2720' }}>
        <Link href="/perfil/listas"
          className="flex items-center justify-between w-full py-4 px-5 rounded-2xl transition-colors hover:bg-white/[0.03]"
          style={{ background: '#1A1816', border: '1px solid #2A2720' }}>
          <div className="flex items-center gap-3">
            <span style={{ fontSize: 20 }}>📚</span>
            <div>
              <p className="text-sm font-medium" style={{ color: '#F2EDE4' }}>Mis listas</p>
              <p className="text-xs" style={{ color: '#8A8478' }}>En reproducción, seguidos y terminados</p>
            </div>
          </div>
          <span style={{ color: '#C9933A' }}>→</span>
        </Link>
      </div>

      {/* ── Mis obras ───────────────────────────────────────────────── */}
      <div className="mt-10 pt-8" style={{ borderTop: '1px solid #2A2720' }}>
        <Link href="/perfil/obras"
          className="flex items-center justify-between w-full py-4 px-5 rounded-2xl transition-colors hover:bg-white/[0.03]"
          style={{ background: '#1A1816', border: '1px solid #2A2720' }}>
          <div className="flex items-center gap-3">
            <span style={{ fontSize: 20 }}>✍️</span>
            <div>
              <p className="text-sm font-medium" style={{ color: '#F2EDE4' }}>Mis obras</p>
              <p className="text-xs" style={{ color: '#8A8478' }}>Compartí y gestioná tus propias obras</p>
            </div>
          </div>
          <span style={{ color: '#C9933A' }}>→</span>
        </Link>
      </div>

      {/* ── Logout ──────────────────────────────────────────────────── */}
      <div className="mt-4 pt-4" style={{ borderTop: '1px solid #2A2720' }}>
        <button onClick={handleLogout}
          className="w-full py-3 rounded-full text-sm font-medium transition-opacity hover:opacity-80"
          style={{ background: '#1A1816', border: '1px solid #2A2720', color: '#8A8478' }}>
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}
