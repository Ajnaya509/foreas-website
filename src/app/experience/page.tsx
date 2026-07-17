import { Metadata } from 'next'
import { headers } from 'next/headers'
import ExperienceClient from './ExperienceClient'

export const metadata: Metadata = {
  title: 'FOREAS — Discute avec Ajnaya',
  description: "Écris à Ajnaya, en direct. Pas une démo : le vrai chat qui aide les chauffeurs VTC à savoir où ça paie ce soir.",
  // ⚠️ noindex tant que les sections features sont des placeholders (pas encore les vraies vidéos
  // Screen Studio). CHECKLIST DE BASCULE EN PAGE PRINCIPALE (acte conscient, go explicite Chandler
  // + vraies vidéos posées) — sinon le site disparaît de Google en silence :
  //   1. robots.index → true (retirer cette ligne, laisser le défaut indexable)
  //   2. ajouter alternates.canonical = 'https://foreas.xyz/' (ou l'URL finale)
  //   3. ajouter openGraph + og:image (partage réseaux)
  //   4. vérifier que les events PostHog experience_* sont bien branchés
  robots: { index: false, follow: true },
}

/**
 * /experience — page "découverte produit" mobile-first (A/B vs la home).
 * Voir ExperienceClient.tsx pour le détail. Brief : conversation FOREAS-SHARED (pas de doc dédié
 * encore — session Chandler du jour, "téléphone vivant" + pricing 29,99€).
 */
export default async function ExperiencePage() {
  // Ville détectée silencieusement par Vercel (en-tête edge, aucune permission demandée au
  // visiteur) — biaise l'ordre des zones proposées dans le téléphone vivant. Fail-open : si
  // l'en-tête est absent (dev local, host non-Vercel), on retombe sur l'ordre national par défaut.
  const h = await headers()
  const geoCity = h.get('x-vercel-ip-city') || null
  return <ExperienceClient geoCity={geoCity} />
}
