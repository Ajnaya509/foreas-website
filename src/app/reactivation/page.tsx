import { Metadata } from 'next'
import ReactivationClient from './ReactivationClient'

export const metadata: Metadata = {
  title: 'FOREAS — Reprends la main',
  description: 'Paiement immédiat, garantie 30 jours satisfait ou remboursé. Gagne plus, roule moins.',
  robots: { index: false, follow: false }, // page de campagne (lien email) — pas d'indexation
}

export default function ReactivationPage() {
  return <ReactivationClient />
}
