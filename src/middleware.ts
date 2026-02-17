import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * FOREAS — Route protection middleware
 *
 * Toutes les pages publiques redirigent vers "/" (page "en construction")
 * sauf /509/* qui est la landing complète accessible par lien direct.
 *
 * Pour désactiver la protection : supprimer ce fichier ou commenter le redirect.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── Routes autorisées (pas de redirect) ──
  // /509 et ses sous-routes (landing privée)
  if (pathname.startsWith('/509')) return NextResponse.next()

  // / (page en construction elle-même)
  if (pathname === '/') return NextResponse.next()

  // Dashboard (chauffeur + partenaire)
  if (pathname.startsWith('/dashboard')) return NextResponse.next()

  // API routes (Stripe webhooks, waitlist, etc.)
  if (pathname.startsWith('/api')) return NextResponse.next()

  // Static assets (Next.js internals, fonts, images, favicon)
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/fonts') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/assets') ||
    pathname.includes('favicon') ||
    pathname.includes('sitemap') ||
    pathname.includes('robots')
  ) {
    return NextResponse.next()
  }

  // ── Tout le reste → redirect vers page en construction ──
  return NextResponse.redirect(new URL('/', request.url))
}

export const config = {
  // Run middleware on all routes except static files
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
