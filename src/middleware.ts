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
  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
