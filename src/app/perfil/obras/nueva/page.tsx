import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ObraForm from '../ObraForm';

export const metadata = { title: 'Nueva obra — Epovox' };

export default async function NuevaObraPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/perfil/obras/nueva');

  return <ObraForm userId={user.id} />;
}
