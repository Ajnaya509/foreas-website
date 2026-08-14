import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { boutiquePourAgent } from '@/lib/app-stores'

/**
 * /go — lien court universel (QR codes, campagnes, SMS).
 * Envoie vers la bonne boutique selon le téléphone ; sur ordinateur, vers /go/desktop
 * qui propose les deux.
 *
 * AVANT le 14/08/2026, les deux destinations étaient des HTTP 404 :
 * `id[APP_ID]` (un gabarit jamais rempli, parti en production) et `com.foreas.driver`
 * (un identifiant de paquet qui n'existe pas). Les vraies fiches — vérifiées 200 —
 * vivent maintenant dans src/lib/app-stores.ts, seul endroit où elles sont écrites.
 */
export async function GET() {
  const headersList = await headers()
  const boutique = boutiquePourAgent(headersList.get('user-agent'))

  if (boutique) {
    return NextResponse.redirect(boutique, 307)
  }
  return NextResponse.redirect(new URL('/go/desktop', 'https://www.foreas.xyz'), 307)
}
