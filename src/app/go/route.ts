import { NextResponse } from 'next/server'
import { headers } from 'next/headers'

export async function GET() {
  const headersList = await headers()
  const ua = headersList.get('user-agent') || ''

  const isIOS = /iPhone|iPad|iPod/i.test(ua)
  const isAndroid = /Android/i.test(ua)

  if (isIOS) {
    return NextResponse.redirect('https://apps.apple.com/app/foreas-driver/id[APP_ID]', 307)
  } else if (isAndroid) {
    return NextResponse.redirect('https://play.google.com/store/apps/details?id=com.foreas.driver', 307)
  } else {
    return NextResponse.redirect(new URL('/go/desktop', 'https://foreas.xyz'), 307)
  }
}
