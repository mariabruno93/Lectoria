'use client';

import { useEffect, useState, use, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const INPUT = "w-full px-4 py-3 rounded-xl text-sm outline-none";
const INPUT_STYLE = { background: '#1A1816', border: '1px solid #2A2720', color: '#F2EDE4' };

function PhotoUpload({ value, slug, onChange }: { value: string; slug: string; onChange: (url: string) => void }) {
  const [uploading, setUploading] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const form = new FormData();
    form.append('file', file);
    form.append('bucket', 'covers');
    form.append('path', `authors/${slug || 'author'}.${file.name.split('.').pop()}`);
    const res = await fetch('/api/admin/upload', { method: 'POST', body: form });
    const data = await res.json();
    if (data.url) onChange(data.url);
    setUploading(false);
  }

  return (
    <div className="flex items-center gap-4">
      <div className="w-20 h-20 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden"
        style={{ background: '#1A1816', border: '2px solid #2A2720' }}>
        {value
          ? <img src={value} alt="foto" className="w-full h-full object-cover" />
          : <span className="text-2xl" style={{ color: '#2A2720' }}>👤</span>}
      </div>
      <div className="flex flex-col gap-2 flex-1">
        <button type="button" onClick={() => ref.current?.click()}
          className="px-4 py-2 rounded-full text-sm transition-opacity hover:opacity-80"
          style={{ background: '#2A2720', color: '#F2EDE4' }}>
          {uploading ? 'Subiendo...' : value ? 'Cambiar foto' : 'Subir foto'}
        </button>
        <input type="text" value={value} onChange={e => onChange(e.target.value)}
          placeholder="o pegá una URL"
          className={INPUT + " text-xs"} style={INPUT_STYLE} />
        <input ref={ref} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      </div>
    </div>
  );
}

export default function EditAutor({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const isNew = id === 'nuevo';
  const supabase = createClient();

  const [form, setForm] = useState({
    slug: '', name: '', bio: '', nationality: '',
    born_year: '', died_year: '', photo_url: '',
  });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (!isNew) {
      supabase.from('authors').select('*').eq('id', id).single()
        .then(({ data }) => {
          if (data) setForm({
            slug: data.slug, name: data.name, bio: data.bio ?? '',
            nationality: data.nationality ?? '', born_year: String(data.born_year ?? ''),
            died_year: String(data.died_year ?? ''), photo_url: data.photo_url ?? '',
          });
        });
    }
  }, [id]);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const payload = {
      slug: form.slug, name: form.name, bio: form.bio || null,
      nationality: form.nationality || null,
      born_year: form.born_year ? parseInt(form.born_year) : null,
      died_year: form.died_year ? parseInt(form.died_year) : null,
      photo_url: form.photo_url || null,
    };
    const { error } = isNew
      ? await supabase.from('authors').insert(payload)
      : await supabase.from('authors').update(payload).eq('id', id);
    if (error) setMsg('Error: ' + error.message);
    else { setMsg('Guardado ✓'); setTimeout(() => router.push('/admin/autores'), 1000); }
    setLoading(false);
  }

  async function handleDelete() {
    if (!confirm('¿Eliminar este autor?')) return;
    await supabase.from('authors').delete().eq('id', id);
    router.push('/admin/autores');
  }

  return (
    <div className="p-8 max-w-xl">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => router.push('/admin/autores')} className="text-sm transition-opacity hover:opacity-80"
          style={{ color: '#8A8478' }}>← Autores</button>
        <h1 className="text-2xl font-bold" style={{ color: '#F2EDE4', fontFamily: 'Georgia, serif' }}>
          {isNew ? 'Nuevo autor' : 'Editar autor'}
        </h1>
      </div>

      <form onSubmit={handleSave} className="flex flex-col gap-4">
        {/* Foto */}
        <div>
          <label className="block text-xs mb-1.5" style={{ color: '#8A8478' }}>Foto</label>
          <PhotoUpload value={form.photo_url} slug={form.slug} onChange={v => set('photo_url', v)} />
        </div>

        {/* Nombre y Slug */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs mb-1.5" style={{ color: '#8A8478' }}>Nombre *</label>
            <input required value={form.name} onChange={e => {
              set('name', e.target.value);
              if (isNew) set('slug', e.target.value.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
            }} className={INPUT} style={INPUT_STYLE} />
          </div>
          <div>
            <label className="block text-xs mb-1.5" style={{ color: '#8A8478' }}>Slug (URL) *</label>
            <input required value={form.slug} onChange={e => set('slug', e.target.value)}
              className={INPUT} style={INPUT_STYLE} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs mb-1.5" style={{ color: '#8A8478' }}>Nacionalidad</label>
            <input value={form.nationality} onChange={e => set('nationality', e.target.value)}
              className={INPUT} style={INPUT_STYLE} />
          </div>
          <div>
            <label className="block text-xs mb-1.5" style={{ color: '#8A8478' }}>Nacimiento</label>
            <input type="number" value={form.born_year} onChange={e => set('born_year', e.target.value)}
              className={INPUT} style={INPUT_STYLE} placeholder="1809" />
          </div>
          <div>
            <label className="block text-xs mb-1.5" style={{ color: '#8A8478' }}>Fallecimiento</label>
            <input type="number" value={form.died_year} onChange={e => set('died_year', e.target.value)}
              className={INPUT} style={INPUT_STYLE} placeholder="1849" />
          </div>
        </div>

        <div>
          <label className="block text-xs mb-1.5" style={{ color: '#8A8478' }}>Biografía</label>
          <textarea rows={5} value={form.bio} onChange={(e) => set('bio', e.target.value)}
            className={INPUT + " resize-none"} style={INPUT_STYLE} />
        </div>

        {msg && (
          <p className="text-sm py-2 px-4 rounded-lg"
            style={{ background: msg.includes('Error') ? '#2D0A0A' : '#0A2D0A', color: msg.includes('Error') ? '#ef4444' : '#22c55e' }}>
            {msg}
          </p>
        )}

        <div className="flex gap-3 mt-2">
          <button type="submit" disabled={loading}
            className="flex-1 py-3 rounded-full font-semibold transition-opacity hover:opacity-80"
            style={{ background: '#C9933A', color: '#fff' }}>
            {loading ? 'Guardando...' : 'Guardar'}
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
    </div>
  );
}
