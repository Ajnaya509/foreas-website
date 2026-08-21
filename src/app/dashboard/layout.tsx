/**
 * FOREAS — LES CONSOLES INTERNES NE S'INDEXENT PAS.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * MESURÉ EN PRODUCTION LE 21/08/2026
 *
 * `/dashboard/admin`, `/dashboard/partner`, `/dashboard/driver` et leurs jumelles
 * sous `/509` répondaient toutes **200**, sans authentification, en servant
 * `<meta name="robots" content="index, follow">`.
 *
 * Le mécanisme : `src/app/layout.tsx` pose `robots: { index: true, follow: true }`
 * à la racine, et seules huit pages sur trente-neuf le redéclarent. Aucune console
 * n'en faisait partie.
 *
 * ⚠️ `robots.txt` porte bien `Disallow: /dashboard`. Ce n'est PAS le même filet.
 * Il demande de ne pas PARCOURIR la page ; il n'empêche pas de l'indexer si son
 * adresse est trouvée ailleurs. Et comme le robot ne télécharge pas la page, il ne
 * lit jamais l'instruction qu'elle contient : les deux protections ensemble peuvent
 * s'annuler au lieu de s'ajouter.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POURQUOI CE FICHIER EST UN COMPOSANT SERVEUR
 *
 * Une page ou un layout côté navigateur ne peut PAS déclarer de métadonnées. Le
 * décor de la console (barre latérale, navigation) a donc été déplacé dans son
 * propre fichier `ChromeTableauDeBord.tsx`, qui reste côté navigateur. Ce
 * layout-ci ne fait que deux choses : poser l'instruction, et l'envelopper.
 */
import type { Metadata } from 'next'
import ChromeTableauDeBord from './ChromeTableauDeBord'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function LayoutTableauDeBord({ children }: { children: React.ReactNode }) {
  return <ChromeTableauDeBord>{children}</ChromeTableauDeBord>
}
