import type { SupabaseClient } from '@supabase/supabase-js';

export type WorkAccessInfo = {
  id: string;
  user_id: string;
  is_public: boolean | null;
};

/**
 * ¿El usuario `buyerId` tiene acceso a esta obra?
 *
 * - Obra gratis (is_public) → sí.
 * - El autor siempre ve lo suyo.
 * - Si no: tiene que haber una compra `approved` de ese autor que sea de la
 *   biblioteca completa (tier='library') o de esa obra puntual (work_id).
 *
 * `supabase` puede ser el cliente del usuario (RLS deja leer las compras propias)
 * o el admin. Si no hay usuario logueado, solo las obras gratis dan acceso.
 */
export async function hasAccess(
  supabase: SupabaseClient,
  buyerId: string | null,
  work: WorkAccessInfo,
): Promise<boolean> {
  if (work.is_public) return true;
  if (!buyerId) return false;
  if (work.user_id === buyerId) return true;

  const { data } = await supabase
    .from('purchases')
    .select('id, tier, work_id')
    .eq('buyer_id', buyerId)
    .eq('author_id', work.user_id)
    .eq('status', 'approved');

  return (data ?? []).some(p => p.tier === 'library' || p.work_id === work.id);
}

/** Comisión de Epovox sobre cada compra (lo que se queda la plataforma). */
export const EPOVOX_FEE_RATE = 0.30;

/** Calcula el marketplace_fee (corte de Epovox) a partir del precio. */
export function marketplaceFee(amountArs: number): number {
  return Math.round(amountArs * EPOVOX_FEE_RATE);
}
