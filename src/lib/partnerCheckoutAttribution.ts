import type { SupabaseClient } from '@supabase/supabase-js'
import type Stripe from 'stripe'

/** Le site crée un prix Stripe par caisse. Son identifiant doit provenir de
 * cette création authentifiée, avec la formule décidée par le serveur. */
export async function registerPartnerCheckoutPrice(supabase: SupabaseClient, session: Stripe.Checkout.Session, expected: {
  interval: 'month' | 'year'; unitAmount: number;
}) {
  const lines = session.line_items
  const line = lines?.data?.[0]
  const price = line?.price
  // Stripe marque les prix price_data « active=false » : cela n'annule pas
  // la caisse qui vient de les créer. La preuve porte sur cette caisse.
  const productId = price && (typeof price.product === 'string' ? price.product : price.product?.id)
  if (!lines || lines.has_more || lines.data.length !== 1 || !line || line.quantity !== 1 || !price ||
      !price.id || !productId || price.livemode !== session.livemode ||
      price.currency !== 'eur' || price.unit_amount !== expected.unitAmount ||
      price.recurring?.interval !== expected.interval || price.recurring.interval_count !== 1) {
    throw new Error('prix_caisse_non_prouve')
  }
  const { data, error } = await supabase.rpc('partner_billing_price_register', {
    p_price_id: price.id, p_product_id: productId, p_interval: expected.interval,
    p_interval_count: 1, p_currency: 'eur', p_unit_amount: expected.unitAmount,
    p_quantity: 1, p_checkout_id: session.id,
  })
  if (error || data?.status !== 'registered' || data.price_id !== price.id) throw new Error('prix_caisse_non_enregistre')
}

/** Sauvegarde avant de rendre la caisse utilisable. Le visiteur peut encore
 * ne posséder aucun compte ; seul le serveur rattache ensuite ce choix. */
export async function preparePartnerCheckout(supabase: SupabaseClient, input: {
  checkoutId: string; customerId: string | null; code: string; authUserId: string;
}) {
  const { data, error } = await supabase.rpc('partner_referral_intent', {
    p_checkout_id: input.checkoutId, p_customer_id: input.customerId,
    p_code: input.code, p_auth_user_id: input.authUserId,
  })
  if (error || !['prepared', 'waiting_driver', 'attached', 'needs_review'].includes(data?.status)) {
    throw new Error('parrainage_non_enregistre')
  }
}

/** Appeler après la signature Stripe, le compte Auth et sa liaison de
 * facturation. Ne jamais utiliser un identifiant de compte venu du navigateur. */
export async function bindPartnerCheckout(supabase: SupabaseClient, input: {
  checkoutId: string; customerId: string; subscriptionId: string; authUserId: string;
}) {
  const { data, error } = await supabase.rpc('partner_referral_intent_bind', {
    p_checkout_id: input.checkoutId, p_customer_id: input.customerId,
    p_subscription_id: input.subscriptionId, p_auth_user_id: input.authUserId,
  })
  if (error || !['attached', 'already_attached', 'waiting_driver', 'needs_review', 'not_requested'].includes(data?.status)) {
    throw new Error('rattachement_parrainage_non_confirme')
  }
  // Les états d'attente et de conflit sont conservés en base pour reprise.
  // Une facture peut être arrivée avant cette confirmation de caisse.
  // Sans parrain aussi, le reçu doit rejoindre son propriétaire confirmé.
  if (data.status === 'attached' || data.status === 'already_attached' || data.status === 'not_requested') {
    const result = await supabase.rpc('partner_reconcile_paid_invoices', {
      p_auth_user_id: input.authUserId, p_limit: 100,
    })
    if (result.error || !result.data) throw new Error('reprise_factures_non_confirmee')
  }
  return data.status as string
}
