/**
 * POST /api/ajnaya/home-modal/wa-click
 *
 * Endpoint thin appelé en `navigator.sendBeacon` au clic effectif sur le CTA
 * "Continuer sur WhatsApp" du modal Ajnaya home page.
 *
 * Fire-and-forget : enregistre `home_modal_wa_clicked` dans `pieuvre_funnel_events`
 * via la RPC `record_funnel_event` (canal=`home_modal`).
 *
 * KPI ULTIME du widget — voir brief PIEUVRE_HOME_MODAL_FIX.md §Métriques.
 * Cible : `home_modal_wa_clicked / home_modal_zone_queried ≥ 30%`.
 *
 * Implémentation : payload JSON minimal, on retourne 204 immédiatement, le RPC
 * tourne en best-effort. sendBeacon est résilient au close-tab (vital pour
 * un click qui ouvre WhatsApp dans un autre onglet).
 */

import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

interface WaClickPayload {
  session_id: string
  turn?: number
  zone?: string | null
  zone_category?: 'disney' | 'idf' | 'region' | 'unknown' | null
  clarify_branch?: boolean
  has_data?: boolean
  identity_id?: string | null
  visitor_id?: string | null
  ab_variant?: string | null
}

async function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  const { createClient } = await import('@supabase/supabase-js')
  return createClient(url, key)
}

export async function POST(request: NextRequest) {
  let body: WaClickPayload
  try {
    body = await request.json()
  } catch {
    return new NextResponse(null, { status: 204 }) // Beacon malformé : on swallow
  }

  if (!body?.session_id) {
    return new NextResponse(null, { status: 204 })
  }

  // Badge appareil durable (1ère partie) posé par le middleware — ancre identité serveur.
  const device_cookie_id = request.cookies.get('foreas_vid')?.value ?? null

  // Fire-and-forget — pas d'await sur la réponse client
  ;(async () => {
    try {
      const sb = await getSupabase()
      if (!sb) return

      // Identité : le client renvoie l'identity_id reçu aux tours précédents ; repli
      // sur resolve_identity(visitor_id|cookie) pour ne JAMAIS perdre la personne au
      // moment le plus précieux du tunnel (le clic WhatsApp). Brief Chantier B.
      let identityId: string | null = body.identity_id ?? null
      if (!identityId) {
        const key = body.visitor_id || device_cookie_id
        if (key) {
          const { data } = await sb.rpc('resolve_identity', { p_visitor_id: key, p_canal: 'home_modal' })
          identityId = (data as { identity_id?: string } | null)?.identity_id ?? null
        }
      }

      await sb.rpc('record_funnel_event', {
        p_step_code:    'home_modal_wa_clicked',
        p_step_label:   'home_modal_wa_clicked',
        p_identity_id:  identityId,
        p_session_id:   body.session_id,
        p_canal_source: 'home_modal',
        p_zone_match:   body.zone ?? null,
        p_ab_variant:   body.ab_variant ?? null,
        p_context: {
          turn:           body.turn ?? null,
          zone:           body.zone ?? null,
          zone_category:  body.zone_category ?? null,
          clarify_branch: Boolean(body.clarify_branch),
          has_data:       Boolean(body.has_data),
          visitor_id:     body.visitor_id ?? null,
          device_cookie_id,
          ts:             new Date().toISOString(),
        },
      })
    } catch {
      // silencieux — on ne casse jamais la nav vers WhatsApp pour un échec analytics
    }
  })()

  return new NextResponse(null, { status: 204 })
}
