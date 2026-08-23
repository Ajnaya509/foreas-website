import { NextRequest, NextResponse } from 'next/server'
import { isSameOriginRequest, forbiddenOrigin } from '@/lib/api-guard'
import { sendCAPIEvent, type CAPIEventName, type CAPIUserData, type CAPICustomData, consentementPublicitaire } from '@/lib/meta-capi'

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
  // GARDE 14/08/2026 — Route de conversion serveur (Meta). Sans garde, n'importe qui peut injecter de
  // fausses conversions dans le compte publicitaire de FOREAS — donnée d'audience
  // empoisonnée, budget mal optimisé, et un canal pour faire transiter des données
  // personnelles à travers NOTRE jeton.
  // Appelée uniquement par nos propres pages : un appel sans origine FOREAS
  // n'a aucune raison d'exister.
  if (!isSameOriginRequest(request)) {
    return forbiddenOrigin()
  }

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

    // 🔴 21/08/2026 — CETTE ROUTE ACCEPTAIT « Purchase » DEPUIS LE NAVIGATEUR.
    //
    // Aucune liste blanche : n'importe quel nom d'événement passait, avec un
    // identifiant de dédoublonnage FOURNI PAR L'APPELANT. Mesuré : un POST avec
    // `eventName: 'Purchase'` et une valeur de 999 € était accepté.
    //
    // Il ne partait pas — seulement parce que l'identifiant Meta n'est pas
    // configuré. Le jour où Chandler le pose, la porte s'ouvre avec.
    //
    // Le seul garde était la vérification d'origine, qu'un en-tête posé à la
    // main satisfait. Une origine n'est pas une authentification.
    //
    // UNE CONVERSION PAYÉE APPARTIENT AU SERVEUR. Le navigateur peut déclarer
    // ce qu'il observe — une page vue, un début de paiement. Il ne déclare
    // jamais un euro encaissé : il n'a aucun moyen de le savoir, et tout ce
    // qu'il affirme est réécrivable.
    //
    // C'est exactement la règle que /api/mesure applique déjà. Deux routes de
    // mesure, une seule protégée — le jumeau, encore.
    const NAVIGATEUR_AUTORISE = new Set([
      'PageView', 'ViewContent', 'InitiateCheckout', 'AddPaymentInfo', 'Lead',
    ])
    if (!NAVIGATEUR_AUTORISE.has(body.eventName)) {
      console.warn(`[capi] evenement refuse au navigateur : ${body.eventName}`)
      return NextResponse.json({ error: 'evenement_reserve_au_serveur' }, { status: 403 })
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

    // 23/08 — cette route est appelée par le navigateur : elle a le cookie.
    // Le pixel client était conditionné au consentement, ce relais ne l'était
    // pas — le refus se contournait en passant par ici.
    const result = await sendCAPIEvent({
      consentement: consentementPublicitaire(request.headers.get('cookie')),
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
