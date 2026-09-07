/**
 * /success — Page de confirmation post-checkout (server component)
 *
 * Refactor Phase A 14/05/2026 : conversion client component → server component
 * pour (a) charger Stripe côté serveur (pas d'aller-retour browser→API),
 * (b) émettre du HTML SSR avec metadata custom (`<title>` branded), (c) afficher
 * du contenu pertinent dès la 1ère paint au lieu d'un spinner.
 *
 * Flow :
 *  1. Query `?session_id=cs_live_...` (CHECKOUT_SESSION_ID injecté par Stripe)
 *  2. `stripe.checkout.sessions.retrieve(id, {expand: ['subscription','customer','total_details.breakdown']})`
 *  3. Détection tier réel via `price.lookup_key` (foreas_pro_*_v2 / foreas_elite_*_v2)
 *  4. Détection coupon actif (BETA60 → mention du code sous la date)
 *  5. Message rétention chaleureux avec prénom + tier + date trial_end
 *  6. 3 cards prochaines étapes : Play Store / Profil chauffeur / Communauté zone
 *  7. Lien « Gérer mon abonnement » → /abonnement
 *
 * Source de vérité tier : pricing.ts SSOT supprimé (Site2026v83), mapping inline ici.
 *
 * Design : CadreCompte applique DESIGN_SYSTEM_MASTER au parcours de compte.
 */

import type { Metadata } from 'next'
import Stripe from 'stripe'
import CadreCompte from '@/components/compte/CadreCompte'
import { Grid } from '@/components/ui/Container'
import CorpsSucces from './CorpsSucces'

export const dynamic = 'force-dynamic' // session unique → pas de cache CDN
export const runtime = 'nodejs'

// ─── Metadata branded (override layout title FOREAS générique) ────────────────
/**
 * ⚠️ MENSONGE CORRIGÉ LE 14/08/2026 — « Essai activé » dans l'onglet du navigateur.
 *
 * Deux parcours SANS essai atterrissent sur cette même page :
 *   · /reactivation envoie `immediate: true` (ReactivationClient.tsx:47) →
 *     src/app/api/checkout/route.ts:142 ne pose alors aucun `trial_end`, et le
 *     success_url reste `${origin}/success?session_id=…` (api/checkout:167) ;
 *   · /pay/[id] crée pour un revenant une session sans essai
 *     (pay/[id]/route.ts:98-127), avec le même success_url (ligne 118).
 * Un chauffeur qui vient d'être débité lisait donc « Essai activé » jusque dans le
 * titre de son onglet. Un titre statique ne peut pas trancher entre les deux cas :
 * il ne dit plus que ce qui est vrai dans les deux. L'eyebrow, lui, est conditionné
 * plus bas à la présence réelle d'un `trial_end` Stripe.
 */
export const metadata: Metadata = {
  title: 'Bienvenue dans FOREAS',
  description: 'Votre abonnement FOREAS est en place. Prochaines étapes : télécharger l\'app, configurer votre profil chauffeur, rejoindre la communauté.',
  robots: { index: false, follow: false }, // page transactionnelle privée
}

// ─── Mapping lookup_key → tier ────────────────────────────────────────────────
function detectTier(lookupKey: string | null | undefined): 'pro' | 'elite' | 'unknown' {
  if (!lookupKey) return 'unknown'
  if (lookupKey.startsWith('foreas_pro_')) return 'pro'
  if (lookupKey.startsWith('foreas_elite_')) return 'elite'
  return 'unknown'
}

function tierLabel(tier: 'pro' | 'elite' | 'unknown'): string {
  if (tier === 'pro') return 'Pro'
  if (tier === 'elite') return 'Elite'
  return 'FOREAS'
}

