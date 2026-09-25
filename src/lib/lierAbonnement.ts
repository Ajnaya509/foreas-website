import type { SupabaseClient } from '@supabase/supabase-js'

/** Appelé seulement après validation de la signature Stripe et résolution du
 * compte par l'API d'administration Auth. Cette table refuse les écritures client. */
export async function lierAbonnement(supabase: SupabaseClient, lien: {
  userId: string; customerId: string; subscriptionId: string; status: string;
  periodEnd: string | null; pricePerMonth: number;
}) {
  const { data, error } = await supabase.rpc('partner_billing_link', {
    p_auth_user_id: lien.userId, p_customer_id: lien.customerId,
    p_subscription_id: lien.subscriptionId, p_status: lien.status,
    p_period_end: lien.periodEnd, p_price_per_month: lien.pricePerMonth,
  })
  // La transaction crée la ligne publique seulement depuis Auth confirmé,
  // verrouille l'identité et refuse les abonnements appartenant à un autre compte.
  if (error || data?.status !== 'linked' || !data.subscription_row_id) throw new Error('ecriture_lien_abonnement')
}
