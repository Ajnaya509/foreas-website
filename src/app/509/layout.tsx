import type { Metadata } from 'next'

/**
 * FOREAS — L'ESPACE /509 NE S'INDEXE PAS.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CE QUI ÉTAIT SERVI AVANT LE 21/08/2026
 *
 * Mesuré en production : `/509`, `/509/dashboard/admin`, `/509/dashboard/partner`
 * et leurs voisines répondaient toutes **200**, publiquement, en servant
 * `<meta name="robots" content="index, follow">`.
 *
 * Le mécanisme : `src/app/layout.tsx` pose `robots: { index: true, follow: true }`
 * à la racine, et seules huit pages sur trente-neuf le redéclarent. Aucune console
 * n'en faisait partie.
 *
 * ⚠️ `robots.txt` porte bien `Disallow: /509`. Ce n'est PAS le même filet : il
 * demande de ne pas PARCOURIR la page. Il n'empêche pas de l'indexer si son
 * adresse est trouvée ailleurs — et comme le robot ne télécharge pas la page, il
 * ne lit jamais l'instruction qu'elle contient. Les deux protections ensemble
 * peuvent donc s'annuler.
 *
 * Ce fichier pose l'instruction dans la page elle-même, à un endroit dont toute
 * la descendance hérite. Une console interne ajoutée demain sous /509 sera
 * couverte sans que personne ait à y penser.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function LayoutEspace509({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
