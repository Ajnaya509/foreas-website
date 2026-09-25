import type Stripe from 'stripe'

export type ReferralOffer = {
  code: string; sponsor_type: 'partner' | 'driver'; discount_pct: number;
  duration_months: number | null; duration_type: 'forever' | 'repeating'; active: boolean;
}
export class ReferralOfferError extends Error {
  constructor(public code: 'CODE_UNAVAILABLE' | 'SERVICE_UNAVAILABLE' | 'TERMS_UNAVAILABLE') { super(code) }
}
export function normalizeReferralCode(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const code = value.trim().toUpperCase()
  return /^[A-Z0-9-]{6,32}$/.test(code) ? code : null
}
export function parseReferralOffer(data: unknown, expectedCode: string): ReferralOffer {
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new ReferralOfferError('SERVICE_UNAVAILABLE')
  const value = data as Record<string, unknown>
  if (value.active !== true) throw new ReferralOfferError('CODE_UNAVAILABLE')
  if (value.code !== expectedCode || !['partner', 'driver'].includes(String(value.sponsor_type)) ||
      typeof value.discount_pct !== 'number' || !Number.isFinite(value.discount_pct) ||
      value.discount_pct < 0 || value.discount_pct > 100 ||
      !['forever', 'repeating'].includes(String(value.duration_type)) ||
      (value.duration_type === 'forever' && (value.duration_months !== null || (value.sponsor_type === 'partner' && value.discount_pct !== 10))) ||
      (value.duration_months !== null && (!Number.isInteger(value.duration_months) || Number(value.duration_months) < 1 || Number(value.duration_months) > 120))) throw new ReferralOfferError('SERVICE_UNAVAILABLE')
  return value as unknown as ReferralOffer
}
export function discountForPlan(offer: ReferralOffer, annual: boolean): { percent: number; months: number | null; duration: 'none' | 'forever' | 'repeating' } {
  if (offer.discount_pct === 0 || (annual && !(offer.sponsor_type === 'partner' && offer.duration_type === 'forever' && offer.discount_pct === 10))) return { percent: 0, months: null, duration: 'none' }
  if (offer.duration_type === 'forever') return { percent: offer.discount_pct, months: null, duration: 'forever' }
  if (offer.duration_months === null) throw new ReferralOfferError('TERMS_UNAVAILABLE')
  return { percent: offer.discount_pct, months: offer.duration_months, duration: 'repeating' }
}
/** Existing perpetual coupons are never reused for a finite offer. */
export async function ensureReferralCoupon(stripe: Pick<Stripe, 'coupons'>, percent: number, months: number | null, duration: 'repeating' | 'forever' = 'repeating', sponsor: 'driver' | 'partner' = 'driver'): Promise<string> {
  if (!Number.isFinite(percent) || percent <= 0 || percent > 100 ||
      (duration === 'repeating' && (!Number.isInteger(months) || Number(months) < 1 || Number(months) > 120)) ||
      (duration === 'forever' && months !== null)) throw new ReferralOfferError('TERMS_UNAVAILABLE')
  const permanentPartner = sponsor === 'partner' && duration === 'forever'
  if (permanentPartner && (percent !== 10 || months !== null)) throw new ReferralOfferError('TERMS_UNAVAILABLE')
  const id = permanentPartner ? 'foreas_partner_v2_10_forever' : 'foreas_ref_v1_' + String(percent).replace('.', 'p') + '_' + (duration === 'forever' ? 'forever' : months + 'm')
  const check = (coupon: Stripe.Coupon) => {
    if (coupon.id !== id || !coupon.valid || coupon.percent_off !== percent || coupon.duration !== duration ||
        coupon.duration_in_months !== months || coupon.amount_off !== null || coupon.applies_to?.products?.length ||
        coupon.max_redemptions !== null || coupon.redeem_by !== null) throw new ReferralOfferError('TERMS_UNAVAILABLE')
  }
  try {
    check(await stripe.coupons.retrieve(id))
  } catch (error) {
    if ((error as { code?: string; statusCode?: number }).code !== 'resource_missing' || (error as { statusCode?: number }).statusCode !== 404) throw error
    const coupon = await stripe.coupons.create({
      id, percent_off: percent, duration,
      ...(duration === 'repeating' && months !== null ? { duration_in_months: months } : {}),
      name: permanentPartner ? 'FOREAS partenaire −10 % récurrents' : 'FOREAS −' + percent + '%' + (duration === 'forever' ? ' sur cet abonnement mensuel' : ' pendant ' + months + ' mois'),
    }, { idempotencyKey: 'partner-coupon/' + id })
    check(coupon)
  }
  return id
}
