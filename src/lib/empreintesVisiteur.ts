import { createHmac } from 'node:crypto'
import type { NextRequest } from 'next/server'

/**
 * LES EMPREINTES DU VISITEUR — pour le reconnaître quand son badge a disparu.
 *
 * Demandé par le fil Pieuvre le 06/09. `resolve_identity_v2` s'en sert pour
 * retrouver une fiche existante : navigation privée, badge effacé, autre
 * navigateur. Prouvé de leur côté : la même personne, sans badge, avec le seul
 * `ip_ua_hash`, retombe sur la bonne fiche.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CE QUI EST TENU ICI, ET NULLE PART AILLEURS
 *
 * 1. LE CALCUL EST SERVEUR. L'adresse IP et le navigateur ne sont lisibles que
 *    d'ici. Une empreinte fabriquée par le navigateur ne vaudrait rien : il
 *    suffirait de recopier celle d'un autre.
 *
 * 2. RIEN NE PART EN CLAIR. Une adresse IP est une donnée personnelle. Son
 *    empreinte salée, elle, ne se remonte pas — elle sert à COMPARER, pas à
 *    savoir. Le sel n'est connu que du serveur.
 *
 * 3. SANS SEL, ON N'ENVOIE RIEN. Un hachage sans sel se devine (il y a
 *    4 milliards d'adresses, une table les couvre toutes), et il donnerait la
 *    même valeur chez tout le monde. Si la clé manque, la fonction rend `null`
 *    et l'appel part sans empreintes : la reconnaissance est perdue, la
 *    confidentialité non. C'est le bon sens de la panne.
 *
 * 4. `ip_ua_hash` D'ABORD, ET C'EST LE FIL PIEUVRE QUI L'A DEMANDÉ AINSI :
 *    l'IP SEULE colle ensemble deux personnes du même wifi ou du même opérateur
 *    mobile. Leur fonction le sait — elle donne à l'IP seule une confiance de
 *    0,3, en dessous du seuil de fusion (0,9). Une empreinte faible RETROUVE,
 *    elle ne PROUVE jamais.
 *
 * ⚠️ ON RÉUTILISE LA CLÉ DE PASSAGE EXISTANTE (`PASSAGE_HMAC_SECRET`, repli
 * `OBSERVE_HMAC_SALT`). Aucune nouvelle clé à poser : une clé de plus, c'est
 * une clé de plus à tourner, et une de plus à oublier.
 */

export type EmpreintesVisiteur = {
  visitor_id?: string
  device_id?: string
  ip_ua_hash?: string
  ip_hash?: string
  ua_hash?: string
}

function sel(): string {
  return (process.env.PASSAGE_HMAC_SECRET || process.env.OBSERVE_HMAC_SALT || '').trim()
}

function empreinte(cle: string, valeur: string): string {
  return createHmac('sha256', cle).update(valeur).digest('hex')
}

/**
 * ⚠️ L'ADRESSE VIENT DE L'HÉBERGEUR, PAS DE `x-forwarded-for` BRUT.
 * N'importe qui peut écrire cet en-tête. Vercel pose `x-real-ip` lui-même et
 * réécrit `x-forwarded-for` ; on préfère le premier, et on ne prend que la
 * PREMIÈRE valeur de la liste si on doit s'en servir — les suivantes sont
 * celles que l'appelant a bien voulu ajouter.
 */
function adresseDe(request: NextRequest): string | null {
  const direct = request.headers.get('x-real-ip')?.trim()
  if (direct) return direct
  const chaine = request.headers.get('x-forwarded-for')
  const premier = chaine?.split(',')[0]?.trim()
  return premier || null
}

export function empreintesDuVisiteur(
  request: NextRequest,
  ids: { visitorId?: string | null; deviceCookieId?: string | null },
): EmpreintesVisiteur | null {
  const cle = sel()
  const ip = adresseDe(request)
  const ua = request.headers.get('user-agent')?.trim() || null

  const e: EmpreintesVisiteur = {}
  if (ids.deviceCookieId) e.visitor_id = ids.deviceCookieId
  if (ids.visitorId) e.device_id = ids.visitorId

  /* Les trois empreintes calculées n'existent QUE si le sel existe. Les deux
     identifiants au-dessus ne sont pas hachés : ce sont déjà des jetons
     opaques, sans rien de personnel dedans, et la Pieuvre les compare tels
     quels depuis toujours. */
  if (cle) {
    if (ip && ua) e.ip_ua_hash = empreinte(cle, `${ip}|${ua}`)
    if (ip) e.ip_hash = empreinte(cle, ip)
    if (ua) e.ua_hash = empreinte(cle, ua)
  }

  return Object.keys(e).length ? e : null
}
