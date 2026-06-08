import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import ObraForm from '../ObraForm';

export const metadata = { title: 'Editar obra — Epovox' };

export default async function EditarObraPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: work } = await supabase
    .from('user_works')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (!work) notFound();

  return (
    <ObraForm
      userId={user.id}
      initial={{
        id:          work.id,
        title:       work.title,
        description: work.description ?? '',
        content:     work.content ?? '',
        language:    work.language ?? 'es',
        is_public:   work.is_public ?? false,
        status:      work.status ?? 'draft',
        audio_url:   work.audio_url ?? null,
        cover_url:   work.cover_url ?? null,
      }}
    />
  );
}
