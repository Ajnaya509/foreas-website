import { Metadata } from 'next'
import DriverReviewsClient from './DriverReviewsClient'

export const metadata: Metadata = {
  title: 'Avis vérifiés · FOREAS',
  robots: { index: false, follow: false }, // page par chauffeur (QR) — pas de SEO tant que la carte complète n'existe pas
}

/**
 * /c/[slug] — page publique d'avis chauffeur (QR/lien).
 * Coquille : rend un composant CLIENT qui fetch /api/reviews/public?slug= (endpoint = lecture service).
 * Brief : FOREAS-SHARED/briefs/AJNAYA_AFFICHAGE_AVIS_SITE.md
 */
export default async function DriverReviewsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return <DriverReviewsClient slug={slug} />
}
