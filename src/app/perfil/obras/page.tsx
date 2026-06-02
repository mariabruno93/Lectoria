import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import ObrasClient from './ObrasClient';

export const metadata: Metadata = { title: 'Mis obras — Epovox' };

export default async function ObrasPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/perfil/obras');

  const { data: works } = await supabase
    .from('user_works')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  return <ObrasClient works={works ?? []} />;
}
