import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { clientServeurOuNull } from '@/lib/supabaseServeur'
import { sendProfilIncompletEmail, sendRecapProfilsEmail } from '@/lib/email'
import { relancesActives, DELAIS_JOURS, PLAFOND_RELANCES } from '@/lib/textesAutomatiques'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * FOREAS — ALLER CHERCHER CEUX QUI ONT PAYÉ SANS FINIR LEUR PROFIL.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * QUI EST CONCERNÉ
 *
 * Depuis le découpage en deux écrans, un chauffeur peut payer (écran 1 :
 * e-mail + carte), recevoir son compte et son mot de passe, puis fermer
 * l'onglet avant l'écran 2. Il a tout ce qu'il faut pour se connecter — il nous
 * manque son prénom et son numéro, donc Ajnaya ne peut pas l'appeler par son
 * nom ni le prévenir sur WhatsApp.
 *
 * On a son e-mail. C'est précisément pour ça que l'e-mail est resté à l'écran 1.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⚠️ DEUX RELANCES, PAS UNE DE PLUS
 *
 * La première à J+1 : c'est encore frais, il se souvient d'avoir payé.
 * La seconde six jours après : il a eu le temps d'ouvrir l'app et de comprendre
 * ce qu'il y gagne.
 * Ensuite on arrête. Le compteur `relances_profil_envoyees` est là pour ça —
 * avec la date seule, la relance repartirait tous les six jours, à vie.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⚠️ CE QUI EST ÉCRIT AVANT L'ENVOI, ET POURQUOI
 *
 * On marque la relance AVANT de l'envoyer, pas après. Si l'envoi échoue à
 * mi-parcours et que le planificateur repasse, une marque posée après aurait
 * laissé repartir tout le lot — donc des doublons chez ceux qui avaient déjà
 * reçu. On préfère perdre une relance que d'en envoyer deux : la première
 * s'oublie, la seconde agace.
 */

/* Le plafond, les délais et les textes vivent dans `textesAutomatiques.ts` :
   ce sont des décisions, pas des réglages techniques. Ici on les applique. */
/** Un lot borné : le planificateur repassera demain pour le reste. */
const LOT_MAX = 50