function formatDateFR(date: Date): string {
  return date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

// ─── Server component principal ───────────────────────────────────────────────

interface PageProps {
  searchParams: Promise<{ session_id?: string }>
}

export default async function SuccessPage({ searchParams }: PageProps) {
  const { session_id: sessionId } = await searchParams

  // Pas de session_id → état "no session"
  if (!sessionId) {
    return <NoSessionState />
  }

  // Pas de clé Stripe configurée → état dégradé
  const stripeKey = (process.env.STRIPE_SECRET_KEY ?? '').replace(/\s/g, '')
  if (!stripeKey) {
    return <ErrorState reason="Configuration Stripe manquante" />
  }

  // Retrieve la session Stripe côté serveur
  let session: Stripe.Checkout.Session
  try {
    const stripe = new Stripe(stripeKey, { apiVersion: '2025-02-24.acacia' as Stripe.StripeConfig['apiVersion'] /* Acacia volontaire : Basil déplace current_period_end */ })
    session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'customer', 'total_details.breakdown.discounts'],
    })
  } catch (err) {
    console.error('[success] Stripe retrieve failed:', (err as Error).message)
    return <ErrorState reason="Session introuvable ou invalide" />
  }

  // Garde : session non complétée
  if (session.status !== 'complete' && session.payment_status !== 'paid' && session.status !== 'open') {
    return <ErrorState reason="Paiement non finalisé" />
  }

  /* ⚠️ 28/08 — LA PAGE PROMETTAIT SUR UNE SESSION NON FINALISÉE.
     La garde au-dessus laisse passer `status === 'open'`, et c'est volontaire :
     Stripe peut renvoyer le chauffeur avant d'avoir marqué la session terminée,
     et lui montrer « paiement non finalisé » alors qu'il vient de payer serait
     pire. Mais dans cet état, le webhook n'a PAS tourné : ni compte, ni mail.
     La page affirmait pourtant « envoyé à ton adresse, à l'instant ».
     On ne bloque donc pas — on cesse d'affirmer. */
  const paiementFinalise =
    session.status === 'complete' ||
    session.payment_status === 'paid' ||
    session.payment_status === 'no_payment_required'

  // Extraction données
  const subscription = session.subscription as Stripe.Subscription | null
  const customer = session.customer as Stripe.Customer | null
  const customerEmail =
    session.customer_details?.email ?? customer?.email ?? ''
  /* ⚠️ 29/08/2026 — CETTE PAGE DISAIT « Bienvenue, chauffeur ».
     Pas un choix de copie : `customer_details.name` est vide depuis que
     `billing_address_collection` est passé à `auto` (28/08, pour débloquer les
     cartes refusées). Stripe ne collecte plus le nom de facturation.
     Notre formulaire demande maintenant le prénom et l'écrit dans les
     métadonnées de la session — c'est donc la PREMIÈRE source à lire.
     Les deux suivantes restent pour les sessions de /tarifs3, qui portent
     encore un nom de facturation. Et « chauffeur » reste le dernier recours :
     mieux vaut un mot générique qu'un « Bienvenue, ». */
  const metaSession = (session.metadata as Record<string, string> | null) || {}
  const customerName =
    metaSession.foreas_prenom || session.customer_details?.name || customer?.name || ''
  /* ⚠️ 29/08 — PLUS DE REPLI SUR « chauffeur ».
     Depuis le découpage en deux écrans, le prénom n'est demandé qu'APRÈS le
     paiement : à cet instant on ne le connaît pas encore, et c'est normal.
     Écrire « Bienvenue, chauffeur » à quelqu'un qui vient de payer, c'est lui
     dire qu'on ne sait pas qui il est. On rend une chaîne vide, et le titre
     s'adapte au lieu d'inventer un nom. */
  const firstName = customerName.split(' ')[0] || ''

  // Tier réel via price.lookup_key (préférable au metadata.plan qui peut diverger)
  const firstItem = subscription?.items?.data?.[0]
  const lookupKey = firstItem?.price?.lookup_key
  const interval = firstItem?.price?.recurring?.interval // 'day' | 'week' | 'month' | 'year' (Stripe)
  const tier = detectTier(lookupKey)
  const tierName = tierLabel(tier)

  /**
   * ⚠️ MENSONGE CORRIGÉ LE 14/08/2026 — « votre cycle hebdomadaire ».
   *
   * La ligne valait `interval === 'year' ? 'annuel' : 'hebdomadaire'` : tout ce qui
   * n'était pas annuel était étiqueté hebdomadaire. Or les abonnements sont créés au
   * MOIS — `recurring.interval: 'month'` dans api/checkout/route.ts:124,
   * api/subscription/create/route.ts:155 (via `FORMULES.mensuel.intervalle`) et
   * pay/[id]/route.ts:110. Et l'offre hebdo n'est plus au catalogue :
   * `select plan_code, billing_period, is_active from pieuvre_pricing_plans
   *  where billing_period = 'weekly'` → weekly / 12,97 / is_active = false.
   *
   * On n'étiquette plus que ce que Stripe dit réellement. Un intervalle inconnu ne
   * prend AUCUNE valeur par défaut : la phrase se contente alors de « votre cycle ».
   * C'est la valeur par défaut plausible qui avait fabriqué le faux.
   */
  const billingLabel =
    interval === 'year' ? 'annuel'
    : interval === 'month' ? 'mensuel'
    : interval === 'week' ? 'hebdomadaire'
    : null

  // Trial end (Stripe trial_period_days ou trial_end natif)
  const trialEndUnix = subscription?.trial_end
  const trialEndDate = trialEndUnix ? new Date(trialEndUnix * 1000) : null
  const trialEndFormatted = trialEndDate ? formatDateFR(trialEndDate) : null

  // Détection coupon actif (BETA60 / WELCOME20 / MLM25)
  const discounts =
    session.total_details?.breakdown?.discounts ?? []
  const activeDiscount = discounts[0]?.discount
  const promoCode =
    activeDiscount?.promotion_code && typeof activeDiscount.promotion_code === 'string'
      ? activeDiscount.promotion_code
      : null
  const couponName = activeDiscount?.coupon?.name ?? null
  const hasBeta60 = couponName?.includes('BETA60') || promoCode?.toUpperCase() === 'BETA60'

  // Customer ID pour Customer Portal
  const customerId =
    typeof session.customer === 'string'
      ? session.customer
      : session.customer?.id ?? null

  // Zone (city_slug) pour suggestion groupe communauté
  const customFields = session.custom_fields ?? []
  const cityField = customFields.find((f) => f.key === 'city')
  const city = cityField?.text?.value?.trim() ?? null
  const communityGroup = inferCommunityGroup(city)

  return <CadreCompte>
        <CorpsSucces
          sessionId={sessionId}
          firstName={firstName}
          customerEmail={customerEmail}
          trialEndUnix={trialEndUnix ?? null}
          trialEndFormatted={trialEndFormatted}
          tierName={tierName}
          billingLabel={billingLabel}
          hasBeta60={hasBeta60}
          communityGroup={communityGroup}
          customerId={customerId}
          paiementFinalise={paiementFinalise}
        />
  </CadreCompte>

}

