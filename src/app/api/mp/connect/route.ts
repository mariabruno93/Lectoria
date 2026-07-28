import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { authorizeUrl, mpConfigured, BASE_URL } from '@/lib/mercadopago';

// Inicia el OAuth: manda al autor a Mercado Pago para conectar su cuenta.
export async function GET() {
  if (!mpConfigured()) {
    return NextResponse.redirect(`${BASE_URL}/perfil?mp=nocfg`);
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(`${BASE_URL}/login?redirect=/perfil`);
  }
  // El state es el id del usuario; se verifica en el callback contra la sesión.
  return NextResponse.redirect(authorizeUrl(user.id));
}
