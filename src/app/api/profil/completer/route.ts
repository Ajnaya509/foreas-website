import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import Stripe from 'stripe'
import { clientServeurOuNull } from '@/lib/supabaseServeur'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * FOREAS — L'ÉCRAN 2 : LE PRÉNOM ET LE NUMÉRO, APRÈS LE PAIEMENT.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POURQUOI CE DÉCOUPAGE
 *
 * L'écran 1 ne demande que l'e-mail et la carte. Deux champs, pas quatre : c'est
 * la page qui encaisse, chaque question de plus s'y paie en abandons.
 *
 * ⚠️ ET POURQUOI L'E-MAIL RESTE À L'ÉCRAN 1, LUI.
 * Le 28/08, le formulaire n'avait AUCUN champ e-mail. Les paiements passaient
 * très bien — Stripe n'en exige pas. Mais le webhook enferme tout le
 * provisionnement dans `if (session.customer_details?.email)` : pas d'e-mail,
 * pas de compte, pas de mot de passe, pas d'alerte. Un chauffeur qui a payé et
 * que plus personne ne peut joindre, avec une carte qui sera débitée trois jours
 * plus tard. Descendre l'e-mail ici recréerait exactement cet état.
 *
 * Ce qui se perd à l'écran 2 est rattrapable : sans numéro, le compte existe
 * quand même, le mot de passe est parti, et une relance par e-mail peut aller
 * le chercher. C'est toute la différence.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⚠️ CE QUI AUTORISE L'ÉCRITURE
 *
 * L'identifiant de session Stripe, et rien d'autre. Il est long, il n'est connu
 * que de celui qui vient de payer, et on vérifie auprès de Stripe qu'il est
 * TERMINÉ avant d'écrire quoi que ce soit. On ne fait jamais confiance à
 * l'e-mail envoyé par le navigateur : c'est celui de la session qui décide
 * quelle ligne est modifiée. Sans cette règle, n'importe qui pourrait renommer
 * le compte de n'importe qui.
 */

const FORME_SESSION = /^cs_[A-Za-z0-9_]{10,}$/

/** Même liste blanche que `/api/checkout/coordonnees`. On décrit l'autorisé. */
function prenomValide(v: unknown): string | null {
  if (typeof v !== 'string') return null
  const t = v.trim().slice(0, 32)
  if (!/^[\p{L}][\p{L}'’\- ]{0,31}$/u.test(t)) return null
  return t.split(/\s+/).filter(Boolean).length <= 3 ? t : null
}

function telephoneValide(v: unknown): string | null {
  if (typeof v !== 'string') return null
  const t = v.trim().slice(0, 24)
  if (!/^\+?[0-9 .\-()]{8,24}$/.test(t)) return null
  const chiffres = t.replace(/\D/g, '')
  return chiffres.length >= 8 && chiffres.length <= 15 ? t : null
}

export async function POST(request: NextRequest) {
  const cle = (process.env.STRIPE_SECRET_KEY || '').replace(/\s/g, '')
  if (!cle) {
    console.warn('[profil] clé Stripe absente')
    return NextResponse.json({ error: 'indisponible' }, { status: 503 })
  }

  const corps = await request.json().catch(() => null)
  const c = (corps ?? {}) as Record<string, unknown>
  const idSession = typeof c.sessionId === 'string' ? c.sessionId.trim() : ''
  if (!FORME_SESSION.test(idSession)) {
    return NextResponse.json({ error: 'session_invalide' }, { status: 400 })
  }

  const prenom = prenomValide(c.prenom)
  const telephone = telephoneValide(c.telephone)
  if (!prenom || !telephone) {
    return NextResponse.json(
      { error: 'champs_invalides', prenom: !!prenom, telephone: !!telephone },
      { status: 400 },
    )
  }

  const stripe = new Stripe(cle, {
    apiVersion: '2025-08-27.basil',
    timeout: 8000,
    maxNetworkRetries: 1,
  })

  let email: string | null = null
  try {
    const session = await stripe.checkout.sessions.retrieve(idSession)
    /* ⚠️ ON EXIGE UNE SESSION TERMINÉE. Une session encore ouverte n'a prouvé
       aucun paiement : écrire dessus reviendrait à laisser n'importe qui poser
       un numéro sur un compte en cours de création. */
    if (session.status !== 'complete') {
      return NextResponse.json({ error: 'session_non_terminee' }, { status: 409 })
    }
    email = session.customer_details?.email ?? null
  } catch (e) {
    console.error('[profil] session illisible :', (e as Error)?.message)
    return NextResponse.json({ error: 'session_introuvable' }, { status: 404 })
  }

  if (!email) {
    /* Ne devrait pas arriver : l'écran 1 exige l'e-mail. Si ça arrive quand
       même, on le dit fort — c'est le signe que le découpage a été contourné. */
    console.error(`[profil] ⛔ session ${idSession} TERMINÉE SANS E-MAIL — profil impossible à rattacher`)
    return NextResponse.json({ error: 'sans_email' }, { status: 409 })
  }

  const sb = clientServeurOuNull()
  if (!sb) {
    console.error('[profil] base injoignable — profil NON enregistré')
    return NextResponse.json({ error: 'indisponible' }, { status: 503 })
  }

  const maintenant = new Date().toISOString()

  const { data: lignes, error: erreurAbonne } = await sb
    .from('subscribers')
    .update({
      name: prenom,
      phone: telephone,
      profil_complete_le: maintenant,
      updated_at: maintenant,
    })
    .eq('email', email)
    .select('id')

  if (erreurAbonne) {
    console.error(`[profil] écriture abonné impossible : ${erreurAbonne.code} ${erreurAbonne.message}`)
    return NextResponse.json({ error: 'ecriture_impossible' }, { status: 500 })
  }
  if (!lignes || lignes.length === 0) {
    /* ⚠️ AUCUNE LIGNE TOUCHÉE N'EST UN ÉCHEC, PAS UN SUCCÈS.
       Le webhook n'a peut-être pas encore écrit l'abonné — il tourne en
       parallèle. On répond 409 pour que l'écran propose de réessayer, au lieu
       d'afficher une confirmation pour une écriture qui n'a rien touché. */
    console.warn(`[profil] aucune ligne d'abonné pour cette session — le webhook a-t-il déjà écrit ?`)
    return NextResponse.json({ error: 'abonne_pas_encore_cree' }, { status: 409 })
  }

  /* Le prénom doit aussi arriver dans le compte lui-même : c'est CE champ que
     l'app lit à sa première ouverture. L'échec ici n'annule pas le reste — le
     numéro, lui, est déjà enregistré. */
  try {
    const { data: utilisateurs } = await sb.auth.admin.listUsers({ page: 1, perPage: 200 })
    const compte = utilisateurs?.users?.find(
      (u) => (u.email || '').toLowerCase() === email.toLowerCase(),
    )
    if (compte) {
      await sb.auth.admin.updateUserById(compte.id, {
        user_metadata: {
          ...(compte.user_metadata || {}),
          full_name: prenom,
          phone: telephone,
        },
      })
    } else {
      console.warn('[profil] compte introuvable — le prénom ne sera pas dans l’app')
    }
  } catch (e) {
    console.error('[profil] mise à jour du compte impossible :', (e as Error)?.message)
  }

  console.log('[profil] écran 2 complété')
  return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } })
}
