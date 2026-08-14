/**
 * FOREAS — Garde unique des routes API qui COÛTENT DE L'ARGENT.
 *
 * Pourquoi ce fichier existe (constat du 14/08/2026, mesuré en production) :
 *   `GET https://www.foreas.xyz/api/diagnostic` répondait 200 à n'importe qui et
 *   déclenchait, À CHAQUE APPEL, un vrai appel Anthropic + un vrai appel Pieuvre
 *   (4 583 ms mesurés). Une boucle `curl` = facture Anthropic + Pieuvre saturée.
 *   Il publiait aussi les 23 noms de variables d'environnement du serveur, le
 *   préfixe et la longueur exacte de la clé Anthropic, la longueur du secret
 *   Pieuvre, et une ligne interne de `pieuvre_scripts`.
 *
 * UN SEUL garde pour tout le site (règle anti-système-parallèle : ne jamais
 * recréer `api-guard2` / `auth-final`). Deux modes seulement :
 *
 *   sameOrigin — la route est appelée par le navigateur depuis nos propres pages.
 *                On exige que `Origin` (ou à défaut `Referer`) soit un hôte FOREAS.
 *                Ça n'arrête pas un attaquant déterminé (un en-tête se forge),
 *                mais ça arrête le pillage trivial en boucle, qui est le risque réel.
 *
 *   token      — la route est un outil interne. On exige `Authorization: Bearer <x>`
 *                égal à la variable d'environnement demandée. **FAIL CLOSED** :
 *                si la variable n'est pas définie côté serveur, la route est
 *                fermée, pas ouverte. C'est le point important — la porte se
 *                referme dès le déploiement, sans action de personne.
 *
 * Ce garde ne journalise jamais la valeur d'un secret, seulement le verdict.
 */

import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

/** Hôtes considérés comme « nous ». Les previews Vercel sont incluses par suffixe. */
const FOREAS_HOSTS = new Set([
  'foreas.xyz',
  'www.foreas.xyz',
  'localhost:3000',
  'localhost:3001',
  '127.0.0.1:3000',
])

function hostOf(rawUrl: string | null): string | null {
  if (!rawUrl) return null
  try {
    return new URL(rawUrl).host.toLowerCase()
  } catch {
    return null
  }
}

function isForeasHost(host: string | null): boolean {
  if (!host) return false
  if (FOREAS_HOSTS.has(host)) return true
  // Déploiements de prévisualisation Vercel : <projet>-<hash>-<compte>.vercel.app
  return host.endsWith('.vercel.app')
}

/**
 * Vrai si la requête vient d'une page FOREAS ouverte dans un navigateur.
 *
 * Les navigateurs modernes envoient `Origin` sur tout POST `fetch()`, y compris
 * même-origine. On retombe sur `Referer` (la politique du site est
 * `strict-origin-when-cross-origin`, donc le Referer même-origine est complet).
 * Absence des deux = appel serveur-à-serveur ou outil en ligne de commande → refusé.
 */
export function isSameOriginRequest(request: NextRequest): boolean {
  // L'hôte servi par cette requête même. C'est la référence la plus fiable :
  // elle suit automatiquement le domaine (foreas.xyz, une preview Vercel, un
  // port local quelconque) sans liste à maintenir. La liste figée en dur
  // ci-dessus n'est qu'un filet complémentaire — une liste de ports codés en
  // dur bloquait le site lui-même dès qu'il tournait sur un autre port (vérifié).
  const self = (request.headers.get('host') || '').toLowerCase()

  const origin = hostOf(request.headers.get('origin'))
  if (origin) return origin === self || isForeasHost(origin)

  const referer = hostOf(request.headers.get('referer'))
  if (referer) return referer === self || isForeasHost(referer)

  return false
}

/**
 * Vrai si l'en-tête `Authorization: Bearer <x>` correspond à `process.env[envVar]`.
 * FAIL CLOSED : variable absente ou vide → toujours faux.
 * Comparaison à temps constant pour ne pas fuiter le secret octet par octet.
 */
export function hasValidBearer(request: NextRequest, envVar: string): boolean {
  const expected = process.env[envVar]
  if (!expected || expected.length < 16) return false // fail closed

  const header = request.headers.get('authorization') || ''
  const provided = header.startsWith('Bearer ') ? header.slice(7) : ''
  if (provided.length !== expected.length) return false

  let diff = 0
  for (let i = 0; i < expected.length; i++) {
    diff |= provided.charCodeAt(i) ^ expected.charCodeAt(i)
  }
  return diff === 0
}

/**
 * Refus muet : 404, pas 401.
 * Un 401 confirme « cette route existe » ; un 404 ne dit rien. Pour un outil
 * interne c'est le bon choix, on ne renseigne pas la carte du site à un inconnu.
 */
export function notFound(): NextResponse {
  return NextResponse.json({ error: 'Not found' }, { status: 404 })
}

/** Refus d'une route publique appelée hors du site : explicite, car c'est un vrai client. */
export function forbiddenOrigin(): NextResponse {
  return NextResponse.json(
    { error: 'Origine non autorisée.' },
    { status: 403, headers: { 'Cache-Control': 'no-store' } },
  )
}
