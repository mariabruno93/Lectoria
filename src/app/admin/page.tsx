import { createClient } from '@/lib/supabase/server';

export default async function AdminDashboard() {
  const supabase = await createClient();

  const [{ count: totalWorks }, { count: totalAuthors }, { count: totalPlays }] = await Promise.all([
    supabase.from('works').select('*', { count: 'exact', head: true }),
    supabase.from('authors').select('*', { count: 'exact', head: true }),
    supabase.from('plays').select('*', { count: 'exact', head: true }),
  ]);

  const { data: topWorks } = await supabase
    .from('plays')
    .select('work_id, works(title)')
    .limit(100);

  // Contar plays por obra
  const counts: Record<string, { title: string; plays: number }> = {};
  (topWorks ?? []).forEach((p: any) => {
    const id = p.work_id;
    if (!counts[id]) counts[id] = { title: p.works?.title ?? '—', plays: 0 };
    counts[id].plays++;
  });
  const top5 = Object.values(counts).sort((a, b) => b.plays - a.plays).slice(0, 5);

  const { data: recentWorks } = await supabase
    .from('works')
    .select('*, authors(name)')
    .order('created_at', { ascending: false })
    .limit(5);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-8" style={{ color: '#F2EDE4', fontFamily: 'Georgia, serif' }}>Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-5 mb-10">
        {[
          { label: 'Obras totales', value: totalWorks ?? 0, icon: '📚' },
          { label: 'Autores', value: totalAuthors ?? 0, icon: '👤' },
          { label: 'Reproducciones', value: totalPlays ?? 0, icon: '▶' },
        ].map(({ label, value, icon }) => (
          <div key={label} className="rounded-2xl p-6" style={{ background: '#1A1816', border: '1px solid #2A2720' }}>
            <p className="text-2xl mb-1">{icon}</p>
            <p className="text-3xl font-bold mb-1" style={{ color: '#F2EDE4' }}>{value.toLocaleString()}</p>
            <p className="text-sm" style={{ color: '#8A8478' }}>{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Top obras */}
        <div className="rounded-2xl p-6" style={{ background: '#1A1816', border: '1px solid #2A2720' }}>
          <h2 className="font-semibold mb-4" style={{ color: '#F2EDE4' }}>Más escuchadas</h2>
          {top5.length === 0
            ? <p className="text-sm" style={{ color: '#8A8478' }}>Sin reproducciones todavía.</p>
            : top5.map((w, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b last:border-0" style={{ borderColor: '#2A2720' }}>
                <span className="text-sm truncate" style={{ color: '#F2EDE4' }}>{w.title}</span>
                <span className="text-xs ml-4 flex-shrink-0" style={{ color: '#C9933A' }}>{w.plays} plays</span>
              </div>
            ))
          }
        </div>

        {/* Obras recientes */}
        <div className="rounded-2xl p-6" style={{ background: '#1A1816', border: '1px solid #2A2720' }}>
          <h2 className="font-semibold mb-4" style={{ color: '#F2EDE4' }}>Agregadas recientemente</h2>
          {(recentWorks ?? []).map((w: any) => (
            <div key={w.id} className="flex items-center justify-between py-2 border-b last:border-0" style={{ borderColor: '#2A2720' }}>
              <div className="min-w-0">
                <p className="text-sm truncate" style={{ color: '#F2EDE4' }}>{w.title}</p>
                <p className="text-xs" style={{ color: '#8A8478' }}>{w.authors?.name}</p>
              </div>
              <span className="text-xs ml-4 px-2 py-0.5 rounded-full flex-shrink-0"
                style={{ background: '#2A2720', color: '#8A8478' }}>
                {w.type === 'book' ? 'libro' : 'cuento'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
