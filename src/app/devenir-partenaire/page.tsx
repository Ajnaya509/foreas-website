import { Metadata } from 'next'
import PartnerSignupForm from './PartnerSignupForm'

export const metadata: Metadata = {
  title: 'Devenir partenaire FOREAS — Programme CAP',
  description:
    'Rejoignez le programme Customer Acquisition Program de FOREAS. Recrutez des chauffeurs VTC et gagnez 10€/mois par filleul actif.',
  openGraph: {
    title: 'Devenir partenaire FOREAS — Programme CAP',
    description: 'Gagnez 10€/mois par chauffeur recruté. Auto-école, flotte, influenceur, agent commercial.',
    url: 'https://foreas.xyz/devenir-partenaire',
  },
}

export default function DevenirPartenairePage() {
  return <PartnerSignupForm />
}
