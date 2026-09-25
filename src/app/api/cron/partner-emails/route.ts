import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'node:crypto'
import { clientServeurOuNull } from '@/lib/supabaseServeur'
import { processPartnerApplicationMail } from '@/lib/partnerApplicationMail'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(req: NextRequest) {
  const secret = process.env.PARTNER_MAIL_CRON_SECRET || process.env.CRON_SECRET
  const headers = { 'Cache-Control': 'no-store' }
  if (!secret || secret.length < 32) return NextResponse.json({ error: 'Service indisponible' }, { status: 503, headers })
  const received = Buffer.from(req.headers.get('authorization') || '')
  const expected = Buffer.from('Bearer ' + secret)
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 401, headers })
  }
  const sb = clientServeurOuNull()
  if (!sb) return NextResponse.json({ error: 'Service indisponible' }, { status: 503, headers })
  try {
    return NextResponse.json(await processPartnerApplicationMail(sb), { headers })
  } catch {
    return NextResponse.json({ error: 'Envois à reprendre' }, { status: 503, headers })
  }
}
