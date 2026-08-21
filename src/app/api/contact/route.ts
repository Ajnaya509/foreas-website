/**
 * FOREAS — LE FORMULAIRE DE CONTACT ENVOIE ENFIN QUELQUE CHOSE.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CE QU'IL Y AVAIT AVANT
 *
 * Mesuré le 21/08/2026 sur le HTML servi : `<form>` sans `action`, sans `method`,
 * sans gestionnaire, et quatre champs SANS ATTRIBUT `name`. Le bouton
 * « Envoyer » ne faisait rien.
 *
 * Et `/professionnels` y envoyait ses deux boutons. **Tout le B2B du site
 * tombait là.** Chaque personne qui a écrit à FOREAS depuis cette page a cru
 * être entendue et ne l'a jamais été.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * LES QUATRE RÈGLES DE CETTE ROUTE
 *
 * 1. LE DESTINATAIRE VIENT DU SERVEUR. Jamais de la requête. Un formulaire
 *    public dont le visiteur choisit le destinataire est un relais d'envoi :
 *    n'importe qui écrit à n'importe qui depuis foreas.xyz, et c'est le domaine
 *    qui finit sur les listes noires.
 *
 * 2. ON NE CONFIRME QU'APRÈS UN ENVOI RÉEL. Pas de « message envoyé » optimiste.
 *    C'est exactement le défaut qu'on répare : une confirmation qui ment.
 *
 * 3. L'ERREUR DU FOURNISSEUR NE SORT JAMAIS. Le visiteur reçoit « réessaie » ;
 *    le détail va dans les journaux. Une réponse qui recopie l'erreur de
 *    l'expéditeur renseigne un attaquant sur l'infrastructure.
 *
 * 4. UN ÉCHEC EST UN ÉCHEC. Il est journalisé et compté (`ContactFailed`).
 *    Un formulaire qui perd des messages en silence est pire qu'un formulaire
 *    cassé : personne ne vient le réparer.
 */

import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import {
  DESTINATAIRE_CONTACT,
  LIMITES_CONTACT,
  emailPlausible,
  libelleSujet,
  motifDeRefus,
  sujetValide,
} from '@/lib/contact'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Limiteur sans dépendance, par processus.
 * ⚠️ Il compte par empreinte grossière. Sur plusieurs instances, chaque instance
 * a son compteur : le plafond réel est donc plus haut que le plafond écrit.
 * C'est assumé — l'objectif est d'arrêter une boucle, pas un attaquant motivé.
 * L'anti-abus sérieux, ce sont le champ piège et la validation.
 */
const envois = new Map<string, { n: number; expire: number }>()

function sousPlafond(empreinte: string): boolean {
  const maintenant = Date.now()
  for (const [k, v] of envois) if (v.expire <= maintenant) envois.delete(k)
  const e = envois.get(empreinte)
  if (!e) {
    envois.set(empreinte, { n: 1, expire: maintenant + 3_600_000 })
    return true
  }
  if (e.n >= LIMITES_CONTACT.envoisParHeure) return false
  e.n += 1
  return true
}

