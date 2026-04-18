import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

/**
 * POST /api/app/claim-handoff
 *
 * Called by the FOREAS Driver app when it opens with a ?deeplink=<token> URL.
 * Validates the token, returns the conversation state, and marks it as used.
 *
 * Body: { token: string }
 * Response: { ok: true, state: object, identity_id: string }
 *        or { error: string } with 400/404/410
 *
 * Security:
 * - Token is a UUID — unguessable
 * - Single-use: used_at is set on first claim (subsequent calls → 410)
 * - 48h TTL: expired tokens → 410
 * - Service role only touches the table (RLS blocks all other access)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { token } = body

    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'missing_token' }, { status: 400 })
    }

    // Validate UUID format — prevents injection / unexpected queries
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!UUID_RE.test(token)) {
      return NextResponse.json({ error: 'invalid_token_format' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Fetch the token row
    const { data, error } = await supabase
      .from('handoff_tokens')
      .select('token, identity_id, source_canal, target_canal, state, expires_at, used_at')
      .eq('token', token)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'token_not_found' }, { status: 404 })
    }

    // Already used
    if (data.used_at) {
      return NextResponse.json({ error: 'token_already_used' }, { status: 410 })
    }

    // Expired
    if (new Date(data.expires_at) < new Date()) {
      return NextResponse.json({ error: 'token_expired' }, { status: 410 })
    }

    // Mark as used (single-use enforcement)
    await supabase
      .from('handoff_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('token', token)

    // Return state + a partial identity display id (never full hash)
    return NextResponse.json({
      ok: true,
      state: data.state,
      identity_id: (data.identity_id as string).slice(0, 8),
      source_canal: data.source_canal,
    })
  } catch (err) {
    console.error('[claim-handoff]', (err as Error).message)
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}
