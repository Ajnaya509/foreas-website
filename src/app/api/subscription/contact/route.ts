import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * ⛔ FERMÉE LE 21/08/2026 — CINQUIÈME PORTE STRIPE, SANS AUCUNE AUTHENTIFICATION.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CE QU'ELLE FAISAIT
 *
 * Elle lisait `{ subscription_id, phone, name }` dans le corps de la requête,
 * puis exécutait chez Stripe :
 *   · stripe.subscriptions.retrieve(subscription_id)
 *   · stripe.customers.update(customerId, { phone, name })
 *   · stripe.subscriptions.update(subscription_id, { metadata: { phone } })
 *
 * Aucune authentification. Aucune vérification de propriété. L'identifiant
 * d'abonnement venait de l'appelant — et un identifiant fourni par l'appelant
 * n'est jamais une preuve d'identité.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POURQUOI C'ÉTAIT GRAVE, ET PAS SEULEMENT « PAS PROPRE »
 *
 * Son propre en-tête l'expliquait sans le voir :
 *
 *   « le téléphone = point d'ancrage du compte chauffeur (identité forte).
 *     Le webhook canonique (Railway) lira `customer.phone` […] pour
 *     créer/retrouver le compte du chauffeur web-first. »
 *
 * Écraser ce téléphone ne salissait donc pas une fiche : cela détournait le
 * rattachement d'un compte payant. Qui écrit son propre numéro sur l'abonnement
 * d'un autre se fait rattacher son compte.
 *
 * Et elle renvoyait 200 EN TOUTE CIRCONSTANCE — y compris depuis son `catch` —
 * au motif écrit de « ne jamais bloquer le paiement ». Une tentative d'écrasement
 * ne laissait donc aucune trace d'échec. Ni refus, ni alerte, ni journal.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POURQUOI LA FERMER NE CASSE RIEN
 *
 * Son seul appelant était src/app/checkout/CheckoutClient.tsx:100. Or /checkout
 * répond 308 vers /tarifs2 depuis le 20/08/2026 (next.config.ts) : cette page
 * n'est plus rendue, donc plus personne n'appelait cette route légitimement.
 * Vérifié le 21/08 : POST en production répondait 200 — elle était bien vivante
 * et joignable par requête directe, sans passer par aucune page.
 *
 * Le téléphone continue d'être collecté par le tunnel vivant : /api/checkout
 * le demande en `custom_fields` de la session Stripe. L'ancre existe toujours.
 *
 * ⚠️ SI LE TUNNEL /checkout EST UN JOUR RANIMÉ : ne pas rouvrir cette route
 * telle quelle. Le téléphone doit être posé par le SERVEUR au moment où il crée
 * l'abonnement — jamais par un second appel qui rattrape après coup un objet
 * désigné par le navigateur.
 */
function fermee() {
  return NextResponse.json(
    { error: 'not_found' },
    { status: 404, headers: { 'Cache-Control': 'no-store' } },
  )
}

export const GET = fermee
export const POST = fermee
export const PUT = fermee
export const PATCH = fermee
export const DELETE = fermee
