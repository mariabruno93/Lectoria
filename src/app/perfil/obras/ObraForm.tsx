'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

type WorkData = {
  id?: string;
  title: string;
  description: string;
  content: string;
  language: string;
  is_public: boolean;
  status: 'draft' | 'published' | 'archived';
};

const INPUT  = 'w-full px-4 py-3 rounded-xl text-sm outline-none';
const STYLE  = { background: '#1A1816', border: '1px solid #2A2720', color: '#F2EDE4' };

export default function ObraForm({ userId, initial }: { userId: string; initial?: WorkData }) {
  const router = useRouter();
  const supabase = createClient();
  const isNew = !initial?.id;

  const [form, setForm] = useState<WorkData>(initial ?? {
    title: '', description: '', content: '', language: 'es', is_public: false, status: 'draft',
  });
  const [loading, setLoading]   = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [msg, setMsg]           = useState('');

  const set = (k: keyof WorkData, v: any) => setForm(f => ({ ...f, [k]: v }));

  async function handleSave(e: React.FormEvent, publishNow?: boolean) {
    e.preventDefault();
    if (!form.title.trim()) { setMsg('El título es obligatorio.'); return; }
    setLoading(true); setMsg('');

    const payload = {
      title:       form.title.trim(),
      description: form.description.trim() || null,
      content:     form.content.trim() || null,
      language:    form.language,
      is_public:   form.is_public,
      status:      publishNow ? 'published' : form.status,
      updated_at:  new Date().toISOString(),
    };

    const { error } = isNew
      ? await supabase.from('user_works').insert({ ...payload, user_id: userId, status: publishNow ? 'published' : 'draft' })
      : await supabase.from('user_works').update(payload).eq('id', initial!.id);

    if (error) { setMsg('Error: ' + error.message); setLoading(false); return; }
    router.push('/perfil/obras');
    router.refresh();
  }

  async function handleDelete() {
    if (!confirm('¿Eliminar esta obra? Esta acción no se puede deshacer.')) return;
    setDeleting(true);
    await supabase.from('user_works').delete().eq('id', initial!.id);
    router.push('/perfil/obras');
    router.refresh();
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="mb-8">
        <button onClick={() => router.push('/perfil/obras')}
          className="text-xs uppercase tracking-widest hover:opacity-70 transition-opacity"
          style={{ color: '#C9933A' }}>
          ← Mis obras
        </button>
        <h1 className="mt-3 text-3xl font-bold" style={{ fontFamily: 'Georgia, serif', color: '#F2EDE4' }}>
          {isNew ? 'Nueva obra' : 'Editar obra'}
        </h1>
      </div>

      <form onSubmit={handleSave} className="flex flex-col gap-5">
        {/* Título */}
        <div>
          <label className="block text-xs mb-1.5" style={{ color: '#8A8478' }}>Título *</label>
          <input required value={form.title} onChange={e => set('title', e.target.value)}
            placeholder="El nombre de tu obra" className={INPUT} style={STYLE} />
        </div>

        {/* Descripción */}
        <div>
          <label className="block text-xs mb-1.5" style={{ color: '#8A8478' }}>Descripción breve</label>
          <input value={form.description} onChange={e => set('description', e.target.value)}
            placeholder="Una línea sobre de qué trata" className={INPUT} style={STYLE} />
        </div>

        {/* Idioma */}
        <div>
          <label className="block text-xs mb-1.5" style={{ color: '#8A8478' }}>Idioma</label>
          <div className="flex gap-2">
            {['es', 'en'].map(lang => (
              <button key={lang} type="button" onClick={() => set('language', lang)}
                className="px-5 py-2 rounded-full text-sm font-medium transition-all"
                style={{
                  background: form.language === lang ? '#C9933A' : '#1A1816',
                  color: form.language === lang ? '#fff' : '#8A8478',
                  border: '1px solid',
                  borderColor: form.language === lang ? '#C9933A' : '#2A2720',
                }}>
                {lang === 'es' ? '🇦🇷 Español' : '🇺🇸 Inglés'}
              </button>
            ))}
          </div>
        </div>

        {/* Texto */}
        <div>
          <label className="block text-xs mb-1.5" style={{ color: '#8A8478' }}>
            Texto de la obra
          </label>
          <textarea
            value={form.content}
            onChange={e => set('content', e.target.value)}
            rows={18}
            placeholder="Escribí o pegá el texto de tu obra acá..."
            className={INPUT + ' resize-y leading-7'}
            style={{ ...STYLE, fontFamily: 'Georgia, serif', fontSize: '0.95rem', lineHeight: 1.8 }}
          />
          {form.content && (
            <p className="text-xs mt-1 text-right" style={{ color: '#6A6460' }}>
              {form.content.trim().split(/\s+/).filter(Boolean).length} palabras
            </p>
          )}
        </div>

        {/* Visibilidad */}
        <div className="rounded-2xl p-4" style={{ background: '#111', border: '1px solid #2A2720' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: '#F2EDE4' }}>
                {form.is_public ? '🌐 Pública' : '🔒 Privada'}
              </p>
              <p className="text-xs mt-0.5" style={{ color: '#6A6460' }}>
                {form.is_public
                  ? 'Visible para todos los usuarios de Epovox.'
                  : 'Solo vos podés verla. Ideal para borradores.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => set('is_public', !form.is_public)}
              className="relative w-12 h-6 rounded-full transition-colors flex-shrink-0"
              style={{ background: form.is_public ? '#C9933A' : '#2A2720' }}
            >
              <span
                className="absolute top-0.5 w-5 h-5 rounded-full transition-all"
                style={{
                  background: '#fff',
                  left: form.is_public ? '26px' : '2px',
                }}
              />
            </button>
          </div>
        </div>

        {/* Error */}
        {msg && (
          <p className="text-sm py-2 px-4 rounded-lg"
            style={{ background: '#2D0A0A', color: '#ef4444' }}>
            {msg}
          </p>
        )}

        {/* Botones */}
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading}
            className="flex-1 py-3 rounded-full font-semibold transition-opacity hover:opacity-80"
            style={{ background: '#2A2720', color: '#F2EDE4' }}>
            {loading ? 'Guardando...' : 'Guardar borrador'}
          </button>
          <button type="button" disabled={loading}
            onClick={e => handleSave(e as any, true)}
            className="flex-1 py-3 rounded-full font-semibold transition-opacity hover:opacity-80"
            style={{ background: '#C9933A', color: '#fff' }}>
            {loading ? '...' : 'Publicar'}
          </button>
        </div>

        {/* Eliminar (solo en edición) */}
        {!isNew && (
          <div className="pt-4 mt-2" style={{ borderTop: '1px solid #2A2720' }}>
            <button type="button" onClick={handleDelete} disabled={deleting}
              className="text-xs transition-opacity hover:opacity-70"
              style={{ color: '#ef444466' }}>
              {deleting ? 'Eliminando...' : 'Eliminar obra permanentemente'}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
