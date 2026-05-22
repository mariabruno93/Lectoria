import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function AdminAutores() {
  const supabase = await createClient();
  const { data: authors } = await supabase.from('authors').select('*').order('name');

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold" style={{ color: '#F2EDE4', fontFamily: 'Georgia, serif' }}>Autores</h1>
        <Link href="/admin/autores/nuevo"
          className="px-5 py-2.5 rounded-full text-sm font-semibold transition-opacity hover:opacity-80"
          style={{ background: '#C9933A', color: '#fff' }}>
          + Nuevo autor
        </Link>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #2A2720' }}>
        <table className="w-full">
          <thead>
            <tr style={{ background: '#111009' }}>
              {['Nombre', 'Nacionalidad', 'Años', 'Slug', ''].map((h) => (
                <th key={h} className="text-left px-5 py-3 text-xs uppercase tracking-wide" style={{ color: '#8A8478' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(authors ?? []).map((a, i) => (
              <tr key={a.id} style={{ background: i % 2 === 0 ? '#1A1816' : '#161411', borderTop: '1px solid #2A2720' }}>
                <td className="px-5 py-3.5 text-sm font-medium" style={{ color: '#F2EDE4' }}>{a.name}</td>
                <td className="px-5 py-3.5 text-sm" style={{ color: '#8A8478' }}>{a.nationality ?? '—'}</td>
                <td className="px-5 py-3.5 text-sm" style={{ color: '#8A8478' }}>
                  {a.born_year ?? '?'} – {a.died_year ?? 'presente'}
                </td>
                <td className="px-5 py-3.5 text-xs font-mono" style={{ color: '#8A8478' }}>{a.slug}</td>
                <td className="px-5 py-3.5 text-right">
                  <Link href={`/admin/autores/${a.id}`}
                    className="text-xs px-3 py-1.5 rounded-full transition-opacity hover:opacity-80"
                    style={{ background: '#2A2720', color: '#F2EDE4' }}>
                    Editar
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
