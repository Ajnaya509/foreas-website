import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const data = await request.json()

    // Basic validation
    if (!data.session_id || !data.page_source || !Array.isArray(data.messages)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    // Try Supabase insert if configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (supabaseUrl && supabaseKey) {
      try {
        const { createClient } = await import('@supabase/supabase-js')
        const supabase = createClient(supabaseUrl, supabaseKey)
        await supabase.from('widget_conversations').insert({
          session_id: data.session_id,
          page_source: data.page_source,
          device: data.device,
          messages: data.messages,
          intents_detected: data.intents_detected,
          cta_clicked_after: data.cta_clicked_after,
          conversation_duration_ms: data.conversation_duration_ms,
        })
      } catch (e) {
        console.warn('[widget-analytics] Supabase insert failed:', e)
      }
    } else {
      console.log('[widget-analytics] No Supabase config — logging conversation:', {
        session: data.session_id,
        page: data.page_source,
        messages: data.messages?.length,
        intents: data.intents_detected,
      })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: true }) // Never fail visibly
  }
}
