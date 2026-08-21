import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * ⛔ FERMÉE LE 21/08/2026 — CRÉATION D'ABONNEMENTS STRIPE SANS AUTHENTIFICATION.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CE QU'ELLE FAISAIT
 *
 * Un simple POST, sans compte, sans jeton et sans limite de débit, créait chez
 * Stripe un CLIENT réel et un ABONNEMENT réel. Vérifié en production : un corps
 * vide recevait un 400 métier — donc le code s'exécutait bel et bien.
 *
 * Elle portait TROIS leviers de remise, testés dans cet ordre :
 *
 *   1. `test_token`   → coupon à 0,50 €. Celui-là au moins était fermé par
 *                       défaut : sans un secret d'au moins douze caractères,
 *                       inatteignable. ⚠️ Mais l'ancien secret est en clair dans
 *                       l'historique git.
 *   2. `exit_offer`   → −20 %. Un simple booléen dans le corps JSON.
 *                       AUCUN JETON. N'importe qui, sans jamais avoir vu la
 *                       fenêtre d'offre de sortie.
 *   3. `referral_code`→ remise en pourcentage, `duration: 'forever'`.
 *                       AUCUN JETON.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ET C'ÉTAIT AUSSI UN TUNNEL QUI AVALAIT LES PAIEMENTS
 *
 * `stripe.subscriptions.create` ne produit JAMAIS d'événement
 * `checkout.session.completed`. Or c'est le seul événement dans lequel le
 * webhook du site fait son travail : ligne d'abonné, création du compte, mail de
 * bienvenue, conversions publicitaires.
 *
 * Autrement dit : un chauffeur qui payait par ce chemin était débité et
 * n'obtenait AUCUN compte. Silencieusement.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POURQUOI LA FERMER NE CASSE RIEN
 *
 * Son unique appelant était `src/app/checkout/CheckoutClient.tsx`, et `/checkout`
 * répond 308 vers `/tarifs2` depuis le 20/08 : cette page n'est plus rendue.
 * Aucun autre appelant dans les six dépôts.
 *
 * Le tunnel vivant est `/api/checkout`, qui passe par une session Stripe et
 * produit donc l'événement que le webhook attend. `/reactivation`, qui encaisse
 * comptant, l'utilise déjà avec `immediate: true`.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⚠️ SI CE TUNNEL EST UN JOUR RANIMÉ, TROIS CHOSES NE SE NÉGOCIENT PAS
 *
 *  · une remise ne s'obtient jamais par un booléen posé dans le corps de la
 *    requête. Elle se prouve côté serveur, ou elle n'existe pas ;
 *  · un abonnement créé hors session Stripe doit avoir sa propre branche dans le
 *    webhook, sinon il ne provisionne rien ;
 *  · le chemin de test à 0,50 € ne doit pas dépendre du seul secret : un secret
 *    qui a circulé une fois circule pour toujours.
 *
 * 410 et non 404 : la ressource a existé, elle est retirée volontairement.
 */
function fermee() {
  return NextResponse.json(
    { error: 'gone', message: 'Cette voie de paiement est fermée. Utilise /tarifs2.' },
    { status: 410, headers: { 'Cache-Control': 'no-store' } },
  )
}

export const GET = fermee
export const POST = fermee
export const PUT = fermee
export const PATCH = fermee
export const DELETE = fermee