// ─── Card prochaine étape ─────────────────────────────────────────────────────
function inferCommunityGroup(city: string | null): string | null {
  if (!city) return null
  const c = city.toLowerCase().trim()
  if (c.includes('paris')) return 'Paris Centre'
  if (
    c.includes('saint-denis') ||
    c.includes('bobigny') ||
    c.includes('saint-ouen') ||
    c.includes('aubervilliers') ||
    c.includes('argenteuil')
  ) {
    return 'Banlieue Nord'
  }
  if (
    c.includes('vitry') ||
    c.includes('créteil') ||
    c.includes('creteil') ||
    c.includes('orly') ||
    c.includes('villejuif')
  ) {
    return 'Banlieue Sud'
  }
  if (
    c.includes('boulogne') ||
    c.includes('nanterre') ||
    c.includes('défense') ||
    c.includes('defense') ||
    c.includes('versailles')
  ) {
    return 'Banlieue Ouest'
  }
  if (c.includes('marne') || c.includes('disney')) return 'Disneyland Paris'
  if (c.includes('cdg') || c.includes('roissy')) return 'CDG Aéroport'
  return null
}

// ─── États dégradés (server-rendered, pas de spinner) ─────────────────────────

function NoSessionState() {
  return <CadreCompte><Grid gap="xl" className="compte-bienvenue"><section className="compte-bienvenue-intro">
    <h1 className="compte-titre font-title t-display-xl">Retrouve ton abonnement</h1>
    <p className="compte-description t-bodylg">La confirmation s’ouvre après le paiement. Si tu as déjà souscrit, retrouve ton abonnement avec ta connexion FOREAS.</p>
    <a href="/abonnement" className="compte-bouton compte-primaire">Retrouver mon abonnement</a>
  </section></Grid></CadreCompte>
}

function ErrorState({ reason }: { reason: string }) {
  const enAttente = reason === 'Paiement non finalisé'
  return <CadreCompte><Grid gap="xl" className="compte-bienvenue"><section className="compte-bienvenue-intro">
    <h1 className="compte-titre font-title t-display-xl">{enAttente ? 'Ton paiement reste à confirmer' : 'Ta confirmation ne s’affiche pas'}</h1>
    <p className="compte-description t-bodylg">{enAttente ? 'Retourne à la page de paiement pour vérifier son état.' : 'Si tu as déjà payé, vérifie ton e-mail de confirmation ou contacte l’assistance.'}</p>
    <a href="mailto:contact@foreas.xyz" className="compte-bouton compte-primaire">Contacter l’assistance</a>
    <div className="compte-liens"><a className="t-label" href="/abonnement">Retrouver mon abonnement</a></div>
  </section></Grid></CadreCompte>
}
