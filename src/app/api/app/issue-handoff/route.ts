import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

/**
 * POST /api/app/issue-handoff
 *
 * Called by AjnayaWidget (client → server) when the user clicks
 * "Télécharger l'app" or after Identity Bridge captures a phone number.
 * Creates a handoff_tokens row and returns the deep-link URL for the app.
 *
 * Body: {
 *   identity_id: string,   // SHA-256 hash slice (8 chars) or full hash
 *   state: object,         // conversation snapshot to hand off
 *   source_canal?: string  // default "widget"
 * }
 * Response: {
 *   ok: true,
 *   token: string,         // UUID
 *   deeplink: string       // foreas://handoff?token=<uuid>
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { identity_id, state, source_canal = 'widget' } = body

    if (!identity_id || typeof identity_id !== 'string') {
      return NextResponse.json({ error: 'missing_identity_id' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data, error } = await supabase
      .from('handoff_tokens')
      .insert({
        identity_id,
        source_canal,
        target_canal: 'app',
        state: state || {},
      })
      .select('token')
      .single()

    if (error || !data) {
      console.error('[issue-handoff] insert error:', error?.message)
      return NextResponse.json({ error: 'insert_failed' }, { status: 500 })
    }

    const token = data.token as string
    const deeplink = `foreas://handoff?token=${token}`
    const webFallback = `https://foreas.xyz/go?deeplink=${token}`

    return NextResponse.json({ ok: true, token, deeplink, webFallback })
  } catch (err) {
    console.error('[issue-handoff]', (err as Error).message)
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}
