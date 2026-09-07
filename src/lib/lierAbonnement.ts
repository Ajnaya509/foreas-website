import type { SupabaseClient } from '@supabase/supabase-js'

/** Appelé seulement après validation de la signature Stripe et résolution du
 * compte par l'API d'administration Auth. Cette table refuse les écritures client. */
export async function lierAbonnement(supabase: SupabaseClient, lien: {
  userId: string; customerId: string; subscriptionId: string; status: string;
  periodEnd: string | null; pricePerMonth: number;
}) {
  const { data: avant, error } = await supabase.from('subscriptions')
    .select('id,user_id,stripe_customer_id').eq('stripe_subscription_id', lien.subscriptionId)
  if (error) throw new Error('lecture_lien_abonnement')
  if (avant?.some(row => row.user_id !== lien.userId || row.stripe_customer_id !== lien.customerId)) {
    throw new Error('proprietaire_abonnement_en_conflit')
  }
  const champs = { user_id: lien.userId, stripe_customer_id: lien.customerId,
    stripe_subscription_id: lien.subscriptionId, provider: 'stripe', status: lien.status,
    current_period_end: lien.periodEnd, price_per_month: lien.pricePerMonth }
  const requete = avant?.length
    ? supabase.from('subscriptions').update(champs).eq('stripe_subscription_id', lien.subscriptionId)
    : supabase.from('subscriptions').insert(champs)
  const resultat = await requete.select('id')
  if (resultat.error || !resultat.data?.length) throw new Error('ecriture_lien_abonnement')
}
