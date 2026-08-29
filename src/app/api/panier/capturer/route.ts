import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import Stripe from 'stripe'
import { clientServeurOuNull } from '@/lib/supabaseServeur'
import { envoyerMailPanier } from '@/lib/email'
import { panierAbandonneActif, PANIER_DELAIS } from '@/lib/textesAutomatiques'

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

/** Vaut aussi pour une valeur venue de Stripe : `customer_details.email` peut
 *  être `null` tant que `updateEmail` n'a pas abouti. */
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

  if (!FORME_SESSION.test(idSession)) {
    return NextResponse.json({ error: 'requete_invalide' }, { status: 400 })
  }

  /* ═══════════════════════════════════════════════════════════════════════
     ⚠️ 29/08 — CETTE ROUTE ÉTAIT UN RELAIS OUVERT. TROUVÉ PAR L'AUDIT ADVERSE.

     Première version : l'adresse venait du CORPS de la requête, et
     l'identifiant de session n'était comparé qu'à une forme — jamais présenté à
     Stripe. Une seule commande suffisait donc à faire partir trois courriers
     signés `noreply@foreas.xyz` chez n'importe qui :

       curl -X POST .../api/panier/capturer -d '{"sessionId":"cs_aaaaaaaaaaaa",
                                                 "email":"victime@exemple.fr"}'

     Sans limite de volume. La réputation d'envoi du domaine y passait, et avec
     elle les mails d'identifiants des vrais chauffeurs.

     ⚠️ LA ROUTE SŒUR FAISAIT DÉJÀ BIEN. `/api/profil/completer` interroge
     Stripe avant d'écrire quoi que ce soit. L'omission ici était un oubli, pas
     un choix — et c'est ce genre d'asymétrie entre deux routes jumelles qu'il
     faut chercher en premier.

     DÉSORMAIS : la session doit EXISTER chez Stripe, être encore OUVERTE (un
     paiement abouti n'est pas un panier abandonné), et c'est ELLE qui donne
     l'adresse. Ce que le navigateur envoie n'est plus jamais cru. */
  const cleStripe = (process.env.STRIPE_SECRET_KEY || '').replace(/\s/g, '')
  if (!cleStripe) {
    console.warn('[panier] clé Stripe absente — capture impossible')
    return NextResponse.json({ programme: false }, { status: 503 })
  }

  let email: string | null = null
  try {
    const stripe = new Stripe(cleStripe, {
      apiVersion: '2025-08-27.basil',
      timeout: 8000,
      maxNetworkRetries: 1,
    })
    const session = await stripe.checkout.sessions.retrieve(idSession)
    if (session.status !== 'open') {
      /* `complete` = il a payé, il n'y a pas de panier à relancer.
         `expired` = trop tard, la séquence n'a plus de sens. */
      return NextResponse.json({ programme: false, motif: 'session_non_ouverte' })
    }
    email = emailPlausible(session.customer_details?.email)
  } catch {
    /* Session inconnue de Stripe : la requête est fabriquée. On ne dit pas
       laquelle des deux raisons, pour ne pas offrir un oracle. */
    return NextResponse.json({ error: 'session_invalide' }, { status: 404 })
  }

  if (!email) {
    /* L'adresse n'est pas encore posée sur la session (le champ vient d'être
       quitté mais `updateEmail` n'a pas encore répondu). Rien à faire : le
       prochain passage la trouvera. */
    return NextResponse.json({ programme: false, motif: 'sans_email' })
  }

  const sb = clientServeurOuNull()
  if (!sb) {
    console.error('[panier] base injoignable — rappel NON programmé')
    return NextResponse.json({ programme: false }, { status: 503 })
  }

  /* ⚠️ DÉFAUT 3 RELEVÉ PAR LE GRINCHEUX : UNE SÉQUENCE PAR PERSONNE, PAS PAR
     SESSION. La contrainte d'unicité porte sur la session ; or un chauffeur qui
     revient trois fois dans la semaine ouvre trois sessions, donc trois
     séquences de trois mails. Neuf messages en sept jours : il se désabonne, et
     il a raison. On ne relance donc pas quelqu'un dont une séquence tourne
     encore. Sept jours, c'est la durée de la séquence elle-même.
     ⚠️ Contrôle non atomique, assumé : deux saisies à la même seconde
     passeraient. Le webhook, lui, ferme TOUS les paniers d'une adresse au
     paiement — c'est ce filet-là qui rattrape le cas rare. */
  const ilYaSeptJours = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString()
  const { data: dejaEnCours } = await sb
    .from('paniers_abandonnes')
    .select('id')
    .eq('email', email)
    .is('converti_le', null)
    .gte('capture_le', ilYaSeptJours)
    .limit(1)

  if (dejaEnCours && dejaEnCours.length > 0) {
    return NextResponse.json({ programme: false, motif: 'sequence_deja_en_cours' })
  }

  /* ⚠️ ON RÉSERVE LA PLACE AVANT DE PROGRAMMER, PAS APRÈS.
     Deux appels simultanés (double clic sur « payer ») passeraient tous les
     deux la lecture, et programmeraient deux mails. L'insertion, elle, ne peut
     réussir qu'une fois : la contrainte d'unicité arbitre, pas notre code. */
  const { data: cree, error: erreurInsertion } = await sb
    .from('paniers_abandonnes')
    .insert({ checkout_session_id: idSession, email })
    .select('id')
    .single()

  if (erreurInsertion) {
    /* 23505 = doublon : ce panier a déjà son rappel. Ce n'est pas une panne,
       c'est le comportement voulu. */
    if (erreurInsertion.code === '23505') {
      return NextResponse.json({ programme: false, motif: 'deja_connu' })
    }
    console.error(`[panier] écriture impossible : ${erreurInsertion.code} ${erreurInsertion.message}`)
    return NextResponse.json({ programme: false }, { status: 500 })
  }

  const { idProgramme: idEnvoi } = await envoyerMailPanier({
    email,
    rang: 1,
    /* ⚠️ SIX CARACTÈRES MINIMUM, SINON ELLE DISPARAÎT SANS UN MOT.
       `/wa` valide la référence par `/^[A-Za-z0-9_-]{6,}$/` : « pa-1 » en fait
       quatre et serait rejeté EN SILENCE — Ajnaya recevrait le chauffeur sans
       savoir d'où il vient, et personne ne saurait pourquoi. On complète à six
       chiffres, ce qui tient jusqu'au millionième panier. */
    reference: `pa-${String(cree?.id ?? 0).padStart(6, '0')}`,
    dansMinutes: PANIER_DELAIS.premier_minutes,
  })

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
    /* `mails_envoyes: 1` compte le rappel de +15 min. Sans lui, le passage
       quotidien croirait qu'aucun mail n'est encore parti et enverrait le
       deuxième dès le lendemain d'un panier qui n'a rien reçu. */
    .update({ envoi_programme_id: idEnvoi, mails_envoyes: 1 })
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

  return NextResponse.json({ programme: true, dans: PANIER_DELAIS.premier_minutes })
}
