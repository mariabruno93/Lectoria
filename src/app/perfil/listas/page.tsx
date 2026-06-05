import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ListasClient from './ListasClient';

export const dynamic = 'force-dynamic';

export default async function ListasPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/perfil/listas');

  const { data: lib } = await supabase
    .from('user_library')
    .select('work_id, is_following, is_playing, is_finished, updated_at, works(id, slug, title, type, year, cover_url, cover_gradient_from, cover_gradient_to, authors(name, slug))')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  const entries = (lib ?? []).map(r => ({
    workId: r.work_id,
    status: {
      is_following: r.is_following,
      is_playing:   r.is_playing,
      is_finished:  r.is_finished,
    },
    work: r.works as any,
    updatedAt: r.updated_at,
  })).filter(e => e.work);

  return <ListasClient userId={user.id} entries={entries} />;
}
