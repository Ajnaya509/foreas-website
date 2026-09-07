import type { SupabaseClient } from '@supabase/supabase-js'
import type Stripe from 'stripe'

const RETOUR = 'https://www.foreas.xyz/abonnement'
const headers = { 'Cache-Control': 'no-store, private', 'Vary': 'Authorization' }
const json = (body: unknown, status = 200) => Response.json(body, { status, headers })
class Refus extends Error {
  constructor(readonly status: number, message: string) { super(message) }
}

/** Le propriétaire vient du service de connexion et d'une table sans écriture
 * client. Les champs du profil, l'adresse reçue et user_metadata ne font
 * jamais autorité pour la facturation. */
export function gestionAbonnement(deps: {
  supabase: () => SupabaseClient
  stripe: () => Stripe
}) {
  return async (request: Request): Promise<Response> => {
    try {
      const bearer = request.headers.get('authorization')?.match(/^Bearer (\S+)$/i)?.[1]
      if (!bearer) throw new Refus(401, 'Connecte-toi pour retrouver ton abonnement.')
      const supabase = deps.supabase()
      const { data, error } = await supabase.auth.getUser(bearer)
      if (error || !data.user) throw new Refus(401, 'Ta connexion a expiré. Reconnecte-toi.')
      // Refuser les anciens liens, même quand la personne est connectée.
      if (new URL(request.url).search) throw new Refus(400, 'Cette adresse ne doit contenir aucun identifiant.')
      let action: 'gerer' | 'arreter' = 'gerer'
      if (request.method === 'POST') {
        let body: Record<string, unknown>
        try { body = await request.json() } catch { throw new Refus(400, 'Demande invalide.') }
        if (!body || Array.isArray(body) || Object.keys(body).some(k => k !== 'action') ||
            (body.action !== undefined && body.action !== 'gerer' && body.action !== 'arreter')) {
          throw new Refus(400, 'Demande invalide.')
        }
        action = body.action === 'arreter' ? 'arreter' : 'gerer'
      }
      const { data: liens, error: erreurLiens } = await supabase.from('subscriptions')
        .select('stripe_customer_id').eq('user_id', data.user.id).eq('provider', 'stripe')
      if (erreurLiens) throw new Error('lecture_abonnements')
      const clients = [...new Set((liens ?? []).map(l => l.stripe_customer_id).filter(Boolean))] as string[]
      if (clients.length > 1) throw new Refus(409, 'Plusieurs comptes de facturation sont reliés. Contacte contact@foreas.xyz.')
      if (!clients.length) {
        if (request.method === 'GET') return json({ abonnement: null })
        throw new Refus(404, 'Aucun abonnement relié à cette connexion. Si tu as déjà souscrit, contacte contact@foreas.xyz.')
      }
      const stripe = deps.stripe()
      const customerId = clients[0]
      const liste = await stripe.subscriptions.list({ customer: customerId, status: 'all', limit: 100 })
      // Une liste incomplète ne doit jamais annoncer à tort « aucun abonnement ».
      if (liste.has_more) throw new Refus(409, 'Contacte contact@foreas.xyz pour vérifier tes abonnements.')
      const enCours = liste.data.filter(s => !['canceled', 'incomplete_expired'].includes(s.status))
      const sub = enCours[0] ?? liste.data[0]
      const details = sub ? decrireAbonnement(sub) : null
      if (request.method === 'GET') return json({ abonnement: details })
      if (action === 'arreter' && (!sub || enCours.length !== 1)) {
        throw new Refus(409, 'Ouvre la gestion pour choisir ton abonnement.')
      }
      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: RETOUR,
        ...(action === 'arreter' && sub ? { flow_data: {
          type: 'subscription_cancel' as const,
          subscription_cancel: { subscription: sub.id },
          after_completion: { type: 'redirect' as const, redirect: { return_url: RETOUR } },
        } } : {}),
      })
      return json({ url: session.url })
    } catch (error) {
      if (error instanceof Refus) return json({ error: error.message }, error.status)
      console.error('[abonnement] Vérification ou ouverture indisponible')
      return json({ error: 'La gestion est momentanément indisponible. Réessaie dans un instant.' }, 503)
    }
  }
}

export function decrireAbonnement(sub: Stripe.Subscription) {
  // Acacia porte la période sur l'abonnement ; Basil la porte sur ses lignes.
  const periode = (sub as unknown as { current_period_end?: number }).current_period_end ??
    (sub.items.data[0] as unknown as { current_period_end?: number })?.current_period_end
  const arret = sub.status === 'canceled' || sub.cancel_at_period_end || Boolean(sub.cancel_at)
  const iso = (time: number | null | undefined) => time ? new Date(time * 1000).toISOString() : null
  return {
    statut: sub.status,
    renouvellement_arrete: arret,
    prochain_prelevement: arret ? null : iso(sub.status === 'trialing' ? sub.trial_end : periode),
    fin_acces: arret ? iso(sub.cancel_at ?? (sub.status === 'canceled' ? sub.ended_at : periode)) : null,
  }
}
