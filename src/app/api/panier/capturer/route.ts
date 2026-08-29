import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { clientServeurOuNull } from '@/lib/supabaseServeur'
import { programmerPanierAbandonne } from '@/lib/email'
import { panierAbandonneActif, PANIER_DELAI_MINUTES } from '@/lib/textesAutomatiques'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * FOREAS — LE PANIER ABANDONNÉ : ON PROGRAMME LE RAPPEL DÈS LA SAISIE.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * QUAND CETTE ROUTE EST APPELÉE
 *
 * Au moment où l'adresse du chauffeur vient d'être ACCEPTÉE PAR STRIPE
 * (`session.updateEmail()` a répondu sans erreur), et AVANT la confirmation du
 * paiement. C'est le seul instant où l'on sait deux choses à la fois :
 * l'adresse est bonne, et l'argent n'est pas passé.
 *
 * ⚠️ ELLE NE BLOQUE JAMAIS LE PAIEMENT. Un rappel non programmé coûte un
 * chauffeur qu'on ne relancera pas ; un paiement bloqué coûte l'abonnement.
 * L'appelant ignore la réponse.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⚠️ UNE SESSION, UN SEUL RAPPEL
 *
 * Le chauffeur peut corriger son adresse, réessayer après une carte refusée,
 * revenir en arrière. Sans l'unicité sur la session, chaque tentative
 * programmerait un mail de plus — il en recevrait cinq pour un seul panier.
 * L'insertion échoue si la session est déjà connue, et on s'arrête là.
 */

const FORME_SESSION = /^cs_[A-Za-z0-9_]{10,}$/

function emailPlausible(v: unknown): string | null {
  if (typeof v !== 'string') return null
  const t = v.trim().toLowerCase().slice(0, 254)
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(t) ? t : null
}

export async function POST(request: NextRequest) {
  /* ⚠️ ÉTEINT PAR DÉFAUT. Le texte de ce mail part au nom de FOREAS et
     s'adresse à quelqu'un qui n'a rien acheté. Tant que Chandler n'a pas allumé
     `PANIER_ABANDONNE_ACTIF`, on ne programme rien du tout — on ne stocke même
     pas l'adresse, puisqu'elle ne servirait à rien. */
  if (!panierAbandonneActif()) {
    return NextResponse.json({ programme: false, motif: 'eteint' })
  }

  const corps = await request.json().catch(() => null)
  const c = (corps ?? {}) as Record<string, unknown>
  const idSession = typeof c.sessionId === 'string' ? c.sessionId.trim() : ''
  const email = emailPlausible(c.email)

  if (!FORME_SESSION.test(idSession) || !email) {
    return NextResponse.json({ error: 'requete_invalide' }, { status: 400 })
  }

  const sb = clientServeurOuNull()
  if (!sb) {
    console.error('[panier] base injoignable — rappel NON programmé')
    return NextResponse.json({ programme: false }, { status: 503 })
  }

  /* ⚠️ ON RÉSERVE LA PLACE AVANT DE PROGRAMMER, PAS APRÈS.
     Deux appels simultanés (double clic sur « payer ») passeraient tous les
     deux la lecture, et programmeraient deux mails. L'insertion, elle, ne peut
     réussir qu'une fois : la contrainte d'unicité arbitre, pas notre code. */
  const { error: erreurInsertion } = await sb
    .from('paniers_abandonnes')
    .insert({ checkout_session_id: idSession, email })

  if (erreurInsertion) {
    /* 23505 = doublon : ce panier a déjà son rappel. Ce n'est pas une panne,
       c'est le comportement voulu. */
    if (erreurInsertion.code === '23505') {
      return NextResponse.json({ programme: false, motif: 'deja_connu' })
    }
    console.error(`[panier] écriture impossible : ${erreurInsertion.code} ${erreurInsertion.message}`)
    return NextResponse.json({ programme: false }, { status: 500 })
  }

  const idEnvoi = await programmerPanierAbandonne({ email, minutes: PANIER_DELAI_MINUTES })

  if (!idEnvoi) {
    /* ⚠️ LA LIGNE RESTE, ET C'EST VOULU. Elle porte la trace qu'un panier a été
       ouvert ici — utile pour compter les abandons même quand le rappel n'a pas
       pu être programmé. Sans identifiant d'envoi, il n'y a simplement rien à
       annuler plus tard. */
    console.error('[panier] rappel NON programmé — la ligne reste, sans envoi à annuler')
    return NextResponse.json({ programme: false })
  }

  const { error: erreurMaj } = await sb
    .from('paniers_abandonnes')
    .update({ envoi_programme_id: idEnvoi })
    .eq('checkout_session_id', idSession)

  if (erreurMaj) {
    /* ⚠️ CAS LE PLUS DANGEREUX DU FICHIER : le mail est programmé chez Resend et
       nous n'avons pas gardé son identifiant. Il partira donc MÊME SI le
       chauffeur paie dans la minute — « tu y étais presque » à quelqu'un qui
       vient de s'abonner. On le crie dans les journaux, faute de pouvoir le
       rattraper autrement. */
    console.error(
      `[panier] ⛔ identifiant d'envoi NON enregistré (${erreurMaj.code}) — ` +
        'ce rappel ne pourra PAS être annulé si le paiement aboutit.',
    )
  }

  return NextResponse.json({ programme: true, dans: PANIER_DELAI_MINUTES })
}
