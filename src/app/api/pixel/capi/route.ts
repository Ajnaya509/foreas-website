import { NextRequest, NextResponse } from 'next/server'
import { sendCAPIEvent, type CAPIEventName, type CAPIUserData, type CAPICustomData } from '@/lib/meta-capi'

export const runtime = 'nodejs'

/**
 * Endpoint CAPI Meta — miroir server-side des events pixel.
 *
 * Le client appelle cet endpoint en parallèle du pixel JS (fbq).
 * Meta déduplique via event_id (UUID partagé entre pixel et CAPI).
 *
 * Payload attendu (JSON) :
 *   {
 *     eventName: 'Lead' | 'Purchase' | ...,
 *     eventId: 'uuid-unique-partage-avec-pixel',
 *     eventSourceUrl: 'https://foreas.xyz/tarifs2',
 *     userData: { email, phone, ... },   // PII hashée server-side avant envoi Meta
 *     customData: { value, currency, ... }
 *   }
 *
 * Cookies Meta (fbc, fbp) lus automatiquement depuis la request — pas besoin de les passer.
 */

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      eventName?: CAPIEventName
      eventId?: string
      eventSourceUrl?: string
      userData?: CAPIUserData
      customData?: CAPICustomData
    }

    if (!body.eventName) {
      return NextResponse.json({ error: 'missing_event_name' }, { status: 400 })
    }

    // Récupérer IP + user-agent pour enrichir le matching Meta
    const forwardedFor = request.headers.get('x-forwarded-for') || ''
    const clientIp = forwardedFor.split(',')[0]?.trim() || request.headers.get('x-real-ip') || undefined
    const clientUa = request.headers.get('user-agent') || undefined

    // Récupérer cookies fbc / fbp
    const cookieHeader = request.headers.get('cookie') || ''
    const fbcMatch = cookieHeader.match(/_fbc=([^;]+)/)
    const fbpMatch = cookieHeader.match(/_fbp=([^;]+)/)
    const fbc = fbcMatch?.[1]
    const fbp = fbpMatch?.[1]

    const enrichedUserData: CAPIUserData = {
      ...(body.userData || {}),
      clientIpAddress: clientIp,
      clientUserAgent: clientUa,
      fbc: fbc || body.userData?.fbc,
      fbp: fbp || body.userData?.fbp,
    }

    const result = await sendCAPIEvent({
      eventName: body.eventName,
      eventId: body.eventId,
      eventSourceUrl: body.eventSourceUrl,
      userData: enrichedUserData,
      customData: body.customData,
    })

    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 200 })
      // 200 pour ne pas générer d'erreurs JS côté client si CAPI pas configuré
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[pixel/capi] Error:', (error as Error).message)
    return NextResponse.json({ ok: false, error: 'internal' }, { status: 200 })
  }
}
