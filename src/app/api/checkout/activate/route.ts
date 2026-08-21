/**
 * ⚠️ ROUTE FERMÉE LE 21/08/2026 — ELLE CRÉAIT DES ABONNEMENTS SANS RIEN DEMANDER.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CE QU'ELLE FAISAIT, MESURÉ
 *
 * `GET /api/checkout/activate?customer=cus_…&plan=weekly` — aucune
 * authentification, l'identifiant client lu DANS L'ADRESSE. Elle attachait la
 * carte du client comme moyen de paiement par défaut, puis créait un abonnement
 * Stripe.
 *
 * Trois choses la rendaient inacceptable, et chacune suffit :
 *
 *  1. AUCUNE AUTHENTIFICATION. Qui connaît un identifiant client Stripe pouvait
 *     abonner cette personne. Un identifiant client n'est pas un secret : il
 *     circule dans les journaux, les exports, les tableaux de bord.
 *
 *  2. L'ANCIENNE GRILLE. Elle utilisait `weekly` / `annual` et des tarifs
 *     pré-créés — la grille à 12,97 €/semaine, celle que `src/lib/offre.ts`
 *     rend techniquement insouscriptible depuis le 14/08. Cette route était la
 *     porte de derrière par laquelle on pouvait encore la vendre.
 *
 *  3. SEPT JOURS D'ESSAI. `trial_period_days: '7'`, alors que la source unique
 *     dit TROIS. « 7 jours d'essai » est une phrase que `npm run canon` interdit
 *     d'écrire sur le site. Ici ce n'était pas une phrase : c'était le comportement.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POURQUOI LA FERMER NE CASSE RIEN
 *
 * Vérifié avant : `grep -rn "checkout/activate"` dans le site, dans l'application
 * et dans les serveurs → AUCUN appelant. Elle n'était atteignable qu'en tapant
 * son adresse.
 *
 * 404 plutôt que 401 : un 401 confirmerait qu'elle existe. Une route morte n'a
 * aucune raison de s'annoncer.
 *
 * ⚠️ NE PAS LA « RÉACTIVER » SANS LA RÉÉCRIRE. Le besoin qu'elle servait —
 * attacher une carte puis démarrer l'abonnement — est aujourd'hui couvert par
 * Stripe Checkout dans `/api/checkout`, qui lit la source unique des prix.
 */
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  console.warn('[checkout/activate] appel refusé — route fermée le 21/08/2026')
  return NextResponse.json({ error: 'not_found' }, { status: 404 })
}

export async function POST() {
  console.warn('[checkout/activate] appel refusé — route fermée le 21/08/2026')
  return NextResponse.json({ error: 'not_found' }, { status: 404 })
}
