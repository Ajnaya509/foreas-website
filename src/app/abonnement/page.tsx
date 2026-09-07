import type { Metadata } from 'next'
import GestionAbonnement from './GestionAbonnement'

export const metadata: Metadata = {
  title: 'Mon abonnement · FOREAS',
  robots: { index: false, follow: false },
}

export default function Page() { return <GestionAbonnement /> }
