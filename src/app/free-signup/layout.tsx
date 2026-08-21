import type { Metadata } from 'next'

/**
 * FOREAS — CETTE PAGE VEND UN PALIER QUI N'EXISTE PLUS.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * LE FAIT, MESURÉ LE 21/08/2026
 *
 * `/free-signup` propose « Activer mon Free », « aucune CB demandée ». Or
 * `src/lib/offre.ts` ne vend que deux formules : 29,99 €/mois et 249,99 €/an.
 * Le commentaire de `src/app/tarifs2/page.tsx` le dit noir sur blanc :
 * « Une seule offre → plus de branche Free ».
 *
 * La page répondait 200, se déclarait `index, follow`, n'était bloquée par aucun
 * `robots.txt`, et **n'est liée depuis nulle part** — le seul lien qui y menait a
 * été retiré avec l'offre. Elle n'est pas non plus au plan du site.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CE QUE FAIT CE FICHIER, ET CE QU'IL NE FAIT PAS
 *
 * IL FAIT : retirer de l'index une page qui propose un produit que FOREAS ne
 * vend pas. Ça, ce n'est pas un arbitrage — c'est un fait.
 *
 * IL NE FAIT PAS : décider du sort de la page. La supprimer casserait tout lien
 * externe ou toute campagne qui pointerait encore dessus, et **personne ne peut
 * vérifier d'ici si c'est le cas** : le trafic par page n'est pas mesurable avec
 * les outils dont nous disposons. « Inconnu » n'est pas « nul ».
 *
 * ⏳ DÉCISION QUI APPARTIENT À CHANDLER : le palier gratuit est-il encore un
 * levier d'acquisition ? Si oui, cette page a besoin d'un titre, d'un contenu et
 * d'une place au plan du site. Si non, elle se supprime avec une redirection.
 * Aucune des deux réponses ne se déduit du code.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function LayoutInscriptionGratuite({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
