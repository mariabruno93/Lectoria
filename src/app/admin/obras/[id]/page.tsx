'use client';

import { useEffect, useState, use, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const INPUT = "w-full px-4 py-3 rounded-xl text-sm outline-none";
const INPUT_STYLE = { background: '#1A1816', border: '1px solid #2A2720', color: '#F2EDE4' };
const LABEL = "block text-xs mb-1.5";
const LABEL_STYLE = { color: '#8A8478' };

// ─── Subida de imagen ────────────────────────────────────────
function ImageUpload({ value, onChange, path }: { value: string; onChange: (url: string) => void; path: string }) {
  const [uploading, setUploading] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const form = new FormData();
    form.append('file', file);
    form.append('bucket', 'covers');
    form.append('path', path + '.' + file.name.split('.').pop());
    const res = await fetch('/api/admin/upload', { method: 'POST', body: form });
    const data = await res.json();
    if (data.url) onChange(data.url);
    setUploading(false);
  }

  return (
    <div className="flex items-center gap-4">
      {value && (
        <img src={value} alt="portada" className="w-20 h-28 object-cover rounded-lg"
          style={{ border: '1px solid #2A2720' }} />
      )}
      <div className="flex flex-col gap-2">
        <button type="button" onClick={() => ref.current?.click()}
          className="px-4 py-2 rounded-full text-sm transition-opacity hover:opacity-80"
          style={{ background: '#2A2720', color: '#F2EDE4' }}>
          {uploading ? 'Subiendo...' : value ? 'Cambiar imagen' : 'Subir imagen'}
        </button>
        <input type="text" value={value} onChange={e => onChange(e.target.value)}
          placeholder="o pegá una URL"
          className={INPUT + " text-xs"} style={INPUT_STYLE} />
        <input ref={ref} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      </div>
    </div>
  );
}

