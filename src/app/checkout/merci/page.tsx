import { Metadata } from 'next'
import MerciClient from './MerciClient'

export const metadata: Metadata = {
  title: 'FOREAS — Bienvenue à bord',
  robots: { index: false, follow: false },
}

/**
 * Page de retour après paiement du checkout sur-mesure (/checkout → return_url).
 * Le paiement est confirmé par Stripe avant la redirection ici.
 * Téléchargement OS-aware + rassurance → composant client MerciClient.
 */
export default function MerciPage() {
  return <MerciClient />
}
