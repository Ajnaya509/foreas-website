import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

async function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  const { createClient } = await import('@supabase/supabase-js')
  return createClient(url, key)
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
    const newProspect = {
      phone: phone ? phone.replace(/[\s.\-()]/g, '') : null,
      email: email || null,
      first_name: firstName || null,
      source,
      status: 'new',
      score: 10,
      objections: [],
      conversations_count: 0,
      utm_source: utm_source || null,
      utm_campaign: utm_campaign || null,
      metadata: { pageSource },
    }

    const { data, error } = await sb
      .from('pieuvre_prospects')
      .insert(newProspect)
      .select('id')
      .single()

    if (error) {
      console.error('[ajnaya/prospect] Insert error:', error.message)
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
