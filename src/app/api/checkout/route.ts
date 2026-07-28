import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { getAuthorToken, createPreference, BASE_URL } from '@/lib/mercadopago';
import { marketplaceFee } from '@/lib/entitlements';

// Crea la preferencia de pago. El monto se calcula en el server (no se confía
// en el front). El 30% queda para Epovox (marketplace_fee), el 70% al autor.
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Iniciá sesión para comprar' }, { status: 401 });

  const { authorId, tier, workId, consented } = await req.json().catch(() => ({}));
  if (!consented) return NextResponse.json({ error: 'Tenés que aceptar los términos' }, { status: 400 });
  if (!authorId || (tier !== 'single' && tier !== 'library')) {
    return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 });
  }

  const admin = createAdminClient();

  const token = await getAuthorToken(admin, authorId);
  if (!token) return NextResponse.json({ error: 'Este autor todavía no configuró sus cobros' }, { status: 400 });

  // ── Monto y título según el nivel ──────────────────────────────────────
  let amount = 0;
  let title = '';
  if (tier === 'single') {
    if (!workId) return NextResponse.json({ error: 'Falta la obra' }, { status: 400 });
    const { data: w } = await admin
      .from('user_works')
      .select('id, title, price_ars, user_id, is_public, status')
      .eq('id', workId).single();
    if (!w || w.user_id !== authorId || w.status !== 'published' || w.is_public) {
      return NextResponse.json({ error: 'Obra no válida' }, { status: 400 });
    }
    if (!w.price_ars || w.price_ars <= 0) {
      return NextResponse.json({ error: 'La obra no tiene precio definido' }, { status: 400 });
    }
    amount = w.price_ars;
    title = w.title;
  } else {
    const { data: p } = await admin
      .from('profiles').select('display_name, library_price_ars').eq('id', authorId).single();
    if (!p?.library_price_ars || p.library_price_ars <= 0) {
      return NextResponse.json({ error: 'La biblioteca no tiene precio definido' }, { status: 400 });
    }
    amount = p.library_price_ars;
    title = `Biblioteca completa de ${p.display_name ?? 'autor'}`;
  }

  const fee = marketplaceFee(amount);

  // ── Compra pendiente ───────────────────────────────────────────────────
  const { data: purchase, error: pe } = await admin.from('purchases').insert({
    buyer_id: user.id,
    author_id: authorId,
    tier,
    work_id: tier === 'single' ? workId : null,
    amount_ars: amount,
    marketplace_fee_ars: fee,
    status: 'pending',
    consented_immediate: true,
  }).select('id').single();
  if (pe || !purchase) return NextResponse.json({ error: 'No se pudo crear la compra' }, { status: 500 });

  const backUrl = tier === 'single' ? `${BASE_URL}/obra/${workId}` : `${BASE_URL}/independientes/${authorId}`;

  try {
    const pref = await createPreference(token, {
      items: [{ title, quantity: 1, unit_price: amount, currency_id: 'ARS' }],
      marketplace_fee: fee,
      payer: { email: user.email },
      external_reference: purchase.id,
      back_urls: { success: backUrl, pending: `${BASE_URL}/perfil`, failure: backUrl },
      auto_return: 'approved',
      // El id de compra viaja en la URL para correlacionar el webhook.
      notification_url: `${BASE_URL}/api/mp/webhook?purchase=${purchase.id}`,
    });
    await admin.from('purchases').update({ mp_preference_id: pref.id }).eq('id', purchase.id);
    return NextResponse.json({ url: pref.init_point });
  } catch {
    return NextResponse.json({ error: 'No se pudo iniciar el pago. Probá de nuevo.' }, { status: 502 });
  }
}
