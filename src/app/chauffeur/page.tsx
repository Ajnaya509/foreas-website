import type { Metadata } from 'next'
import MesureVue from '@/components/mesure/MesureVue'
import { metadonneesPage } from '@/lib/site'
import Ecran1Zone from '../mobile/Ecran1Zone'
import PageVente from '../mobile/PageVente'
import PublicActivityToast from '@/components/home-premium/PublicActivityToast'
import BarreCollante from '../mobile/BarreCollante'

export const metadata: Metadata = metadonneesPage(
  '/chauffeur',
  'FOREAS Driver — Gagne plus. Roule moins.',
  'Découvre FOREAS Driver. Parle à Ajnaya, comprends le calcul d’une course et retrouve les outils pour ton activité de chauffeur VTC.',
)

/**
 * L’accueil chauffeur mobile validé est réutilisé, sans copie du contenu.
 * Seules les règles réservées aux écrans de 900 px et plus composent le bureau.
 * La donnée de route suit les échanges et les liens WhatsApp jusqu’au clic.
 */
export default function ChauffeurPage() {
  return (
    <main id="main-content" data-driver-page>
      <MesureVue page="/chauffeur" intention="ajnaya" audience="chauffeur" variante="chauffeur" />
      <Ecran1Zone lienWhatsApp="/wa?s=hero_zone" pageSource="/chauffeur" />
      <PageVente pageSource="/chauffeur" />
      <BarreCollante pageSource="/chauffeur" />
      <PublicActivityToast surface="driver" />
    </main>
  )
}
