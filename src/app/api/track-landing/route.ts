import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      topic_slug,
      event_type,
      scroll_depth,
      time_on_page,
      utm_source,
      utm_medium,
      utm_campaign,
    } = body

    if (!topic_slug || !event_type) {
      return NextResponse.json({ error: 'missing_params' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    if (event_type === 'pageview') {
      await supabase.rpc('increment_landing_metric', {
        p_topic_slug: topic_slug,
        p_field: 'visits',
        p_utm_source: utm_source || 'direct',
        p_utm_medium: utm_medium || 'none',
        p_utm_campaign: utm_campaign || 'none',
      })
    } else if (event_type === 'scroll') {
      await supabase.rpc('update_landing_scroll', {
        p_topic_slug: topic_slug,
        p_scroll_depth: scroll_depth ?? 0,
        p_time_on_page: time_on_page ?? 0,
      })
    } else if (event_type === 'cta_click') {
      await supabase.rpc('increment_landing_metric', {
        p_topic_slug: topic_slug,
        p_field: 'cta_clicks',
        p_utm_source: utm_source || 'direct',
        p_utm_medium: utm_medium || 'none',
        p_utm_campaign: utm_campaign || 'none',
      })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[track-landing]', (error as Error).message)
    return NextResponse.json({ ok: true }) // silent fail — ne jamais bloquer le client
  }
}
