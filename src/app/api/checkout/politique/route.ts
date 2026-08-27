import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import {
  TUNNEL_SITE_IMMEDIAT,
  calculerDebitDuJour,
  type Formule,
} from '@/lib/politiquePaiement'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * FOREAS — « QU'EST-CE QUI SERA PRÉLEVÉ AUJOURD'HUI ? »
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POURQUOI CETTE ROUTE EXISTE
 *
 * Le brief de la page de paiement interdit une chose précise :
 *
 *     « ne jamais déduire l'essai dans le navigateur »
 *
 * Une page qui écrit « 0 € aujourd'hui » parce qu'un booléen posé dans son propre
 * code dit `false` ne confirme rien : elle se croit elle-même. Il faut que la
 * réponse vienne d'ailleurs que de la page qui l'affiche.
 *
 * Cette route est cet ailleurs. Elle répond, avec les constantes exactes que
 * `POST /api/checkout` utilise pour construire son `price_data` et son
 * `trial_end` : montant du jour, montant ensuite, date du premier vrai débit.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CE QU'ELLE NE FAIT PAS — ET C'EST VOLONTAIRE
 *
 * · Elle ne crée AUCUNE session Stripe, donc aucune transaction, même en test.
 * · Elle n'appelle pas Stripe du tout. Pas de clé lue, pas de clé exposée.
 *   Le dépôt a déjà publié un préfixe de clé secrète par un `GET /api/checkout`
 *   trop bavard (14/08). Cette route ne touche à aucun secret : elle ne peut pas
 *   en fuiter un.
 * · Elle ne modifie aucune règle de prix, d'essai ou d'abonnement. Elle les LIT.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⚠️ POURQUOI `no-store` N'EST PAS UNE PRÉCAUTION DÉCORATIVE
 *
 * La réponse contient `premierDebitISO` — une date calculée à partir de
 * maintenant. Mise en cache ne serait-ce qu'une heure, elle annoncerait au
 * chauffeur suivant une date de prélèvement fausse. Un montant peut se
 * mettre en cache ; une échéance, non.
 */

/** Liste fermée. Une chaîne inconnue est refusée, jamais devinée. */
const FORMULES: readonly Formule[] = ['mensuel', 'annuel']

function estFormule(v: string | null): v is Formule {
  return v !== null && (FORMULES as readonly string[]).includes(v)
}

export async function GET(request: NextRequest) {
  const demandee = request.nextUrl.searchParams.get('formule')

  if (!estFormule(demandee)) {
    return NextResponse.json(
      { error: 'formule_inconnue', formulesAcceptees: FORMULES },
      { status: 400, headers: { 'Cache-Control': 'no-store' } },
    )
  }

  const debit = calculerDebitDuJour(demandee, TUNNEL_SITE_IMMEDIAT, Date.now())

  return NextResponse.json(
    {
      ...debit,
      /**
       * Ce drapeau est lu par la page avant d'écrire quoi que ce soit sur
       * l'essai. Sans lui, la page ne pourrait pas distinguer « le serveur a
       * répondu qu'il n'y a pas d'essai » de « le serveur n'a pas répondu ».
       * Ces deux situations n'ont pas le même affichage.
       */
      confirmeParLeServeur: true,
    },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