export async function GET(request: NextRequest) {
  /**
   * ⚠️ QUI A LE DROIT DE DÉCLENCHER ÇA.
   *
   * `CRON_SECRET` est la bonne réponse : Vercel l'envoie en `Authorization`
   * sur ses appels planifiés. S'il n'est pas configuré, on accepte l'en-tête
   * `x-vercel-cron` — que seule la plateforme pose sur ses propres appels — et
   * on le DIT dans les journaux, parce qu'un en-tête se recopie et que ce
   * repli n'est pas une protection.
   *
   * Le pire qu'un déclenchement abusif puisse faire reste borné : le plafond de
   * deux relances et les délais empêchent d'inonder qui que ce soit.
   */
  const secret = process.env.CRON_SECRET
  const autorisation = request.headers.get('authorization') || ''
  if (secret) {
    if (autorisation !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'refuse' }, { status: 401 })
    }
  } else if (!request.headers.get('x-vercel-cron')) {
    return NextResponse.json({ error: 'refuse' }, { status: 401 })
  } else {
    console.warn(
      '[relance-profil] CRON_SECRET absent — appel accepté sur le seul en-tête de plateforme. ' +
        "Ce n'est pas une protection : poser CRON_SECRET dans Vercel.",
    )
  }

  const sb = clientServeurOuNull()
  if (!sb) {
    console.error('[relance-profil] base injoignable — aucune relance traitée')
    return NextResponse.json({ error: 'indisponible' }, { status: 503 })
  }

  const maintenant = Date.now()
  const jour = 24 * 3600 * 1000
  const seuilPremiere = new Date(maintenant - DELAIS_JOURS.premiere * jour).toISOString()
  /* L'écart entre les deux relances, pas la date de la seconde : on compte à
     partir de la PREMIÈRE relance, pas du paiement. */
  const ecartSeconde = new Date(
    maintenant - Math.max(1, DELAIS_JOURS.seconde - DELAIS_JOURS.premiere) * jour,
  ).toISOString()

  const { data: candidats, error } = await sb
    .from('subscribers')
    .select('id, email, checkout_session_id, created_at, relances_profil_envoyees, relance_profil_envoyee_le')
    .is('profil_complete_le', null)
    /* Un abonnement mort n'a plus besoin de son numéro. */
    .in('status', ['trialing', 'active'])
    /* Pas de relance sur un paiement de moins de 24 h : il est peut-être encore
       sur la page, en train de remplir. */
    .lt('created_at', seuilPremiere)
    .lt('relances_profil_envoyees', PLAFOND_RELANCES)
    .order('created_at', { ascending: true })
    .limit(LOT_MAX)

  if (error) {
    console.error(`[relance-profil] lecture impossible : ${error.code} ${error.message}`)
    return NextResponse.json({ error: 'lecture_impossible' }, { status: 500 })
  }

  const aRelancer = (candidats || []).filter((c) => {
    /* La première relance n'attend rien de plus. La seconde attend six jours
       après la première — sinon les deux partiraient le même jour. */
    if ((c.relances_profil_envoyees ?? 0) === 0) return true
    return !!c.relance_profil_envoyee_le && c.relance_profil_envoyee_le < ecartSeconde
  })

  let envoyees = 0
  let echecs = 0

  /* ⚠️ ÉTEINT PAR DÉFAUT. Le texte de ces mails part au nom de FOREAS : il
     n'est pas à moi de décider qu'il est bon. Tant que Chandler n'a pas allumé
     `RELANCES_PROFIL_ACTIVES` dans Vercel, on compte, on prévient, on n'envoie
     rien. Le compte rendu du matin le dit — un interrupteur éteint qui se tait
     est un oubli définitif. */
  const envoiAutorise = relancesActives()

  for (const c of envoiAutorise ? aRelancer : []) {
    /* La marque AVANT l'envoi : voir l'en-tête de ce fichier. */
    const { error: erreurMarque } = await sb
      .from('subscribers')
      .update({
        relances_profil_envoyees: (c.relances_profil_envoyees ?? 0) + 1,
        relance_profil_envoyee_le: new Date().toISOString(),
      })
      .eq('id', c.id)
      .eq('relances_profil_envoyees', c.relances_profil_envoyees ?? 0)

    if (erreurMarque) {
      /* Quelqu'un d'autre est passé avant — deux exécutions en parallèle. On
         laisse la sienne faire, on ne double pas. */
      console.warn(`[relance-profil] marque refusée pour une ligne — passage concurrent probable`)
      continue
    }

    const parti = await sendProfilIncompletEmail({
      email: c.email,
      sessionId: c.checkout_session_id ?? null,
      rang: (c.relances_profil_envoyees ?? 0) + 1,
    })
    if (parti) envoyees += 1
    else echecs += 1
  }

  /* ═══════════════════════════════════════════════════════════════════════
     LE SUIVI, RENDU VISIBLE.

     ⚠️ UN SUIVI QU'ON NE VOIT PAS N'EXISTE PAS. Les colonnes en base disent
     tout, mais personne ne lit une base tous les matins. Le même passage
     quotidien qui relance envoie donc le compte rendu — c'est le seul moment
     où les chiffres sont déjà sous la main.

     ⚠️ ET IL SE TAIT QUAND IL N'A RIEN À DIRE. Un rapport quotidien qui répète
     « zéro, zéro, zéro » pendant trois semaines apprend à ne plus être ouvert —
     et le jour où il porte un vrai chiffre, il est ignoré comme les autres.
     On n'envoie que s'il s'est passé quelque chose. */
  const { count: payantsTotal } = await sb
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
    .gte('created_at', new Date(maintenant - 24 * 3600 * 1000).toISOString())

  const aQuelqueChoseADire = (nouveauxDuJour ?? 0) > 0 || (profilsIncomplets ?? 0) > 0
  if (aQuelqueChoseADire) {
    await sendRecapProfilsEmail({
      payants: payantsTotal ?? 0,
      incomplets: profilsIncomplets ?? 0,
      nouveauxDuJour: nouveauxDuJour ?? 0,
      relancesEnvoyees: envoyees,
      relancesEnEchec: echecs,
      relancesEteintes: !envoiAutorise,
      enAttenteDeRelance: aRelancer.length,
    })
  }

  console.log(
    `[relance-profil] ${aRelancer.length} à relancer · ${envoyees} parties · ${echecs} en échec · ` +
      `${payantsTotal ?? 0} payants dont ${profilsIncomplets ?? 0} sans profil`,
  )
  return NextResponse.json({
    relancesActives: envoiAutorise,
    candidats: aRelancer.length,
    envoyees,
    echecs,
    payants: payantsTotal ?? 0,
    incomplets: profilsIncomplets ?? 0,
    nouveauxDuJour: nouveauxDuJour ?? 0,
  })
}
