import { NextRequest, NextResponse } from 'next/server'
import { isSameOriginRequest, forbiddenOrigin } from '@/lib/api-guard'
import { resolveSiteIdentity } from '@/lib/identityGate'
import { clientServeurOuNull } from '@/lib/supabaseServeur'
import { hasCurrentAdvertisingConsent } from '@/lib/advertisingConsentServer'
import { isUuid } from '@/lib/advertisingConsentContract'
import { consentementPublicitaire } from '@/lib/meta-capi'
import {
  sendCAPIEvent,
  type CAPIEventName,
  type CAPICustomData,
} from '@/lib/meta-capi'

export const runtime = 'nodejs'

const BROWSER_ALLOWED = new Set<CAPIEventName>([
  'PageView', 'ViewContent', 'InitiateCheckout', 'AddPaymentInfo', 'Lead', 'Contact',
])

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) return forbiddenOrigin()

  try {
    const body = (await request.json()) as {
      eventName?: CAPIEventName
      eventId?: string
      customData?: CAPICustomData
    }
    if (!body.eventName || !BROWSER_ALLOWED.has(body.eventName)) {
      return NextResponse.json({ ok: false, error: 'evenement_reserve_au_serveur' }, { status: 403 })
    }
    if (!body.eventId || !isUuid(body.eventId)) {
      return NextResponse.json({ ok: false, error: 'event_id_invalid' }, { status: 400 })
    }

    // Ni l'identite, ni l'accord, ni les coordonnees personnelles ne viennent
    // du corps navigateur. La porte commune resout le badge httpOnly, puis P29
    // tranche avec son etat actuel. Un vieux cookie positif ne suffit jamais.
    const cookieHeader = request.headers.get('cookie') || ''
    const identityId = await resolveSiteIdentity(request, { canal: 'site' })
    const sb = clientServeurOuNull()
    if (!consentementPublicitaire(cookieHeader) ||
        !sb || !await hasCurrentAdvertisingConsent(sb, identityId)) {
      return NextResponse.json({ ok: false, skipped: 'consentement_courant_absent' })
    }

    const forwarded = request.headers.get('x-forwarded-for') || ''
    const result = await sendCAPIEvent({
      consentement: true,
      eventName: body.eventName,
      eventId: body.eventId,
      eventSourceUrl: request.headers.get('referer') || request.nextUrl.origin,
      userData: {
        externalId: identityId,
        clientIpAddress: forwarded.split(',')[0]?.trim() || request.headers.get('x-real-ip') || undefined,
        clientUserAgent: request.headers.get('user-agent') || undefined,
        fbc: cookieHeader.match(/(?:^|;\s*)_fbc=([^;]+)/)?.[1],
        fbp: cookieHeader.match(/(?:^|;\s*)_fbp=([^;]+)/)?.[1],
      },
      customData: body.customData,
    })
    return NextResponse.json(result.ok ? { ok: true } : { ok: false, error: result.error || result.skipped })
  } catch {
    return NextResponse.json({ ok: false, error: 'internal' }, { status: 200 })
  }
}
