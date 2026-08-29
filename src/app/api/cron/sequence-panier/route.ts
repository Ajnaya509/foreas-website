import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { clientServeurOuNull } from '@/lib/supabaseServeur'
import { envoyerMailPanier, sendRecapProfilsEmail } from '@/lib/email'
import {
  panierAbandonneActif,
  PANIER_DELAIS,
  PANIER_NOMBRE_DE_MAILS,
} from '@/lib/textesAutomatiques'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * FOREAS — LA SUITE DE LA SÉQUENCE PANIER ABANDONNÉ (mails 2 et 3).
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * QUI EST CONCERNÉ, ET QUI NE L'EST PLUS
 *
 * ⚠️ UNIQUEMENT CEUX QUI N'ONT PAS PAYÉ. Ils ont tapé leur e-mail sur
 * `/tarifs3` et se sont arrêtés avant la carte.
 *
 * ⚠️ CE FICHIER RELANÇAIT LES PAYANTS JUSQU'AU 29/08. Chandler l'a corrigé :
 * « tu DOIS envoyer aux gens qui n'ont pas payé ». Relancer quelqu'un qui vient
 * de donner sa carte pour qu'il finisse un formulaire, c'est du harcèlement
 * administratif. Le suivi des profils incomplets reste — dans le compte rendu
 * du matin, comme une mesure, plus comme une relance.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * LE MAIL 1 NE PASSE PAS PAR ICI
 *
 * Il part à +15 minutes, programmé chez Resend au moment de la saisie. Aucun
 * planificateur ne tourne aussi souvent, et le forfait Vercel n'en autorise
 * qu'un par jour. Ce fichier ne s'occupe que des mails 2 (J+1) et 3 (J+7).
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⚠️ LA MARQUE EST POSÉE AVANT L'ENVOI, PAS APRÈS
 *
 * Si l'envoi échoue à mi-lot et que le planificateur repasse, une marque posée
 * après aurait laissé repartir tout le lot — donc des doublons chez ceux qui
 * avaient déjà reçu. On préfère perdre un mail que d'en envoyer deux : le
 * premier s'oublie, le second fait fermer.
 */

/** Un lot borné : le planificateur repassera demain pour le reste. */
const LOT_MAX = 50

