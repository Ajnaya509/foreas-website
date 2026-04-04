import { NextResponse } from 'next/server'
import { headers } from 'next/headers'

const VALID_TOPICS = ['airbnb', 'surge', 'premium', 'optimisation', 'revenus', 'flotte', 'charges', 'aeroport', 'evenements', 'clients']

export async function GET(
  request: Request,
  { params }: { params: Promise<{ topic: string }> }
) {
  const { topic } = await params
  const headersList = await headers()
  const ua = headersList.get('user-agent') || ''

  const isIOS = /iPhone|iPad|iPod/i.test(ua)
  const isAndroid = /Android/i.test(ua)

  // Whitelist check — unknown topics redirect to landing page on desktop
  const deepLinkParam = `?deeplink=${encodeURIComponent(topic)}`

  if (isIOS) {
    return NextResponse.redirect(
      `https://apps.apple.com/app/foreas-driver/id[APP_ID]${deepLinkParam}`,
      307
    )
  } else if (isAndroid) {
    return NextResponse.redirect(
      `https://play.google.com/store/apps/details?id=com.foreas.driver${deepLinkParam}`,
      307
    )
  } else {
    // Desktop : redirect vers la landing page thématique si topic valide
    if (VALID_TOPICS.includes(topic)) {
      return NextResponse.redirect(new URL(`/${topic}`, 'https://foreas.xyz'), 307)
    }
    // Topic inconnu → page desktop générique
    return NextResponse.redirect(new URL('/go/desktop', 'https://foreas.xyz'), 307)
  }
}
