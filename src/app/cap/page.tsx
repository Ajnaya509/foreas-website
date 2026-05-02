import { Suspense } from 'react'
import { Metadata } from 'next'
import CapClient from './CapClient'

export const metadata: Metadata = {
  title: 'Rejoindre FOREAS — Offre partenaire',
  description: 'Votre partenaire vous a invité à rejoindre FOREAS, l\'IA pour les chauffeurs VTC.',
  robots: { index: false, follow: false }, // No public indexing for partner landings
}

interface PageProps {
  searchParams: Promise<{ ref?: string }>
}

// Fetch partner landing data server-side (Railway public endpoint)
async function fetchPartnerLanding(referralCode: string) {
  try {
    const res = await fetch(
      `https://foreas-stripe-backend-production.up.railway.app/api/public/partners/${encodeURIComponent(referralCode)}/landing`,
      {
        next: { revalidate: 300 }, // Cache 5 min
        headers: { 'Accept': 'application/json' },
      }
    )
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

export default async function CapPage({ searchParams }: PageProps) {
  const { ref } = await searchParams
  const referralCode = ref?.trim().toUpperCase() || null

  // Fetch partner data if we have a code
  const partnerData = referralCode ? await fetchPartnerLanding(referralCode) : null

  return (
    <Suspense fallback={null}>
      <CapClient
        referralCode={referralCode}
        partnerData={partnerData}
      />
    </Suspense>
  )
}
