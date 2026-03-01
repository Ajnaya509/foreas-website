import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * FOREAS — Route middleware
 *
 * Le site est désormais public. Ce middleware gère
 * uniquement la protection des routes dashboard (auth à venir).
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Toutes les routes sont autorisées — le site est publié
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