export async function GET(request: NextRequest) {
  /**
   * ⚠️ QUI A LE DROIT DE DÉCLENCHER ÇA.
   * `CRON_SECRET` est la bonne réponse : Vercel l'envoie en `Authorization`.
   * Sans lui, on accepte l'en-tête que seule la plateforme pose — et on le DIT,
   * parce qu'un en-tête se recopie et que ce repli n'est pas une protection.
   */
  const secret = process.env.CRON_SECRET
  if (secret) {
    if ((request.headers.get('authorization') || '') !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'refuse' }, { status: 401 })
    }
  } else if (!request.headers.get('x-vercel-cron')) {
    return NextResponse.json({ error: 'refuse' }, { status: 401 })
  } else {
    console.warn(
      '[sequence-panier] CRON_SECRET absent — appel accepté sur le seul en-tête de ' +
        "plateforme. Ce n'est pas une protection : poser CRON_SECRET dans Vercel.",
    )
  }

  const sb = clientServeurOuNull()
  if (!sb) {
    console.error('[sequence-panier] base injoignable — aucun mail traité')
    return NextResponse.json({ error: 'indisponible' }, { status: 503 })
  }

  const maintenant = Date.now()
  const jour = 24 * 3600 * 1000
  const seuil2 = new Date(maintenant - PANIER_DELAIS.deuxieme_jours * jour).toISOString()
  const seuil3 = new Date(maintenant - PANIER_DELAIS.troisieme_jours * jour).toISOString()
  /* Deux mails ne partent jamais le même jour au même chauffeur, même si les
     délais étaient rapprochés par erreur. */
  const ilYa20h = new Date(maintenant - 20 * 3600 * 1000).toISOString()

  const { data: paniers, error } = await sb
    .from('paniers_abandonnes')
    .select('id, email, capture_le, mails_envoyes, dernier_mail_le')
    .is('converti_le', null)
    .lt('mails_envoyes', PANIER_NOMBRE_DE_MAILS)
    .gte('mails_envoyes', 1)
    .order('capture_le', { ascending: true })
    .limit(LOT_MAX)

  if (error) {
    console.error(`[sequence-panier] lecture impossible : ${error.code} ${error.message}`)
    return NextResponse.json({ error: 'lecture_impossible' }, { status: 500 })
  }

  const aEnvoyer = (paniers || []).filter((p) => {
    if (p.dernier_mail_le && p.dernier_mail_le > ilYa20h) return false
    if (p.mails_envoyes === 1) return p.capture_le < seuil2
    if (p.mails_envoyes === 2) return p.capture_le < seuil3
    return false
  })

  /* ⚠️ ÉTEINT PAR DÉFAUT. Ces textes partent au nom de FOREAS vers des gens qui
     n'ont rien acheté. Tant que `PANIER_ABANDONNE_ACTIF` n'est pas allumé, on
     compte, on le dit dans le compte rendu, et on n'envoie rien. */
  const envoiAutorise = panierAbandonneActif()

  let envoyes = 0
  let echecs = 0

  for (const p of envoiAutorise ? aEnvoyer : []) {
    const rang = ((p.mails_envoyes ?? 1) + 1) as 2 | 3

    const { error: erreurMarque } = await sb
      .from('paniers_abandonnes')
      .update({ mails_envoyes: rang, dernier_mail_le: new Date().toISOString() })
      .eq('id', p.id)
      /* La condition sur l'ancienne valeur fait l'arbitrage : deux exécutions
         simultanées ne peuvent pas envoyer le même rang deux fois. */
      .eq('mails_envoyes', p.mails_envoyes ?? 1)

    if (erreurMarque) {
      console.warn('[sequence-panier] marque refusée — passage concurrent probable')
      continue
    }

    if (!p.email) {
      console.warn(`[sequence-panier] panier ${p.id} sans adresse — rien à envoyer`)
      continue
    }

    const r = await envoyerMailPanier({
      email: p.email,
      rang,
      /* ⚠️ MÊME FORMAT QUE LA CAPTURE, ET SIX CARACTÈRES MINIMUM.
         `/wa` rejette en silence toute référence plus courte que six signes :
         « pa-1 » disparaîtrait, et Ajnaya recevrait le chauffeur sans contexte. */
      reference: `pa-${String(p.id).padStart(6, '0')}`,
    })
    if (r.envoye) envoyes += 1
    else echecs += 1
  }

  /* ═══════════════════════════════════════════════════════════════════════
     LE COMPTE RENDU DU SOIR.
     ⚠️ IL SE TAIT QUAND IL N'A RIEN À DIRE. Un rapport qui répète « zéro »
     chaque jour apprend à ne plus être ouvert, et le jour où il porte un vrai
     chiffre il est ignoré comme les autres. */
  const depuis24h = new Date(maintenant - jour).toISOString()

  const { count: payants } = await sb
    .from('subscribers')
    .select('id', { count: 'exact', head: true })
    .in('status', ['trialing', 'active'])

  const { count: profilsIncomplets } = await sb
    .from('subscribers')
    .select('id', { count: 'exact', head: true })
    .in('status', ['trialing', 'active'])
    .is('profil_complete_le', null)

  const { count: nouveauxDuJour } = await sb
    .from('subscribers')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', depuis24h)

  const { count: paniersOuverts } = await sb
    .from('paniers_abandonnes')
    .select('id', { count: 'exact', head: true })
    .is('converti_le', null)

  const { count: paniersDuJour } = await sb
    .from('paniers_abandonnes')
    .select('id', { count: 'exact', head: true })
    .gte('capture_le', depuis24h)

  const { count: paniersConvertisDuJour } = await sb
    .from('paniers_abandonnes')
    .select('id', { count: 'exact', head: true })
    .gte('converti_le', depuis24h)

  const aQuelqueChoseADire =
    (nouveauxDuJour ?? 0) > 0 || (paniersDuJour ?? 0) > 0 || (paniersOuverts ?? 0) > 0

  if (aQuelqueChoseADire) {
    await sendRecapProfilsEmail({
      payants: payants ?? 0,
      incomplets: profilsIncomplets ?? 0,
      nouveauxDuJour: nouveauxDuJour ?? 0,
      paniersOuverts: paniersOuverts ?? 0,
      paniersDuJour: paniersDuJour ?? 0,
      paniersConvertisDuJour: paniersConvertisDuJour ?? 0,
      mailsEnvoyes: envoyes,
      mailsEnEchec: echecs,
      sequenceEteinte: !envoiAutorise,
      enAttenteDEnvoi: aEnvoyer.length,
    })
  }

  console.log(
    `[sequence-panier] ${aEnvoyer.length} dus · ${envoyes} partis · ${echecs} en échec · ` +
      `${paniersOuverts ?? 0} paniers ouverts · ${payants ?? 0} payants`,
  )
  return NextResponse.json({
    sequenceActive: envoiAutorise,
    dus: aEnvoyer.length,
    envoyes,
    echecs,
    paniersOuverts: paniersOuverts ?? 0,
  })
}
