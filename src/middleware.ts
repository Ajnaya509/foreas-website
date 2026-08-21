import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * FOREAS — Route middleware
 *
 * 1. Site public (pas de gate).
 * 2. Pose un BADGE APPAREIL durable `foreas_vid` (1ère partie, httpOnly, 1 an) :
 *    ancre stable côté serveur pour le répertoire d'identité (identity_bridge).
 *    Survit à l'effacement du localStorage / fingerprint bloqué. Le serveur le lit
 *    sur chaque requête (API home-modal → funnel + Pieuvre).
 *    ⚠️ RGPD : l'USAGE tracking (envoi Pieuvre/Meta) doit rester gaté par le
 *    consentement (ConsentBanner). Le cookie lui-même est 1ère partie fonctionnel.
 */
const VID_COOKIE = 'foreas_vid'
const ONE_YEAR_SEC = 60 * 60 * 24 * 365
// Parrainage V3 : code parrain mémorisé quand un filleul arrive via /r/<code>.
// Lu au checkout (attribution MLM via client_reference_id + remise dynamique).
const REF_COOKIE = 'foreas_partner_ref'
const THIRTY_DAYS_SEC = 60 * 60 * 24 * 30

export function middleware(request: NextRequest) {
  const res = NextResponse.next()
  if (!request.cookies.get(VID_COOKIE)) {
    res.cookies.set(VID_COOKIE, crypto.randomUUID(), {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: ONE_YEAR_SEC,
      path: '/',
    })
  }

  // /r/<code> → mémorise le code parrain (attribution + remise checkout).
  const refMatch = request.nextUrl.pathname.match(/^\/r\/([^/]+)/)
  if (refMatch) {
    const code = decodeURIComponent(refMatch[1]).trim().toUpperCase().slice(0, 32)
    if (code) {
      res.cookies.set(REF_COOKIE, code, {
        httpOnly: false, // lisible client (afficher la remise) + lu serveur au checkout
        secure: true,
        sameSite: 'lax',
        maxAge: THIRTY_DAYS_SEC,
        path: '/',
      })
    }
  }

  return res
}

export const config = {
  // ⚠️ 21/08/2026 — `.well-known` A ÉTÉ AJOUTÉ À L'EXCLUSION.
  //
  // Sans lui, chaque appel à /.well-known/apple-app-site-association et à
  // /.well-known/assetlinks.json passait par ce filtre — donc posait un cookie
  // d'identité `foreas_vid` valable un an. Vérifié : deux appels consécutifs
  // renvoyaient deux identifiants DIFFÉRENTS.
  //
  // Ces deux fichiers sont lus par les systèmes d'Apple et de Google, pas par un
  // visiteur. Leur poser un badge de session n'a aucun sens, et transforme deux
  // fichiers statiques en autant d'invocations de filtre.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|\\.well-known).*)'],
}
