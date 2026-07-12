import { Metadata } from 'next'
import ExperienceClient from './ExperienceClient'

export const metadata: Metadata = {
  title: 'FOREAS — Discute avec Ajnaya',
  description: "Écris à Ajnaya, en direct. Pas une démo : le vrai chat qui aide les chauffeurs VTC à savoir où ça paie ce soir.",
  // noindex tant que les sections features sont des illustrations CSS (pas encore les vraies
  // vidéos Screen Studio) — à retirer une fois la page validée par Chandler + vidéos posées.
  robots: { index: false, follow: true },
}

/**
 * /experience — page "découverte produit" mobile-first (A/B vs la home).
 * Voir ExperienceClient.tsx pour le détail. Brief : conversation FOREAS-SHARED (pas de doc dédié
 * encore — session Chandler du jour, "téléphone vivant" + pricing 29,99€).
 */
export default function ExperiencePage() {
  return <ExperienceClient />
}
