import { NextRequest, NextResponse } from 'next/server'
import { readAcquisitionFromRequest } from '@/lib/acquisitionServer'

export const runtime = 'nodejs'

async function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  const { createClient } = await import('@supabase/supabase-js')
  return createClient(url, key)
}

/**
 * `pieuvre_prospects.source` porte un CHECK strict en base :
 *   whatsapp | ctwa | cold_call | cold_email | referral | organic | b2b_fleet |
 *   scraper | tribal | home_search_v1
 * Le site envoyait `widget_site`, qui n'y figure pas → 23514, INSERT refusé.
 * On traduit ici plutôt que d'élargir la contrainte (la base n'est pas dans ce
 * périmètre, et un vocabulaire d'origine qui s'élargit à chaque appelant ne veut
 * plus rien dire).
 */
const ALLOWED_SOURCES = new Set([
  'whatsapp', 'ctwa', 'cold_call', 'cold_email', 'referral',
  'organic', 'b2b_fleet', 'scraper', 'tribal', 'home_search_v1',
])

function toAllowedSource(raw: string, ctwaClid?: string): string {
  if (ctwaClid) return 'ctwa'            // venu d'une pub Click-to-WhatsApp
  if (ALLOWED_SOURCES.has(raw)) return raw
  return 'organic'                        // visiteur du site sans campagne identifiée
}

// POST — Create or find a prospect
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone, email, firstName, source = 'widget_site', pageSource, utm_source, utm_campaign } = body

    const sb = await getSupabase()
    if (!sb) {
      return NextResponse.json({ error: 'Supabase non configuré' }, { status: 503 })
    }

    // Search by phone first, then email
    if (phone) {
      const cleaned = phone.replace(/[\s.\-()]/g, '')
      const { data: existing } = await sb
        .from('pieuvre_prospects')
        .select('id, score, objections, conversations_count, status, first_name')
        .eq('phone', cleaned)
        .limit(1)
        .single()

      if (existing) {
        return NextResponse.json({
          prospectId: existing.id,
          isNew: false,
          score: existing.score,
          conversationsCount: existing.conversations_count,
        })
      }
    }

    if (email) {
      const { data: existing } = await sb
        .from('pieuvre_prospects')
        .select('id, score, objections, conversations_count, status, first_name')
        .eq('email', email)
        .limit(1)
        .single()

      if (existing) {
        return NextResponse.json({
          prospectId: existing.id,
          isNew: false,
          score: existing.score,
          conversationsCount: existing.conversations_count,
        })
      }
    }

    // Create new prospect
    //
    // ⚠️ CORRECTIF P0.h (2026-08-13) : cet INSERT portait un champ `metadata`.
    // La table `pieuvre_prospects` N'A PAS de colonne `metadata` (colonnes réelles :
    // id, phone, email, first_name, last_name, source, status, score, objections,
    // conversations_count, last_conversation_at, last_contacted_at,
    // assigned_tentacle, utm_source, utm_campaign, conversion_value, lost_reason,
    // notes, driver_id, created_at, updated_at, referred_by_driver_id,
    // referral_code_used, identity_id, ctwa_clid). PostgREST rejetait donc 100 %
    // des créations de prospect venant du widget — d'où 0 prospect widget en base.
    // `pageSource` part dans `notes`, colonne qui existe.
    const acquisition = readAcquisitionFromRequest(request)
    const newProspect: Record<string, unknown> = {
      phone: phone ? phone.replace(/[\s.\-()]/g, '') : null,
      email: email || null,
      first_name: firstName || null,
      source: toAllowedSource(source, acquisition.ctwa_clid),
      status: 'new',
      score: 10,
      objections: [],
      conversations_count: 0,
      // Origine RÉELLE du visiteur (cookie 1ère partie), avec repli sur ce que
      // l'appelant transmet. Avant, seule une constante côté Pieuvre remplissait
      // ces colonnes.
      utm_source: acquisition.utm_source || utm_source || null,
      utm_campaign: acquisition.utm_campaign || utm_campaign || null,
      ctwa_clid: acquisition.ctwa_clid || null,
      notes: pageSource ? `page_source=${String(pageSource).slice(0, 200)}` : null,
    }

    const { data, error } = await sb
      .from('pieuvre_prospects')
      .insert(newProspect)
      .select('id')
      .single()

    if (error) {
      console.error('[ajnaya/prospect] Insert error:', error.code, error.message)
      return NextResponse.json({ error: 'Erreur création prospect' }, { status: 500 })
    }

    return NextResponse.json({
      prospectId: data.id,
      isNew: true,
      score: 10,
      conversationsCount: 0,
    })
  } catch (error) {
    console.error('[ajnaya/prospect] Error:', (error as Error).message)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// GET — Retrieve prospect by ID
export async function GET(request: NextRequest) {
  try {
    const prospectId = request.nextUrl.searchParams.get('id')
    if (!prospectId) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 })
    }

    const sb = await getSupabase()
    if (!sb) {
      return NextResponse.json({ error: 'Supabase non configuré' }, { status: 503 })
    }

    const { data, error } = await sb
      .from('pieuvre_prospects')
      .select('id, score, objections, conversations_count, status, first_name')
      .eq('id', prospectId)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Prospect non trouvé' }, { status: 404 })
    }

    return NextResponse.json({
      prospectId: data.id,
      score: data.score,
      conversationsCount: data.conversations_count,
      status: data.status,
      firstName: data.first_name,
    })
  } catch (error) {
    console.error('[ajnaya/prospect] GET error:', (error as Error).message)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
