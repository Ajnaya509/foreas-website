import type { Metadata } from 'next'
import Landing from '@/components/partner-public/Landing'
import { metadonneesPage } from '@/lib/site'
export const metadata: Metadata = metadonneesPage('/partenaire', 'Programme partenaire FOREAS — Recommandez FOREAS Driver', 'Créez votre espace partenaire FOREAS, configurez vos informations de versement et retrouvez votre lien de recommandation.')
export default function PartenairePage() { return <Landing/> }
