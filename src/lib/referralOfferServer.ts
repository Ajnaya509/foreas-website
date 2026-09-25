import { clientServeurOuNull } from './supabaseServeur'
import { normalizeReferralCode, parseReferralOffer, ReferralOfferError } from './referralOffer'
import { enrollmentOffer, isEnrollmentCode } from './partnerEnrollmentAttribution'

/** One authoritative resolution for landing, verifier and checkout. */
export async function resolveReferralOffer(raw: unknown) {
  const code = normalizeReferralCode(raw)
  if (!code) throw new ReferralOfferError('CODE_UNAVAILABLE')
  const sb = clientServeurOuNull()
  if (!sb) throw new ReferralOfferError('SERVICE_UNAVAILABLE')
  if (isEnrollmentCode(code)) {
    try {
      return parseReferralOffer(await enrollmentOffer(sb, code), code)
    } catch (error) {
      if (error instanceof ReferralOfferError) throw error
      throw new ReferralOfferError(error instanceof Error && error.message === 'CODE_UNAVAILABLE' ? 'CODE_UNAVAILABLE' : 'SERVICE_UNAVAILABLE')
    }
  }
  const { data, error } = await sb.rpc('partner_referral_offer', { p_code: code })
  if (error) throw new ReferralOfferError(error.message === 'CODE_UNAVAILABLE' ? 'CODE_UNAVAILABLE' : 'SERVICE_UNAVAILABLE')
  return parseReferralOffer(data, code)
}
