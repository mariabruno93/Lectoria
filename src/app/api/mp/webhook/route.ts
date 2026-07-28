import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getAuthorToken, getPayment } from '@/lib/mercadopago';

// Mercado Pago avisa acá cuando cambia un pago. El id de compra viaja en la
// query (?purchase=...). Si el pago está aprobado, se habilita el acceso.
export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const purchaseId = searchParams.get('purchase');
  let topic = searchParams.get('topic') || searchParams.get('type');
  let paymentId = searchParams.get('id') || searchParams.get('data.id');

  // MP también puede mandar los datos en el body.
  try {
    const body = await req.json();
    if (body?.type) topic = body.type;
    if (body?.data?.id) paymentId = String(body.data.id);
  } catch { /* sin body */ }

  // Solo nos interesan las notificaciones de pago.
  if (topic && topic !== 'payment') return NextResponse.json({ ok: true });
  if (!purchaseId || !paymentId) return NextResponse.json({ ok: true });

  const admin = createAdminClient();
  const { data: purchase } = await admin
    .from('purchases').select('id, author_id, status').eq('id', purchaseId).single();
  if (!purchase) return NextResponse.json({ ok: true });
  if (purchase.status === 'approved') return NextResponse.json({ ok: true }); // idempotente

  const token = await getAuthorToken(admin, purchase.author_id);
  if (!token) return NextResponse.json({ ok: true });

  const payment = await getPayment(paymentId, token);
  if (!payment) return NextResponse.json({ ok: true });

  if (payment.status === 'approved') {
    await admin.from('purchases').update({
      status: 'approved',
      mp_payment_id: String(payment.id),
      approved_at: new Date().toISOString(),
    }).eq('id', purchaseId);
  } else if (['refunded', 'charged_back', 'cancelled'].includes(payment.status)) {
    await admin.from('purchases').update({ status: 'refunded' }).eq('id', purchaseId);
  }

  return NextResponse.json({ ok: true });
}
