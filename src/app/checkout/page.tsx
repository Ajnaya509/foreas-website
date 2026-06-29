import { Metadata } from 'next'
import CheckoutClient from './CheckoutClient'

export const metadata: Metadata = {
  title: 'FOREAS — Démarrer maintenant',
  description: 'Paiement sécurisé. Garantie 30 jours satisfait ou remboursé.',
  robots: { index: false, follow: false },
}

export default function CheckoutPage() {
  return <CheckoutClient />
}
