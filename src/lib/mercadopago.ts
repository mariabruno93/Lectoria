import type { SupabaseClient } from '@supabase/supabase-js';

// Integración Marketplace de Mercado Pago (split de pagos 30/70).
// El autor conecta su cuenta por OAuth; el checkout usa SU access_token con
// un marketplace_fee (el corte de Epovox).

const MP_API = 'https://api.mercadopago.com';
const MP_AUTH = 'https://auth.mercadopago.com.ar/authorization';

export const BASE_URL = 'https://epovox.com';
export const MP_REDIRECT_URI = `${BASE_URL}/api/mp/callback`;

const CLIENT_ID = process.env.MP_CLIENT_ID ?? '';
const CLIENT_SECRET = process.env.MP_CLIENT_SECRET ?? '';

export function mpConfigured(): boolean {
  return !!CLIENT_ID && !!CLIENT_SECRET;
}

/** URL a la que se manda al autor para autorizar la conexión de su MP. */
export function authorizeUrl(state: string): string {
  const p = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: 'code',
    platform_id: 'mp',
    redirect_uri: MP_REDIRECT_URI,
    state,
  });
  return `${MP_AUTH}?${p.toString()}`;
}

/** Intercambia el `code` del OAuth por los tokens del autor. */
export async function exchangeCode(code: string): Promise<any> {
  const res = await fetch(`${MP_API}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
      redirect_uri: MP_REDIRECT_URI,
    }),
  });
  if (!res.ok) throw new Error(`oauth exchange ${res.status}: ${await res.text()}`);
  return res.json();
}

async function refresh(refreshToken: string): Promise<any> {
  const res = await fetch(`${MP_API}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });
  if (!res.ok) throw new Error(`oauth refresh ${res.status}`);
  return res.json();
}

/** Devuelve un access_token válido del autor (refresca si está por vencer). */
export async function getAuthorToken(admin: SupabaseClient, authorId: string): Promise<string | null> {
  const { data: p } = await admin
    .from('profiles')
    .select('mp_access_token, mp_refresh_token, mp_token_expires, mp_connected')
    .eq('id', authorId)
    .single();
  if (!p?.mp_connected || !p.mp_access_token) return null;

  const soon = Date.now() + 60_000;
  const expired = p.mp_token_expires && new Date(p.mp_token_expires).getTime() < soon;
  if (expired && p.mp_refresh_token) {
    try {
      const t = await refresh(p.mp_refresh_token);
      const expires = new Date(Date.now() + (t.expires_in ?? 15_552_000) * 1000).toISOString();
      await admin.from('profiles').update({
        mp_access_token: t.access_token,
        mp_refresh_token: t.refresh_token ?? p.mp_refresh_token,
        mp_token_expires: expires,
      }).eq('id', authorId);
      return t.access_token;
    } catch {
      return p.mp_access_token; // fallback al actual
    }
  }
  return p.mp_access_token;
}

/** Crea una preferencia de Checkout Pro (con el token del autor + marketplace_fee). */
export async function createPreference(token: string, pref: Record<string, unknown>): Promise<any> {
  const res = await fetch(`${MP_API}/checkout/preferences`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(pref),
  });
  if (!res.ok) throw new Error(`preference ${res.status}: ${await res.text()}`);
  return res.json();
}

/** Trae el detalle de un pago con el token del autor (colector). */
export async function getPayment(paymentId: string, token: string): Promise<any | null> {
  const res = await fetch(`${MP_API}/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  return res.json();
}
