import { redirect } from 'next/navigation'
import { normalizeReferralCode } from '@/lib/referralOffer'
export const dynamic = 'force-dynamic'
// Previous partner links keep their code and join the single verified offer page.
export default async function LegacyPartnerOffer({ searchParams }: { searchParams: Promise<{ ref?: string }> }) {
  const code = normalizeReferralCode((await searchParams).ref)
  redirect('/r/' + encodeURIComponent(code ?? 'invitation-invalide'))
}