// ─── Procesador de PDF ───────────────────────────────────────
function PdfProcessor({ workSlug, lang, onChaptersSaved }: {
  workSlug: string; lang: string; onChaptersSaved: () => void;
}) {
  const [processing, setProcessing] = useState(false);
  const [chapters, setChapters] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [audioLoading, setAudioLoading] = useState<Record<number, boolean>>({});
  const [audioUrls, setAudioUrls] = useState<Record<number, string>>({});
  const supabase = createClient();

  async function handlePdf(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setProcessing(true);
    const form = new FormData();
    form.append('file', file);
    const res = await fetch('/api/admin/process-pdf', { method: 'POST', body: form });
    const data = await res.json();
    setChapters(data.chapters ?? []);
    setProcessing(false);
  }

  async function saveChapters() {
    if (!workSlug) return alert('Guardá la obra primero para obtener el slug.');
    setSaving(true);
    const { data: work } = await supabase.from('works').select('id').eq('slug', workSlug).single();
    if (!work) { alert('Obra no encontrada. Guardala primero.'); setSaving(false); return; }

    for (const ch of chapters) {
      await supabase.from('chapters').upsert({
        work_id: work.id,
        chapter_number: ch.number,
        title: ch.title,
        audio_url: audioUrls[ch.number] ?? null,
        duration_label: null,
      }, { onConflict: 'work_id,chapter_number' });
    }
    setSaving(false);
    onChaptersSaved();
    alert(`${chapters.length} capítulos guardados.`);
  }

  async function generateAudio(ch: any) {
    setAudioLoading(prev => ({ ...prev, [ch.number]: true }));
    const res = await fetch('/api/admin/generate-audio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: ch.text, workSlug, chapterNumber: ch.number, lang }),
    });
    const data = await res.json();
    if (data.url) setAudioUrls(prev => ({ ...prev, [ch.number]: data.url }));
    setAudioLoading(prev => ({ ...prev, [ch.number]: false }));
  }

  async function uploadAudio(ch: any, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAudioLoading(prev => ({ ...prev, [ch.number]: true }));
    const form = new FormData();
    form.append('file', file);
    form.append('bucket', 'audio');
    form.append('path', `${workSlug}/${ch.number}.mp3`);
    const res = await fetch('/api/admin/upload', { method: 'POST', body: form });
    const data = await res.json();
    if (data.url) setAudioUrls(prev => ({ ...prev, [ch.number]: data.url }));
    setAudioLoading(prev => ({ ...prev, [ch.number]: false }));
  }

  return (
    <div className="mt-8 pt-8" style={{ borderTop: '1px solid #2A2720' }}>
      <h2 className="text-base font-semibold mb-4" style={{ color: '#F2EDE4', fontFamily: 'Georgia, serif' }}>
        PDF → Capítulos de audio
      </h2>

      <label className="flex items-center gap-3 px-5 py-4 rounded-xl cursor-pointer transition-opacity hover:opacity-80"
        style={{ background: '#1A1816', border: '2px dashed #2A2720' }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C9933A" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/>
          <line x1="9" y1="15" x2="15" y2="15"/>
        </svg>
        <span className="text-sm" style={{ color: '#8A8478' }}>
          {processing ? 'Procesando PDF...' : 'Subir PDF para extraer capítulos'}
        </span>
        <input type="file" accept=".pdf" className="hidden" onChange={handlePdf} disabled={processing} />
      </label>

      {chapters.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm" style={{ color: '#8A8478' }}>
              {chapters.length} capítulos detectados
            </p>
            <button onClick={saveChapters} disabled={saving}
              className="px-4 py-2 rounded-full text-sm font-semibold transition-opacity hover:opacity-80"
              style={{ background: '#C9933A', color: '#fff' }}>
              {saving ? 'Guardando...' : 'Guardar capítulos'}
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {chapters.map((ch) => (
              <div key={ch.number} className="rounded-xl p-4"
                style={{ background: '#111009', border: '1px solid #2A2720' }}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium mb-1" style={{ color: '#F2EDE4' }}>
                      {ch.number}. {ch.title}
                    </p>
                    <p className="text-xs line-clamp-2" style={{ color: '#8A8478' }}>
                      {ch.preview}
                    </p>
                    <p className="text-xs mt-1" style={{ color: '#2A2720' }}>
                      {ch.charCount.toLocaleString()} caracteres
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 flex-shrink-0">
                    {audioUrls[ch.number] ? (
                      <span className="text-xs px-2 py-1 rounded-full"
                        style={{ background: '#14532D33', color: '#22c55e' }}>
                        ✓ Audio listo
                      </span>
                    ) : (
                      <>
                        <button
                          onClick={() => generateAudio(ch)}
                          disabled={audioLoading[ch.number]}
                          className="text-xs px-3 py-1.5 rounded-full transition-opacity hover:opacity-80"
                          style={{ background: '#C9933A', color: '#fff' }}>
                          {audioLoading[ch.number] ? 'Generando...' : '🎙️ Generar audio'}
                        </button>
                        <label className="text-xs px-3 py-1.5 rounded-full cursor-pointer text-center transition-opacity hover:opacity-80"
                          style={{ background: '#2A2720', color: '#F2EDE4' }}>
                          📁 Subir MP3
                          <input type="file" accept="audio/*" className="hidden"
                            onChange={(e) => uploadAudio(ch, e)} />
                        </label>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Página principal ────────────────────────────────────────
export default function EditObra({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const isNew = id === 'nueva';
  const supabase = createClient();

  const [authors, setAuthors] = useState<any[]>([]);
  const [form, setForm] = useState({
    slug: '', title: '', type: 'book', author_id: '', language: 'es',
    year: '', description: '', genre: '', duration_label: '',
    cover_gradient_from: '#1a1a2e', cover_gradient_to: '#0d0d0d',
    featured: false, translation_slug: '', cover_url: '',
  });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [savedSlug, setSavedSlug] = useState('');

  useEffect(() => {
    supabase.from('authors').select('id, name').order('name').then(({ data }) => setAuthors(data ?? []));
    if (!isNew) {
      supabase.from('works').select('*').eq('id', id).single().then(({ data }) => {
        if (data) {
          setForm({
            slug: data.slug, title: data.title, type: data.type,
            author_id: data.author_id ?? '', language: data.language,
            year: String(data.year ?? ''), description: data.description ?? '',
            genre: (data.genre ?? []).join(', '), duration_label: data.duration_label ?? '',
            cover_gradient_from: data.cover_gradient_from, cover_gradient_to: data.cover_gradient_to,
            featured: data.featured, translation_slug: data.translation_slug ?? '',
            cover_url: data.cover_url ?? '',
          });
          setSavedSlug(data.slug);
        }
      });
    }
  }, [id]);

  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const payload = {
      slug: form.slug, title: form.title, type: form.type,
      author_id: form.author_id || null, language: form.language,
      year: form.year ? parseInt(form.year) : null, description: form.description || null,
      genre: form.genre ? form.genre.split(',').map(s => s.trim()).filter(Boolean) : [],
      duration_label: form.duration_label || null,
      cover_gradient_from: form.cover_gradient_from, cover_gradient_to: form.cover_gradient_to,
      featured: form.featured, translation_slug: form.translation_slug || null,
      cover_url: form.cover_url || null,
    };
    const { error } = isNew
      ? await supabase.from('works').insert(payload)
      : await supabase.from('works').update(payload).eq('id', id);
    if (error) { setMsg('Error: ' + error.message); }
    else { setMsg('Guardado ✓'); setSavedSlug(form.slug); }
    setLoading(false);
  }

  async function handleDelete() {
    if (!confirm('¿Eliminar esta obra y sus capítulos?')) return;
    await supabase.from('works').delete().eq('id', id);
    router.push('/admin/obras');
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => router.push('/admin/obras')} className="text-sm transition-opacity hover:opacity-80"
          style={{ color: '#8A8478' }}>← Obras</button>
        <h1 className="text-2xl font-bold" style={{ color: '#F2EDE4', fontFamily: 'Georgia, serif' }}>
          {isNew ? 'Nueva obra' : 'Editar obra'}
        </h1>
      </div>

      <form onSubmit={handleSave} className="flex flex-col gap-5">
        {/* Tipo */}
        <div>
          <label className={LABEL} style={LABEL_STYLE}>Tipo</label>
          <div className="flex gap-3">
            {['book', 'story'].map((t) => (
              <button key={t} type="button" onClick={() => set('type', t)}
                className="flex-1 py-2.5 rounded-full text-sm font-medium transition-opacity"
                style={form.type === t
                  ? { background: '#C9933A', color: '#fff' }
                  : { background: '#1A1816', border: '1px solid #2A2720', color: '#8A8478' }}>
                {t === 'book' ? '📚 Libro' : '📄 Cuento'}
              </button>
            ))}
          </div>
        </div>

        {/* Título y Slug */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={LABEL} style={LABEL_STYLE}>Título *</label>
            <input required value={form.title} onChange={e => {
              set('title', e.target.value);
              if (isNew) set('slug', e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
            }} className={INPUT} style={INPUT_STYLE} />
          </div>
          <div>
            <label className={LABEL} style={LABEL_STYLE}>Slug (URL) *</label>
            <input required value={form.slug} onChange={e => set('slug', e.target.value)}
              className={INPUT} style={INPUT_STYLE} />
          </div>
        </div>

        {/* Autor y Idioma */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={LABEL} style={LABEL_STYLE}>Autor</label>
            <select value={form.author_id} onChange={e => set('author_id', e.target.value)}
              className={INPUT} style={INPUT_STYLE}>
              <option value="">— Sin autor —</option>
              {authors.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div>
            <label className={LABEL} style={LABEL_STYLE}>Idioma</label>
            <select value={form.language} onChange={e => set('language', e.target.value)}
              className={INPUT} style={INPUT_STYLE}>
              <option value="es">🇪🇸 Español</option>
              <option value="en">🇬🇧 English</option>
            </select>
          </div>
        </div>

        {/* Año y Duración */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={LABEL} style={LABEL_STYLE}>Año de publicación</label>
            <input type="number" value={form.year} onChange={e => set('year', e.target.value)}
              className={INPUT} style={INPUT_STYLE} />
          </div>
          <div>
            <label className={LABEL} style={LABEL_STYLE}>Duración (ej: 2h 30min)</label>
            <input value={form.duration_label} onChange={e => set('duration_label', e.target.value)}
              className={INPUT} style={INPUT_STYLE} placeholder="2h 30min" />
          </div>
        </div>

        {/* Géneros */}
        <div>
          <label className={LABEL} style={LABEL_STYLE}>Géneros (separados por coma)</label>
          <input value={form.genre} onChange={e => set('genre', e.target.value)}
            className={INPUT} style={INPUT_STYLE} placeholder="Terror, Gótico, Misterio" />
        </div>

        {/* Descripción */}
        <div>
          <label className={LABEL} style={LABEL_STYLE}>Descripción</label>
          <textarea rows={4} value={form.description} onChange={e => set('description', e.target.value)}
            className={INPUT + " resize-none"} style={INPUT_STYLE} />
        </div>

        {/* Portada */}
        <div>
          <label className={LABEL} style={LABEL_STYLE}>Imagen de portada</label>
          <ImageUpload
            value={form.cover_url}
            onChange={(url) => set('cover_url', url)}
            path={`works/${form.slug || 'nueva'}`}
          />
        </div>

        {/* Gradiente (fallback) */}
        <div>
          <label className={LABEL} style={LABEL_STYLE}>Color de fondo (gradiente fallback)</label>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <input type="color" value={form.cover_gradient_from}
                onChange={e => set('cover_gradient_from', e.target.value)}
                className="w-10 h-10 rounded cursor-pointer border-0 bg-transparent" />
              <span className="text-xs" style={{ color: '#8A8478' }}>Inicio</span>
            </div>
            <div className="flex items-center gap-2">
              <input type="color" value={form.cover_gradient_to}
                onChange={e => set('cover_gradient_to', e.target.value)}
                className="w-10 h-10 rounded cursor-pointer border-0 bg-transparent" />
              <span className="text-xs" style={{ color: '#8A8478' }}>Fin</span>
            </div>
            <div className="flex-1 h-10 rounded-lg"
              style={{ background: `linear-gradient(135deg, ${form.cover_gradient_from}, ${form.cover_gradient_to})` }} />
          </div>
        </div>

        {/* Extras */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={LABEL} style={LABEL_STYLE}>Slug de traducción</label>
            <input value={form.translation_slug} onChange={e => set('translation_slug', e.target.value)}
              className={INPUT} style={INPUT_STYLE} placeholder="dracula-en" />
          </div>
          <div className="flex items-center gap-3 pt-5">
            <button type="button" onClick={() => set('featured', !form.featured)}
              className="relative w-11 h-6 rounded-full transition-colors flex-shrink-0"
              style={{ background: form.featured ? '#C9933A' : '#2A2720' }}>
              <span className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all"
                style={{ left: form.featured ? '24px' : '4px' }} />
            </button>
            <span className="text-sm" style={{ color: '#8A8478' }}>Destacada en home</span>
          </div>
        </div>

        {msg && (
          <p className="text-sm py-2 px-4 rounded-lg"
            style={{ background: msg.includes('Error') ? '#2D0A0A' : '#0A2D0A', color: msg.includes('Error') ? '#ef4444' : '#22c55e' }}>
            {msg}
          </p>
        )}

        <div className="flex gap-3">
          <button type="submit" disabled={loading}
            className="flex-1 py-3 rounded-full font-semibold transition-opacity hover:opacity-80"
            style={{ background: '#C9933A', color: '#fff' }}>
            {loading ? 'Guardando...' : 'Guardar obra'}
          </button>
          {!isNew && (
            <button type="button" onClick={handleDelete}
              className="px-5 py-3 rounded-full text-sm transition-opacity hover:opacity-80"
              style={{ background: '#2A2720', color: '#ef4444' }}>
              Eliminar
            </button>
          )}
        </div>
      </form>

      {/* PDF → Capítulos */}
      <PdfProcessor
        workSlug={savedSlug || form.slug}
        lang={form.language}
        onChaptersSaved={() => setMsg('Capítulos guardados ✓')}
      />
    </div>
  );
}
