import { NextResponse, type NextRequest } from 'next/server'
import { resolveReferralOffer } from '@/lib/referralOfferServer'
import { normalizeReferralCode, discountForPlan, ReferralOfferError } from '@/lib/referralOffer'
import { partnerRateKey } from '@/lib/partnerRateKey'
import { clientServeurOuNull } from '@/lib/supabaseServeur'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
const headers = { 'Cache-Control': 'no-store' }

/** Same authoritative offer and duration as checkout, with a database-backed limit. */
export async function POST(request: NextRequest) {
  const unavailable = () => NextResponse.json({ error: 'indisponible' }, { status: 503, headers })
  try {
    if (!request.headers.get('content-type')?.includes('application/json')) return NextResponse.json({ error: 'requete_invalide' }, { status: 415, headers })
    if (Number(request.headers.get('content-length') || 0) > 2048) return NextResponse.json({ error: 'requete_trop_longue' }, { status: 413, headers })
    const raw = await request.text()
    if (Buffer.byteLength(raw, 'utf8') > 2048) return NextResponse.json({ error: 'requete_trop_longue' }, { status: 413, headers })
    let corps: Record<string, unknown>
    try { corps = JSON.parse(raw) } catch { return NextResponse.json({ error: 'requete_invalide' }, { status: 400, headers }) }
    if (!corps || typeof corps !== 'object' || Array.isArray(corps)) return NextResponse.json({ error: 'requete_invalide' }, { status: 400, headers })
    const code = normalizeReferralCode(corps.code)
    const formule = corps.formule === 'annuel' ? 'annuel' : corps.formule === undefined || corps.formule === 'mensuel' ? 'mensuel' : null
    if (!formule) return NextResponse.json({ error: 'formule_invalide' }, { status: 400, headers })
    if (!code) return NextResponse.json({ valide: false, motif: 'forme' }, { headers })
    const rateKey = partnerRateKey(request.headers)
    const sb = clientServeurOuNull()
    if (!rateKey || !sb) return unavailable()
    const ceiling = await sb.rpc('partner_code_rate_limit', { p_rate_key: rateKey })
    if (ceiling.error || typeof ceiling.data?.allowed !== 'boolean') return unavailable()
    if (!ceiling.data.allowed) return NextResponse.json({ error: 'trop_d_essais' }, {
      status: 429, headers: { ...headers, 'Retry-After': String(Math.max(1, Number(ceiling.data.retry_after_seconds) || 900)) },
    })
    const offer = await resolveReferralOffer(code)
    const discount = discountForPlan(offer, formule === 'annuel')
    return NextResponse.json({
      valide: true, remisePct: offer.discount_pct,
      remiseAppliquee: discount.percent, dureeMois: offer.duration_months,
      remisePermanente: offer.duration_type === 'forever',
    }, { headers })
  } catch (error) {
    if (error instanceof ReferralOfferError && error.code === 'CODE_UNAVAILABLE') return NextResponse.json({ valide: false, motif: 'inconnu' }, { headers })
    return NextResponse.json({ error: error instanceof ReferralOfferError && error.code === 'TERMS_UNAVAILABLE' ? 'conditions_a_confirmer' : 'indisponible' }, { status: 503, headers })
  }
}
