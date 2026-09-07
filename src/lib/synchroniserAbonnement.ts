import type { SupabaseClient } from '@supabase/supabase-js'
import type Stripe from 'stripe'

/** Lire Stripe à nouveau protège des événements retardés ou reçus dans le désordre.
 * Le lien de propriété est celui écrit par le serveur à la souscription. */
export async function synchroniserAbonnement(supabase: SupabaseClient, stripe: Stripe, id: string) {
  const { data: liens, error } = await supabase.from('subscriptions')
    .select('user_id,stripe_customer_id').eq('stripe_subscription_id', id)
  if (error) throw new Error('lecture_lien_abonnement')
  if (!liens?.length) return
  const owners = [...new Set(liens.map(l => l.user_id))]
  const customers = [...new Set(liens.map(l => l.stripe_customer_id))]
  if (owners.length !== 1 || customers.length !== 1 || !customers[0]) throw new Error('lien_abonnement_ambigu')
  const liste = await stripe.subscriptions.list({ customer: customers[0], status: 'all', limit: 100 })
  if (liste.has_more) throw new Error('abonnements_incomplets')
  const concerne = liste.data.find(s => s.id === id)
  if (!concerne) throw new Error('abonnement_introuvable')
  const periode = (s: Stripe.Subscription) => (s as unknown as { current_period_end?: number }).current_period_end ??
    (s.items.data[0] as unknown as { current_period_end?: number })?.current_period_end
  const fin = periode(concerne)
  const miseAJour = await supabase.from('subscriptions').update({ status: concerne.status,
    current_period_end: fin ? new Date(fin * 1000).toISOString() : null }).eq('stripe_subscription_id', id).select('id')
  if (miseAJour.error || !miseAJour.data?.length) throw new Error('etat_abonnement_non_ecrit')
  const actif = liste.data.find(s => s.status === 'active' || s.status === 'trialing')
  const acces = await supabase.from('drivers').update({
    subscription_active: Boolean(actif), subscription_status: actif?.status ?? concerne.status,
    trial_ends_at: actif?.status === 'trialing' && actif.trial_end ? new Date(actif.trial_end * 1000).toISOString() : null,
  }).eq('auth_user_id', owners[0]).select('id')
  if (acces.error || !acces.data?.length) throw new Error('acces_abonnement_non_ecrit')
  const profil = await supabase.from('user_profiles').upsert({ user_id: owners[0], tier: actif ? 'pro' : 'free' }, { onConflict: 'user_id' }).select('user_id')
  if (profil.error || !profil.data?.length) throw new Error('profil_abonnement_non_ecrit')
}
