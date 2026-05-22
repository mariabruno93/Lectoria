import { createAdminClient } from '@/lib/supabase/server';

export default async function UsuariosPage() {
  const supabase = await createAdminClient();

  const { data: { users }, error } = await supabase.auth.admin.listUsers();

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, display_name, is_admin');

  const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p]));

  if (error) {
    return <div className="p-8" style={{ color: '#ef4444' }}>Error: {error.message}</div>;
  }

  const sorted = [...users].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold" style={{ color: '#F2EDE4', fontFamily: 'Georgia, serif' }}>
          Usuarios
        </h1>
        <span className="text-sm px-3 py-1 rounded-full" style={{ background: '#1A1816', color: '#8A8478' }}>
          {users.length} registrados
        </span>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #2A2720' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: '#111009', borderBottom: '1px solid #2A2720' }}>
              <th className="text-left px-5 py-3 font-medium" style={{ color: '#8A8478' }}>Usuario</th>
              <th className="text-left px-5 py-3 font-medium" style={{ color: '#8A8478' }}>Email</th>
              <th className="text-left px-5 py-3 font-medium" style={{ color: '#8A8478' }}>Registro</th>
              <th className="text-left px-5 py-3 font-medium" style={{ color: '#8A8478' }}>Rol</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((user, i) => {
              const profile = profileMap[user.id];
              const isAdmin = profile?.is_admin ?? false;
              const name = profile?.display_name;
              const initial = (name || user.email || '?').charAt(0).toUpperCase();
              const date = new Date(user.created_at).toLocaleDateString('es-AR', {
                day: '2-digit', month: 'short', year: 'numeric',
              });

              return (
                <tr key={user.id}
                  style={{
                    borderBottom: i < sorted.length - 1 ? '1px solid #2A2720' : undefined,
                    background: i % 2 === 0 ? '#0D0C0B' : '#111009',
                  }}>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                        style={{ background: '#C9933A33', color: '#C9933A', fontFamily: 'Georgia, serif' }}>
                        {initial}
                      </div>
                      <span style={{ color: '#F2EDE4' }}>{name || '—'}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3" style={{ color: '#8A8478' }}>{user.email}</td>
                  <td className="px-5 py-3" style={{ color: '#8A8478' }}>{date}</td>
                  <td className="px-5 py-3">
                    {isAdmin
                      ? <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: '#C9933A22', color: '#C9933A' }}>Admin</span>
                      : <span className="text-xs" style={{ color: '#8A8478' }}>Usuario</span>
                    }
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
