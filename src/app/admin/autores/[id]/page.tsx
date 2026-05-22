'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

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

  const fields = [
    { key: 'name', label: 'Nombre', type: 'text', required: true },
    { key: 'slug', label: 'Slug (URL)', type: 'text', required: true },
    { key: 'nationality', label: 'Nacionalidad', type: 'text' },
    { key: 'born_year', label: 'Año de nacimiento', type: 'number' },
    { key: 'died_year', label: 'Año de fallecimiento', type: 'number' },
    { key: 'photo_url', label: 'URL de foto', type: 'url' },
  ];

  return (
    <div className="p-8 max-w-xl">
      <h1 className="text-2xl font-bold mb-8" style={{ color: '#F2EDE4', fontFamily: 'Georgia, serif' }}>
        {isNew ? 'Nuevo autor' : 'Editar autor'}
      </h1>
      <form onSubmit={handleSave} className="flex flex-col gap-4">
        {fields.map(({ key, label, type, required }) => (
          <div key={key}>
            <label className="block text-xs mb-1.5" style={{ color: '#8A8478' }}>{label}</label>
            <input
              type={type} value={(form as any)[key]} required={required}
              onChange={(e) => set(key, e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none"
              style={{ background: '#1A1816', border: '1px solid #2A2720', color: '#F2EDE4' }}
            />
          </div>
        ))}
        <div>
          <label className="block text-xs mb-1.5" style={{ color: '#8A8478' }}>Biografía</label>
          <textarea
            rows={4} value={form.bio} onChange={(e) => set('bio', e.target.value)}
            className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
            style={{ background: '#1A1816', border: '1px solid #2A2720', color: '#F2EDE4' }}
          />
        </div>
        {msg && <p className="text-sm" style={{ color: msg.includes('Error') ? '#ef4444' : '#22c55e' }}>{msg}</p>}
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