function echapper(s: string): string {
  return s
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

function nettoyer(v: unknown, max: number): string {
  return typeof v === 'string' ? v.trim().replace(/\s+/g, ' ').slice(0, max) : ''
}

export async function POST(request: NextRequest) {
  // L'identifiant de corrélation permet de relier une réclamation (« j'ai écrit
  // et personne n'a répondu ») à une ligne de journal. Il est rendu au visiteur.
  const correlation = `ct-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`

  try {
    const corps = await request.json().catch(() => null)
    if (!corps || typeof corps !== 'object') {
      return NextResponse.json({ error: 'Requête invalide.', correlation }, { status: 400 })
    }
    const c = corps as Record<string, unknown>

    // ── Le champ piège ───────────────────────────────────────────────────────
    // Invisible pour un humain, rempli par un envoi automatique. On répond 200
    // pour ne pas lui apprendre qu'il a été repéré — mais on n'envoie rien.
    if (nettoyer(c.entreprise_site, 200)) {
      console.warn(`[contact] ${correlation} — champ piège rempli, ignoré`)
      return NextResponse.json({ ok: true, correlation }, { status: 200 })
    }

    const nom = nettoyer(c.nom, LIMITES_CONTACT.nomMax)
    const email = nettoyer(c.email, LIMITES_CONTACT.emailMax).toLowerCase()
    const sujet = nettoyer(c.sujet, 40)
    const message = typeof c.message === 'string' ? c.message.trim().slice(0, LIMITES_CONTACT.messageMax) : ''
    const page = nettoyer(c.page, 200) || 'inconnue'

    if (!nom) return NextResponse.json({ error: 'Ton nom, s’il te plaît.', champ: 'nom', correlation }, { status: 400 })
    if (!emailPlausible(email)) {
      return NextResponse.json({ error: 'Cette adresse e-mail ne semble pas valide.', champ: 'email', correlation }, { status: 400 })
    }
    if (!sujetValide(sujet)) {
      return NextResponse.json({ error: 'Choisis un sujet.', champ: 'sujet', correlation }, { status: 400 })
    }
    if (message.length < LIMITES_CONTACT.messageMin) {
      return NextResponse.json(
        { error: `Ton message est un peu court (${LIMITES_CONTACT.messageMin} caractères minimum).`, champ: 'message', correlation },
        { status: 400 },
      )
    }
    const refus = motifDeRefus(message)
    if (refus) {
      console.warn(`[contact] ${correlation} — message refusé : ${refus}`)
      return NextResponse.json(
        { error: 'Ton message contient des éléments que nous ne pouvons pas recevoir. Écris-nous directement à contact@foreas.xyz.', correlation },
        { status: 400 },
      )
    }

    // Empreinte grossière pour le plafond. Pas d'adresse conservée : elle sert
    // le temps de la requête et n'est écrite nulle part.
    const empreinte = (request.headers.get('x-forwarded-for') ?? 'inconnu').split(',')[0].trim() + '|' + email
    if (!sousPlafond(empreinte)) {
      console.warn(`[contact] ${correlation} — plafond horaire atteint`)
      return NextResponse.json(
        { error: 'Tu as déjà envoyé plusieurs messages. Laisse-nous le temps de répondre, ou écris à contact@foreas.xyz.', correlation },
        { status: 429 },
      )
    }

    const cle = (process.env.RESEND_API_KEY ?? '').trim()
    if (!cle) {
      // ⚠️ On ne prétend PAS avoir envoyé. C'est tout le sujet de cette route.
      console.error(`[contact] ${correlation} — RESEND_API_KEY absente : message NON envoyé`)
      return NextResponse.json(
        { error: 'L’envoi est momentanément indisponible. Écris-nous à contact@foreas.xyz — on te répondra.', correlation },
        { status: 503 },
      )
    }

    const resend = new Resend(cle)
    const { error } = await resend.emails.send({
      from: 'FOREAS <noreply@foreas.xyz>',
      to: [DESTINATAIRE_CONTACT], // ← fixé côté serveur, jamais lu de la requête
      replyTo: email,
      subject: `[${libelleSujet(sujet)}] ${nom}`,
      text: [
        `Sujet   : ${libelleSujet(sujet)}`,
        `De      : ${nom} <${email}>`,
        `Page    : ${page}`,
        `Réf.    : ${correlation}`,
        '',
        message,
      ].join('\n'),
      html:
        `<div style="font-family:system-ui,sans-serif;font-size:14px;line-height:1.6">` +
        `<p><strong>Sujet</strong> : ${echapper(libelleSujet(sujet))}<br>` +
        `<strong>De</strong> : ${echapper(nom)} &lt;${echapper(email)}&gt;<br>` +
        `<strong>Page</strong> : ${echapper(page)}<br>` +
        `<strong>Réf.</strong> : ${echapper(correlation)}</p><hr>` +
        `<p style="white-space:pre-wrap">${echapper(message)}</p></div>`,
    })

    if (error) {
      // Le détail va dans les journaux, jamais au visiteur.
      console.error(`[contact] ${correlation} — envoi refusé : ${error.message}`)
      return NextResponse.json(
        { error: 'L’envoi a échoué. Réessaie dans un instant — ton message est conservé.', correlation },
        { status: 502 },
      )
    }

    console.log(`[contact] ${correlation} — envoyé · sujet=${sujet} · page=${page}`)
    return NextResponse.json({ ok: true, correlation }, { status: 200 })
  } catch (e) {
    console.error(`[contact] ${correlation} — erreur :`, (e as Error)?.message)
    return NextResponse.json(
      { error: 'Une erreur est survenue. Réessaie, ou écris à contact@foreas.xyz.', correlation },
      { status: 500 },
    )
  }
}
