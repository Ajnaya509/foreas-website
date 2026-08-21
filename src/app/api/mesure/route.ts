/**
 * FOREAS — LA RÉCEPTION DES ÉVÉNEMENTS DU SITE.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ELLE ÉCRIT DANS `events`, ET DANS AUCUNE TABLE NOUVELLE.
 *
 * Cherché avant d'écrire : `events` existe déjà, avec exactement les colonnes
 * qu'il faut (`event_name`, `event_category`, `payload`, `source`, `session_id`,
 * `created_at`). Créer une table parallèle aurait donné deux endroits où
 * chercher la même réponse — et une seule des deux aurait été tenue à jour.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CE QU'ELLE NE FAIT PAS, DÉLIBÉRÉMENT
 *
 *  · Elle n'enregistre AUCUNE adresse IP, même hachée. La colonne existe, elle
 *    reste vide. Une adresse est une donnée personnelle ; on n'en a pas besoin
 *    pour répondre à « quelle page a produit quel abonné ».
 *  · Elle n'accepte AUCUN identifiant d'identité venu du navigateur. Un
 *    identifiant fourni par l'appelant n'est pas une preuve d'identité — c'est la
 *    leçon la plus chère de la semaine.
 *  · Elle n'émet PAS `SubscriptionConfirmed` ni `StartTrialConfirmed` : ces
 *    deux-là ne peuvent venir que du serveur, après confirmation de paiement.
 *    Un abonnement déduit d'une page de remerciement est un chiffre inventé.
 */

import { NextRequest, NextResponse } from 'next/server'
import { isSameOriginRequest, forbiddenOrigin } from '@/lib/api-guard'
import { clientServeurOuNull } from '@/lib/supabaseServeur'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/** Ces deux-là ne s'écrivent que côté serveur, jamais depuis le navigateur. */
const RESERVES_AU_SERVEUR = new Set(['SubscriptionConfirmed', 'StartTrialConfirmed'])

/** Plafond simple, par processus. Empêche qu'une boucle noie la table. */
const PLAFOND_PAR_MINUTE = 600
let fenetreDebut = Date.now()
let compteur = 0

function sousPlafond(): boolean {
  const maintenant = Date.now()
  if (maintenant - fenetreDebut >= 60_000) {
    fenetreDebut = maintenant
    compteur = 0
  }
  if (compteur >= PLAFOND_PAR_MINUTE) return false
  compteur += 1
  return true
}

function texte(v: unknown, max: number): string | null {
  if (typeof v !== 'string') return null
  const t = v.trim()
  return t ? t.slice(0, max) : null
}

export async function POST(request: NextRequest) {
  try {
    // ─────────────────────────────────────────────────────────────────────────
    // 21/08/2026 — CETTE PORTE ÉTAIT GRANDE OUVERTE.
    //
    // Sa jumelle `/api/track-landing` refuse les appels venus d'ailleurs depuis
    // toujours (route.ts:12). Celle-ci, non. N'importe qui pouvait donc écrire
    // dans `events` — la table sur laquelle on juge si le site marche.
    //
    // Ce n'est pas un risque théorique : c'est ce qui rend les chiffres
    // OPPOSABLES ou non. Une table que le monde entier peut remplir ne prouve
    // rien, et les décisions prises dessus sont des décisions prises au hasard.
    //
    // ⚠️ LA GARDE EST AVANT LE PLAFOND, ET C'EST VOLONTAIRE. Le plafond est de
    // 600 par minute. Placée après, un appel extérieur l'épuiserait, et la
    // vraie mesure repartirait en « 202 · plafond » — le contrôle se tairait au
    // lieu de crier. L'ordre des deux lignes est le correctif.
    // ─────────────────────────────────────────────────────────────────────────
    if (!isSameOriginRequest(request)) return forbiddenOrigin()

    if (!sousPlafond()) {
      // 202 : on accepte de ne pas compter plutôt que de faire échouer une page.
      // Mais on le DIT dans les journaux — un plafond silencieux fabrique un
      // trou dans la mesure que personne ne remarque.
      console.warn('[mesure] plafond atteint — événement non enregistré')
      return NextResponse.json({ enregistre: false, raison: 'plafond' }, { status: 202 })
    }

    const corps = await request.json().catch(() => null)
    if (!corps || typeof corps !== 'object') {
      return NextResponse.json({ error: 'corps invalide' }, { status: 400 })
    }

    const evenement = texte((corps as Record<string, unknown>).evenement, 60)
    if (!evenement) {
      return NextResponse.json({ error: 'événement manquant' }, { status: 400 })
    }
    if (RESERVES_AU_SERVEUR.has(evenement)) {
      console.warn(`[mesure] ${evenement} refusé : il ne peut venir que du serveur`)
      return NextResponse.json({ error: 'événement réservé au serveur' }, { status: 403 })
    }

    const c = corps as Record<string, unknown>
    const charge = {
      page: texte(c.page, 200),
      intention: texte(c.intention, 40),
      audience: texte(c.audience, 40),
      promesse: texte(c.promesse, 300),
      variante: texte(c.variante, 60),
      origine: typeof c.origine === 'object' && c.origine ? c.origine : {},
      consentement: c.consentement === true,
      detail: typeof c.detail === 'object' && c.detail ? c.detail : null,
      event_id: texte(c.event_id, 80),
    }

    const sb = clientServeurOuNull()
    if (!sb) {
      // La fabrique refuse plutôt que de dégrader. On le remonte franchement :
      // un 200 ici ferait croire que la mesure tourne alors qu'elle est morte.
      return NextResponse.json({ error: 'mesure indisponible' }, { status: 503 })
    }

    const { error } = await sb.from('events').insert({
      event_name: evenement,
      event_category: 'site',
      payload: charge,
      source: (charge.origine as Record<string, string>)?.utm_source ?? 'direct',
      session_id: texte(request.cookies.get('foreas_vid')?.value, 80),
      // ip_hash reste NULL : on ne collecte pas d'adresse.
    })

    if (error) {
      console.error('[mesure] écriture refusée :', error.message)
      return NextResponse.json({ error: 'écriture refusée' }, { status: 500 })
    }

    return NextResponse.json({ enregistre: true }, { status: 202 })
  } catch (e) {
    console.error('[mesure] erreur :', (e as Error)?.message)
    return NextResponse.json({ error: 'erreur' }, { status: 500 })
  }
}
