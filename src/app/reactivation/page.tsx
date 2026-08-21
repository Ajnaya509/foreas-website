import { Metadata } from 'next'
import ReactivationClient from './ReactivationClient'

import MesureVue from '@/components/mesure/MesureVue'
export const metadata: Metadata = {
  title: 'FOREAS — Reprends la main',
  // La garantie n'est plus annoncée tant que son mécanisme n'est pas prouvé —
  // voir GARANTIE_30J dans src/lib/verite-commerciale.ts. Elle reste due au contrat.
  description: 'Paiement immédiat, résiliable à tout moment. Gagne plus, roule moins.',
  robots: { index: false, follow: false }, // page de campagne (lien email) — pas d'indexation
}

export default function ReactivationPage() {
  return (
    <>
      {/* La vue de cette page est comptée. Avant le 21/08/2026, aucune des dix
          pages commerciales n'avait de compteur : on connaissait les abonnements,
          jamais la page qui les avait produits. */}
      <MesureVue page="/reactivation" intention="general" audience="chauffeur" />
      <ReactivationClient />
    </>
  )
}
