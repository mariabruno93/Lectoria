import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { exchangeCode, BASE_URL } from '@/lib/mercadopago';

// Vuelve el autor desde Mercado Pago con el `code`. Se guardan sus tokens.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(`${BASE_URL}/login?redirect=/perfil`);

  // Seguridad: el state tiene que coincidir con el usuario logueado.
  if (!code || state !== user.id) {
    return NextResponse.redirect(`${BASE_URL}/perfil?mp=error`);
  }

  try {
    const t = await exchangeCode(code);
    const admin = createAdminClient();
    const expires = new Date(Date.now() + (t.expires_in ?? 15_552_000) * 1000).toISOString();
    await admin.from('profiles').update({
      mp_user_id: t.user_id != null ? String(t.user_id) : null,
      mp_access_token: t.access_token,
      mp_refresh_token: t.refresh_token,
      mp_token_expires: expires,
      mp_connected: true,
    }).eq('id', user.id);
    return NextResponse.redirect(`${BASE_URL}/perfil?mp=ok`);
  } catch {
    return NextResponse.redirect(`${BASE_URL}/perfil?mp=error`);
  }
}
