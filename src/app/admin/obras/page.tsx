import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function AdminObras() {
  const supabase = await createClient();
  const { data: works } = await supabase
    .from('works')
    .select('*, authors(name)')
    .order('created_at', { ascending: false });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold" style={{ color: '#F2EDE4', fontFamily: 'Georgia, serif' }}>Obras</h1>
        <Link href="/admin/obras/nueva"
          className="px-5 py-2.5 rounded-full text-sm font-semibold transition-opacity hover:opacity-80"
          style={{ background: '#C9933A', color: '#fff' }}>
          + Nueva obra
        </Link>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #2A2720' }}>
        <table className="w-full">
          <thead>
            <tr style={{ background: '#111009' }}>
              {['Título', 'Autor', 'Tipo', 'Idioma', 'Audio', ''].map((h) => (
                <th key={h} className="text-left px-5 py-3 text-xs uppercase tracking-wide" style={{ color: '#8A8478' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(works ?? []).map((w: any, i: number) => (
              <tr key={w.id} style={{ background: i % 2 === 0 ? '#1A1816' : '#161411', borderTop: '1px solid #2A2720' }}>
                <td className="px-5 py-3.5 text-sm font-medium" style={{ color: '#F2EDE4' }}>{w.title}</td>
                <td className="px-5 py-3.5 text-sm" style={{ color: '#8A8478' }}>{w.authors?.name ?? '—'}</td>
                <td className="px-5 py-3.5">
                  <span className="text-xs px-2 py-1 rounded-full"
                    style={{ background: w.type === 'book' ? '#1E3A5F' : '#2D1B08', color: w.type === 'book' ? '#93C5FD' : '#FCD34D' }}>
                    {w.type === 'book' ? 'libro' : 'cuento'}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-xs uppercase tracking-widest" style={{ color: '#8A8478' }}>{w.language}</td>
                <td className="px-5 py-3.5">
                  <span className="text-xs" style={{ color: '#22c55e' }}>—</span>
                </td>
                <td className="px-5 py-3.5 text-right">
                  <Link href={`/admin/obras/${w.id}`}
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
