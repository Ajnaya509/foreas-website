/**
 * ⚠️ ROUTE FERMÉE LE 21/08/2026 — AUCUN APPELANT, ET ELLE PARLAIT L'ANCIENNE GRILLE.
 *
 * `GET /api/checkout/verify?session_id=…` lisait une session Stripe et renvoyait
 * son état. Elle n'écrivait rien — le risque était donc moindre que celui de sa
 * voisine `activate`. Mais :
 *
 *  · vérifié : AUCUN appelant dans le site, l'application ou les serveurs ;
 *  · elle étiquetait le plan par défaut à `weekly`, c'est-à-dire l'ancienne
 *    grille hebdomadaire — la même étiquette fausse que celle trouvée dans le
 *    webhook Stripe. Une route qui nomme mal ce qu'elle lit alimente une mesure
 *    fausse en aval.
 *
 * Une route sans appelant qui interroge Stripe avec la clé secrète n'a aucune
 * raison de rester ouverte. Fermée en 404 : elle n'a pas à s'annoncer.
 *
 * Le besoin — confirmer qu'un paiement est allé au bout — doit être servi par le
 * webhook Stripe côté serveur, jamais par une page qui interroge une session.
 */
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  console.warn('[checkout/verify] appel refusé — route fermée le 21/08/2026')
  return NextResponse.json({ error: 'not_found' }, { status: 404 })
}
