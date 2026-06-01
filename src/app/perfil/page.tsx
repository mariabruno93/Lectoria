import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import PerfilClient from './PerfilClient';

export default async function PerfilPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/perfil');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // Cargar library con datos de obras
  let libraryItems: { following: any[]; playing: any[]; finished: any[] } = {
    following: [],
    playing: [],
    finished: [],
  };

  try {
    const { data: lib } = await supabase
      .from('user_library')
      .select('work_id, is_following, is_playing, is_finished, updated_at, works(*, authors(name, slug))')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (lib) {
      libraryItems.following = lib.filter(r => r.is_following).map(r => r.works).filter(Boolean);
      libraryItems.playing   = lib.filter(r => r.is_playing && !r.is_finished).map(r => r.works).filter(Boolean);
      libraryItems.finished  = lib.filter(r => r.is_finished).map(r => r.works).filter(Boolean);
    }
  } catch {
    // tabla aún no creada
  }

  return <PerfilClient user={user} profile={profile} library={libraryItems} />;
}
