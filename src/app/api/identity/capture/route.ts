import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

// Normalize French phone number to E.164 (+33XXXXXXXXX)
function normalizeE164(raw: string): string | null {
  const digits = raw.replace(/[\s.\-()]/g, '')
  if (/^\+33\d{9}$/.test(digits)) return digits
  if (/^0\d{9}$/.test(digits)) return '+33' + digits.slice(1)
  return null
}

export async function POST(request: NextRequest) {
  try {
    const { phone_raw, prospect_id, canal } = await request.json()

    if (!phone_raw) {
      return NextResponse.json({ error: 'missing_phone' }, { status: 400 })
    }

    const phone_e164 = normalizeE164(phone_raw)
    if (!phone_e164) {
      return NextResponse.json({ error: 'invalid_phone' }, { status: 400 })
    }

    // SHA-256 hash computed server-side only — never exposed to client
    const identity_hash = crypto.createHash('sha256').update(phone_e164).digest('hex')

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // If we have a prospect_id, enrich their metadata
    if (prospect_id) {
      const { data: prospect } = await supabase
        .from('pieuvre_prospects')
        .select('metadata')
        .eq('id', prospect_id)
        .single()

      const updatedMeta = {
        ...(prospect?.metadata || {}),
        identity_hash,
        canal: canal || 'widget',
        phone_captured_at: new Date().toISOString(),
      }

      await supabase
        .from('pieuvre_prospects')
        .update({ metadata: updatedMeta })
        .eq('id', prospect_id)

      return NextResponse.json({ ok: true, identity_id: identity_hash.slice(0, 8) })
    }

    // No prospect_id — just acknowledge, hash is computed but not persisted without an anchor
    return NextResponse.json({ ok: true, identity_id: identity_hash.slice(0, 8) })
  } catch (error) {
    console.error('[identity/capture] Error:', (error as Error).message)
    return NextResponse.json({ error: 'capture_failed' }, { status: 500 })
  }
}
