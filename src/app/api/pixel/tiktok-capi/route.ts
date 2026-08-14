import { NextRequest, NextResponse } from 'next/server'
import { isSameOriginRequest, forbiddenOrigin } from '@/lib/api-guard'
import { sendTikTokEvent, type TikTokEventName, type TikTokUserData, type TikTokCustomData } from '@/lib/tiktok-events-api'

export const runtime = 'nodejs'

/**
 * Endpoint Events API TikTok — miroir server-side du pixel client (ttq).
 * Structure identique à /api/pixel/capi (Meta) : le client appelle cet endpoint en
 * parallèle du pixel JS, TikTok déduplique via event_id (UUID partagé).
 *
 * Payload attendu (JSON) :
 *   {
 *     eventName: 'SubmitForm' | 'CompletePayment' | ...,
 *     eventId: 'uuid-unique-partage-avec-pixel',
 *     eventSourceUrl: 'https://foreas.xyz/tarifs2',
 *     userData: { email, phone, ... },   // PII hashée server-side avant envoi TikTok
 *     customData: { value, currency, ... }
 *   }
 *
 * Cookies TikTok (_ttclid, _ttp) lus automatiquement depuis la request.
 */

export async function POST(request: NextRequest) {
  // GARDE 14/08/2026 — Même raison que /api/pixel/capi : une route de conversion ouverte est un canal
  // d'injection dans le compte publicitaire.
  // Appelée uniquement par nos propres pages : un appel sans origine FOREAS
  // n'a aucune raison d'exister.
  if (!isSameOriginRequest(request)) {
    return forbiddenOrigin()
  }

  try {
    const body = (await request.json()) as {
      eventName?: TikTokEventName
      eventId?: string
      eventSourceUrl?: string
      userData?: TikTokUserData
      customData?: TikTokCustomData
    }

    if (!body.eventName) {
      return NextResponse.json({ error: 'missing_event_name' }, { status: 400 })
    }

    const forwardedFor = request.headers.get('x-forwarded-for') || ''
    const clientIp = forwardedFor.split(',')[0]?.trim() || request.headers.get('x-real-ip') || undefined
    const clientUa = request.headers.get('user-agent') || undefined

    const cookieHeader = request.headers.get('cookie') || ''
    const ttclidMatch = cookieHeader.match(/_ttclid=([^;]+)/)
    const ttpMatch = cookieHeader.match(/_ttp=([^;]+)/)

    const enrichedUserData: TikTokUserData = {
      ...(body.userData || {}),
      clientIpAddress: clientIp,
      clientUserAgent: clientUa,
      ttclid: ttclidMatch?.[1] || body.userData?.ttclid,
      ttp: ttpMatch?.[1] || body.userData?.ttp,
    }

    const result = await sendTikTokEvent({
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
    console.error('[pixel/tiktok-capi] Error:', (error as Error).message)
    return NextResponse.json({ ok: false, error: 'internal' }, { status: 200 })
  }
}
