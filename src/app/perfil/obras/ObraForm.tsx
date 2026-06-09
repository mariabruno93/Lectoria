'use client';

import { useState, useRef } from 'react';
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
  audio_url?: string | null;
  cover_url?: string | null;
  price_ars?: number | null;
};

const INPUT  = 'w-full px-4 py-3 rounded-xl text-sm outline-none';
const STYLE  = { background: '#1A1816', border: '1px solid #2A2720', color: '#F2EDE4' };

export default function ObraForm({ userId, initial }: { userId: string; initial?: WorkData }) {
  const router = useRouter();
  const supabase = createClient();
  const isNew = !initial?.id;

  const [form, setForm] = useState<WorkData>(initial ?? {
    title: '', description: '', content: '', language: 'es', is_public: false, status: 'draft', audio_url: null, cover_url: null, price_ars: null,
  });
  const [loading, setLoading]     = useState(false);
  const [deleting, setDeleting]   = useState(false);
  const [msg, setMsg]             = useState('');
  const [audioTab, setAudioTab]   = useState<'upload' | 'generate'>('generate');
  const [voice, setVoice]         = useState('es-elena');
  const [generating, setGenerating] = useState(false);
  const [uploading, setUploading]   = useState(false);
  const audioFileRef = useRef<HTMLInputElement>(null);
  const [coverTab, setCoverTab]       = useState<'upload' | 'generate'>('generate');
  const [generatingCover, setGeneratingCover] = useState(false);
  const [uploadingCover, setUploadingCover]   = useState(false);
  const coverFileRef = useRef<HTMLInputElement>(null);

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
      // El precio solo aplica a obras de pago; si es gratis se limpia.
      price_ars:   form.is_public ? null : (form.price_ars ?? null),
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

  async function handleGenerateAudio() {
    if (!form.id) { setMsg('Guardá la obra primero antes de generar audio.'); return; }
    if (!form.content?.trim()) { setMsg('Escribí el texto antes de generar audio.'); return; }
    setGenerating(true); setMsg('');
    const res = await fetch('/api/user/generate-audio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workId: form.id, voice }),
    });
    const data = await res.json();
    if (data.url) {
      set('audio_url', data.url);
      setMsg('Audio generado correctamente ✓');
    } else {
      setMsg('Error: ' + (data.error ?? 'No se pudo generar el audio'));
    }
    setGenerating(false);
  }

  async function handleUploadAudio(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !form.id) return;
    setUploading(true); setMsg('');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('bucket', 'audio');
    formData.append('path', `user-works/${form.id}.mp3`);
    const res = await fetch('/api/admin/upload', { method: 'POST', body: formData });
    const data = await res.json();
    if (data.url) {
      set('audio_url', data.url);
      await supabase.from('user_works').update({ audio_url: data.url }).eq('id', form.id);
      setMsg('Audio subido correctamente ✓');
    } else {
      setMsg('Error al subir: ' + (data.error ?? 'sin respuesta'));
    }
    setUploading(false);
    e.target.value = '';
  }

  async function handleGenerateCover() {
    if (!form.id) { setMsg('Guardá la obra primero antes de generar la portada.'); return; }
    setGeneratingCover(true); setMsg('');
    const res = await fetch('/api/user/generate-cover', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workId: form.id }),
    });
    const data = await res.json();
    if (data.url) {
      set('cover_url', data.url);
      setMsg('Portada generada correctamente ✓');
    } else {
      setMsg('Error: ' + (data.error ?? 'No se pudo generar la portada'));
    }
    setGeneratingCover(false);
  }

  async function handleUploadCover(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !form.id) return;
    setUploadingCover(true); setMsg('');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('bucket', 'covers');
    formData.append('path', `user-works/${form.id}.jpg`);
    const res = await fetch('/api/admin/upload', { method: 'POST', body: formData });
    const data = await res.json();
    if (data.url) {
      const url = `${data.url}?v=${Date.now()}`;
      set('cover_url', url);
      await supabase.from('user_works').update({ cover_url: url }).eq('id', form.id);
      setMsg('Portada subida correctamente ✓');
    } else {
      setMsg('Error al subir: ' + (data.error ?? 'sin respuesta'));
    }
    setUploadingCover(false);
    e.target.value = '';
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

        {/* ── Portada ────────────────────────────────────────────────── */}
        <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #2A2720' }}>
          <div className="px-4 pt-4 pb-3" style={{ background: '#111' }}>
            <p className="text-sm font-medium mb-1" style={{ color: '#F2EDE4' }}>Portada</p>
            <p className="text-xs" style={{ color: '#6A6460' }}>
              Generá la portada con IA o subí tu propia imagen.
            </p>
          </div>

          <div className="p-4 flex gap-4" style={{ background: '#0D0C0B' }}>
            {/* Preview */}
            <div className="w-24 flex-shrink-0">
              <div className="aspect-[2/3] rounded-lg overflow-hidden flex items-center justify-center"
                style={{ background: '#1A1816', border: '1px solid #2A2720' }}>
                {form.cover_url
                  ? <img src={form.cover_url} alt="Portada" className="w-full h-full object-cover" />
                  : <span className="text-2xl" style={{ opacity: 0.4 }}>🖼</span>}
              </div>
            </div>

            {/* Controles */}
            <div className="flex-1 flex flex-col gap-3">
              <div className="flex gap-2">
                {[
                  { id: 'generate', label: '✨ Generar con IA' },
                  { id: 'upload',   label: '🖼 Subir imagen' },
                ].map(t => (
                  <button key={t.id} type="button"
                    onClick={() => setCoverTab(t.id as any)}
                    className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
                    style={{
                      background: coverTab === t.id ? '#C9933A22' : '#1A1816',
                      border: `1px solid ${coverTab === t.id ? '#C9933A' : '#2A2720'}`,
                      color: coverTab === t.id ? '#C9933A' : '#6A6460',
                    }}>
                    {t.label}
                  </button>
                ))}
              </div>

              {!form.id && (
                <p className="text-xs" style={{ color: '#6A6460' }}>
                  Guardá la obra primero para poder {coverTab === 'generate' ? 'generar' : 'subir'} la portada.
                </p>
              )}

              {coverTab === 'generate' ? (
                <>
                  <p className="text-xs" style={{ color: '#8A8478' }}>
                    Se crea a partir del título y la descripción de tu obra.
                  </p>
                  <button type="button" onClick={handleGenerateCover}
                    disabled={generatingCover || !form.id}
                    className="py-2.5 rounded-full text-sm font-semibold transition-opacity hover:opacity-80 disabled:opacity-40"
                    style={{ background: '#C9933A', color: '#fff' }}>
                    {generatingCover ? 'Generando portada… puede tardar unos segundos' : form.cover_url ? 'Regenerar portada' : 'Generar portada'}
                  </button>
                </>
              ) : (
                <>
                  <p className="text-xs" style={{ color: '#8A8478' }}>Subí una imagen (JPG o PNG).</p>
                  <button type="button"
                    disabled={!form.id || uploadingCover}
                    onClick={() => coverFileRef.current?.click()}
                    className="py-2.5 rounded-full text-sm font-semibold transition-opacity hover:opacity-80 disabled:opacity-40"
                    style={{ background: '#2A2720', color: '#F2EDE4' }}>
                    {uploadingCover ? 'Subiendo…' : form.cover_url ? 'Reemplazar imagen' : 'Elegir imagen'}
                  </button>
                  <input ref={coverFileRef} type="file" accept="image/*" className="hidden" onChange={handleUploadCover} />
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── Audio ──────────────────────────────────────────────────── */}
        <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #2A2720' }}>
          <div className="px-4 pt-4 pb-3" style={{ background: '#111' }}>
            <p className="text-sm font-medium mb-1" style={{ color: '#F2EDE4' }}>Audio</p>
            <p className="text-xs" style={{ color: '#6A6460' }}>
              Generá el audio con IA o subí tu propia grabación.
            </p>
          </div>

          {/* Audio actual */}
          {form.audio_url && (
            <div className="px-4 py-3" style={{ background: '#0D0C0B', borderBottom: '1px solid #2A2720' }}>
              <p className="text-xs mb-2" style={{ color: '#8A8478' }}>Audio actual:</p>
              <audio controls src={form.audio_url} className="w-full" style={{ height: 36 }} />
            </div>
          )}

          {/* Tabs */}
          <div className="flex" style={{ background: '#111', borderBottom: '1px solid #2A2720' }}>
            {[
              { id: 'generate', label: '✨ Generar con IA' },
              { id: 'upload',   label: '🎙 Subir mi audio' },
            ].map(t => (
              <button key={t.id} type="button"
                onClick={() => setAudioTab(t.id as any)}
                className="flex-1 py-2.5 text-xs font-medium transition-colors"
                style={{
                  color: audioTab === t.id ? '#C9933A' : '#6A6460',
                  borderBottom: audioTab === t.id ? '2px solid #C9933A' : '2px solid transparent',
                  background: 'transparent',
                }}>
                {t.label}
              </button>
            ))}
          </div>

          <div className="p-4" style={{ background: '#0D0C0B' }}>
            {audioTab === 'generate' ? (
              <div className="flex flex-col gap-3">
                <p className="text-xs" style={{ color: '#8A8478' }}>Elegí la voz:</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'es-elena', label: 'Elena', desc: 'Mujer · Español AR' },
                    { id: 'es-jorge', label: 'Jorge', desc: 'Hombre · Español MX' },
                    { id: 'en-jenny', label: 'Jenny', desc: 'Mujer · Inglés' },
                  ].map(v => (
                    <button key={v.id} type="button" onClick={() => setVoice(v.id)}
                      className="flex flex-col items-start px-4 py-2.5 rounded-xl transition-all"
                      style={{
                        background: voice === v.id ? '#C9933A22' : '#1A1816',
                        border: `1px solid ${voice === v.id ? '#C9933A' : '#2A2720'}`,
                      }}>
                      <span className="text-sm font-medium" style={{ color: voice === v.id ? '#C9933A' : '#F2EDE4' }}>
                        {v.label}
                      </span>
                      <span className="text-xs" style={{ color: '#6A6460' }}>{v.desc}</span>
                    </button>
                  ))}
                </div>
                {!form.id && (
                  <p className="text-xs" style={{ color: '#6A6460' }}>
                    Guardá la obra primero para poder generar el audio.
                  </p>
                )}
                <button type="button" onClick={handleGenerateAudio}
                  disabled={generating || !form.id || !form.content?.trim()}
                  className="py-2.5 rounded-full text-sm font-semibold transition-opacity hover:opacity-80 disabled:opacity-40"
                  style={{ background: '#C9933A', color: '#fff' }}>
                  {generating ? 'Generando audio… puede tardar unos segundos' : form.audio_url ? 'Regenerar audio' : 'Generar audio'}
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <p className="text-xs" style={{ color: '#8A8478' }}>
                  Subí un archivo MP3 o WAV grabado con tu voz.
                </p>
                {!form.id && (
                  <p className="text-xs" style={{ color: '#6A6460' }}>
                    Guardá la obra primero para poder subir audio.
                  </p>
                )}
                <button type="button"
                  disabled={!form.id || uploading}
                  onClick={() => audioFileRef.current?.click()}
                  className="py-2.5 rounded-full text-sm font-semibold transition-opacity hover:opacity-80 disabled:opacity-40"
                  style={{ background: '#2A2720', color: '#F2EDE4' }}>
                  {uploading ? 'Subiendo…' : form.audio_url ? 'Reemplazar audio' : 'Elegir archivo de audio'}
                </button>
                <input ref={audioFileRef} type="file" accept="audio/*" className="hidden" onChange={handleUploadAudio} />
              </div>
            )}
          </div>
        </div>

        {/* Visibilidad */}
        <div className="rounded-2xl p-4" style={{ background: '#111', border: '1px solid #2A2720' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: '#F2EDE4' }}>
                {form.is_public ? 'Gratis' : '🔒 De pago'}
              </p>
              <p className="text-xs mt-0.5" style={{ color: '#6A6460' }}>
                {form.is_public
                  ? 'Cualquiera puede leerla y escucharla sin pagar.'
                  : 'Los lectores deberán comprarla para acceder.'}
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

          {/* Precio — solo si es de pago */}
          {!form.is_public && (
            <div className="mt-4 pt-4" style={{ borderTop: '1px solid #2A2720' }}>
              <label className="block text-xs mb-1.5" style={{ color: '#8A8478' }}>
                Precio de esta obra (ARS)
              </label>
              <div className="flex items-center gap-2">
                <span style={{ color: '#8A8478' }}>$</span>
                <input
                  type="number" min={0} step={100}
                  value={form.price_ars ?? ''}
                  onChange={e => set('price_ars', e.target.value === '' ? null : Math.max(0, parseInt(e.target.value, 10) || 0))}
                  placeholder="0"
                  className="w-40 px-4 py-2.5 rounded-xl text-sm outline-none"
                  style={STYLE}
                />
              </div>
              <p className="text-xs mt-1.5" style={{ color: '#6A6460' }}>
                Lo podés cambiar cuando quieras. De cada venta, vos recibís el 70% y Epovox el 30%.
                {(form.price_ars == null || form.price_ars <= 0) && ' Sin precio, la obra no se puede comprar todavía.'}
              </p>
            </div>
          )}
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
            {loading ? '...' : 'Compartir'}
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
