import { Metadata } from 'next'
import CapClient from './CapClient'

import MesureVue from '@/components/mesure/MesureVue'
export const metadata: Metadata = {
  title: 'Rejoindre FOREAS — Offre partenaire',
  description: 'Votre partenaire vous a invité à rejoindre FOREAS, le copilote des chauffeurs VTC.',
  robots: { index: false, follow: false }, // No public indexing for partner landings
}

interface PageProps {
  searchParams: Promise<{ ref?: string }>
}

// Fetch partner landing data server-side (Railway public endpoint)
async function fetchPartnerLanding(referralCode: string) {
  try {
    const res = await fetch(
      `https://foreas-stripe-backend-production.up.railway.app/api/public/partners/${encodeURIComponent(referralCode)}/landing`,
      {
        next: { revalidate: 300 }, // Cache 5 min
        headers: { 'Accept': 'application/json' },
      }
    )
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

export default async function CapPage({ searchParams }: PageProps) {
  const { ref } = await searchParams
  const referralCode = ref?.trim().toUpperCase() || null

  // Fetch partner data if we have a code
  const partnerData = referralCode ? await fetchPartnerLanding(referralCode) : null

  // ⚠️ 21/08/2026 — CETTE PAGE NE S'AFFICHAIT PAS.
  //
  // Elle répondait 200 et servait 612 mots de HTML. Un `curl` la déclarait
  // saine. Dans un navigateur, un visiteur voyait VINGT-HUIT CARACTÈRES :
  // « FOREAS/ Toujours plus loin. », le voile d'accueil, et rien derrière.
  //
  // Cause : la frontière `<Suspense fallback={null}>` ci-dessous. Les deux
  // données de la page sont DÉJÀ attendues quatre lignes plus haut
  // (`await searchParams`, `await fetchPartnerLanding`) — cette frontière
  // n'attendait donc rien. Mais elle suffisait à faire livrer le contenu dans
  // une zone de préparation masquée, que le navigateur ne révélait jamais :
  // le conteneur de `<main>` restait en `display: none`.
  //
  // ⚠️ AVEC UN REPLI À `null`, L'ÉCHEC EST INVISIBLE. Un repli qui affiche
  // quelque chose aurait montré un écran d'attente bloqué — donc un bug. Un
  // repli à `null` montre une page vide, ce qui ressemble à une page qui charge.
  // Personne ne l'a vu, et la mesure automatique non plus : elle regarde le HTML
  // servi, où le texte est bien présent.
  //
  // Vérifié en bissectant : la page était déjà ainsi AVANT les modifications du
  // 21/08. Ce n'est pas une régression du jour, c'est une panne installée.
  return (
    <>
      {/* La vue de cette page est comptée. Avant le 21/08/2026, aucune des dix
          pages commerciales n'avait de compteur : on connaissait les abonnements,
          jamais la page qui les avait produits. */}
      <MesureVue page="/cap" intention="partenaire" audience="partenaire" />
      <CapClient
        referralCode={referralCode}
        partnerData={partnerData}
      />
    </>
  )
}
