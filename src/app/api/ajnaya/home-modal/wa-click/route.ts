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

  // Fire-and-forget — pas d'await sur la réponse client
  ;(async () => {
    try {
      const sb = await getSupabase()
      if (!sb) return
      await sb.rpc('record_funnel_event', {
        p_event_name: 'home_modal_wa_clicked',
        p_session_id: body.session_id,
        p_canal: 'home_modal',
        p_metadata: {
          turn: body.turn ?? null,
          zone: body.zone ?? null,
          zone_category: body.zone_category ?? null,
          clarify_branch: Boolean(body.clarify_branch),
          has_data: Boolean(body.has_data),
          ts: new Date().toISOString(),
        },
      })
    } catch {
      // silencieux — on ne casse jamais la nav vers WhatsApp pour un échec analytics
    }
  })()

  return new NextResponse(null, { status: 204 })
}
