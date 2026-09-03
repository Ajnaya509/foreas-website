import { NextRequest, NextResponse } from 'next/server'
import { isSameOriginRequest, forbiddenOrigin } from '@/lib/api-guard'
import { resolveSiteIdentity } from '@/lib/identityGate'
import { clientServeurOuNull } from '@/lib/supabaseServeur'
import { hasCurrentAdvertisingConsent } from '@/lib/advertisingConsentServer'
import { isUuid } from '@/lib/advertisingConsentContract'
import { consentementPublicitaire } from '@/lib/meta-capi'
import {
  sendTikTokEvent,
  type TikTokEventName,
  type TikTokCustomData,
} from '@/lib/tiktok-events-api'

export const runtime = 'nodejs'

const BROWSER_ALLOWED = new Set<TikTokEventName>([
  'ViewContent', 'InitiateCheckout', 'AddPaymentInfo', 'SubmitForm', 'Contact',
])

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) return forbiddenOrigin()
  try {
    const body = (await request.json()) as {
      eventName?: TikTokEventName
      eventId?: string
      customData?: TikTokCustomData
    }
    if (!body.eventName) {
      return NextResponse.json({ error: 'missing_event_name' }, { status: 400 })
    }
    // Un navigateur observe un geste. Il ne prouve ni paiement, ni abonnement,
    // ni inscription terminée.
    if (!BROWSER_ALLOWED.has(body.eventName)) {
      return NextResponse.json({ error: 'evenement_reserve_au_serveur' }, { status: 403 })
    }
    if (!body.eventId || !isUuid(body.eventId)) {
      return NextResponse.json({ error: 'event_id_invalid' }, { status: 400 })
    }

    const forwarded = request.headers.get('x-forwarded-for') || ''
    const cookieHeader = request.headers.get('cookie') || ''
    const identityId = await resolveSiteIdentity(request, { canal: 'site' })
    const sb = clientServeurOuNull()

    // Deux serrures : choix local courant ET verite privee P29 actuelle. La
    // seconde ferme aussi les autres appareils apres un retrait.
    if (!consentementPublicitaire(cookieHeader) ||
        !sb || !await hasCurrentAdvertisingConsent(sb, identityId)) {
      return NextResponse.json({ ok: false, skipped: 'consentement_courant_absent' })
    }

    const ttclid = cookieHeader.match(/_ttclid=([^;]+)/)?.[1]
    const ttp = cookieHeader.match(/_ttp=([^;]+)/)?.[1]
    const userData = {
      externalId: identityId,
      clientIpAddress: forwarded.split(',')[0]?.trim() || request.headers.get('x-real-ip') || undefined,
      clientUserAgent: request.headers.get('user-agent') || undefined,
      ttclid,
      ttp,
    }
    const result = await sendTikTokEvent({
      consentement: true,
      eventName: body.eventName,
      eventId: body.eventId,
      eventSourceUrl: request.headers.get('referer') || request.nextUrl.origin,
      userData,
      customData: body.customData,
    })
    return NextResponse.json(result.ok ? { ok: true } : { ok: false, error: result.error || result.skipped })
  } catch {
    return NextResponse.json({ ok: false, error: 'internal' }, { status: 200 })
  }
}
