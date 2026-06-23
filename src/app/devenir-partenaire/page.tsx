import { Metadata } from 'next'
import PartnerSignupForm from './PartnerSignupForm'

export const metadata: Metadata = {
  title: 'Devenir partenaire FOREAS',
  description:
    'Auto-école, flotte, fédération, créateur, agent : amène des chauffeurs sur FOREAS et touche une commission mensuelle récurrente. Candidature en 1 minute, validée sous 24-48h.',
  openGraph: {
    title: 'Devenir partenaire FOREAS — Toujours plus loin',
    description: 'Amène des chauffeurs sur FOREAS, touche une commission mensuelle récurrente. Candidate en 1 minute.',
    url: 'https://foreas.xyz/devenir-partenaire',
  },
}

export default function DevenirPartenairePage() {
  return <PartnerSignupForm />
}
