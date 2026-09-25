import { NextResponse } from 'next/server'
import { clientServeurOuNull } from '@/lib/supabaseServeur'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const KINDS = new Set(['app_page_opened', 'partner_account_activated', 'booking_site_published'])

export async function GET() {
  const sb = clientServeurOuNull()
  if (!sb) return NextResponse.json({ events: [] }, { headers: { 'Cache-Control': 'no-store' } })

  const now = new Date().toISOString()
  const { data, error } = await sb.from('site_notification_events')
    .select('id,event_kind,display_name,display_name_consent_ref,evidence_ref,occurred_at')
    .not('approved_at', 'is', null)
    .not('evidence_ref', 'is', null)
    .gte('expires_at', now)
    .lte('occurred_at', now)
    .order('occurred_at', { ascending: false })
    .limit(27)

  if (error) return NextResponse.json({ events: [] }, { headers: { 'Cache-Control': 'no-store' } })
  const events = (data ?? []).filter(row => KINDS.has(row.event_kind) && row.evidence_ref).map(row => ({
    id: row.id,
    kind: row.event_kind,
    name: row.display_name_consent_ref && typeof row.display_name === 'string'
      ? row.display_name.trim().slice(0, 24).split(/\s+/)[0].replace(/[^\p{L}'-]/gu, '') || null
      : null,
  }))
  return NextResponse.json({ events }, { headers: { 'Cache-Control': 'no-store' } })
}
