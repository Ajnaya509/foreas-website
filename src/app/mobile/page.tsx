import type { Metadata } from 'next'
import Ecran1Zone from './Ecran1Zone'
import PageVente from './PageVente'

/**
 * L'ACCUEIL MOBILE — deux temps, et une ligne entre les deux.
 *
 *   1. LE HERO     il tape sa zone, la réponse s'affiche.
 *   2. LA VENTE    trente sections, cinq boutons, une seule animation.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⚠️ LA VIDÉO DE L'HABITACLE A ÉTÉ RETIRÉE LE 04/09, SUR DEMANDE DE CHANDLER.
 *
 * Elle occupait un écran entier entre les deux — une scène d'habitacle qui
 * zoomait jusqu'à ce que l'écran noir du téléphone filmé remplisse celui du
 * visiteur, puis une notification apparaissait dedans. Techniquement juste,
 * mais elle coûtait un plein écran de noir avant la première phrase qui vend,
 * et c'est ce noir que Chandler voulait voir disparaître.
 *
 * Le composant `Soudure` et sa feuille de style sont supprimés plutôt que
 * laissés en place : un composant qu'on ne rend plus mais qu'on garde « au
 * cas où » devient un faux témoin — quelqu'un le lira un jour en croyant
 * qu'il décrit la page. Il reste dans l'historique git, récupérable d'une
 * commande. La vidéo elle-même reste dans `/public/demo/habitacle.*`.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CE QUI SÉPARE LES DEUX SECTIONS
 *
 * Une ligne courte, centrée, violet · cyan · violet, posée au bas du hero.
 * Elle ne traverse pas l'écran : une barre pleine largeur se lit comme un
 * bord de page, une barre courte se lit comme une respiration.
 *
 * ⚠️ INTROUVABLE SUR GOOGLE tant que Chandler n'a pas dit qu'elle remplace `/`.
 */
export const metadata: Metadata = {
  title: 'FOREAS Driver — aperçu mobile',
  robots: { index: false, follow: false, nocache: true },
}

export default function AccueilMobile() {
  return (
    <>
      {/* ══ 1 — LE HERO ══════════════════════════════════════════════════════
          Il passe devant tout : moins d'un visiteur mobile sur deux fait
          défiler une page. Le geste demandé est un nom de lieu qu'il connaît
          par cœur. La réponse vend, et elle ne lit aucune table.
          Il ne prend pas toute la hauteur : la première phrase de la vente
          dépasse en bas, et le pouce suit tout seul. */}
      <Ecran1Zone lienWhatsApp="/wa?s=hero_zone" />

      {/* ══ 2 — LA VENTE ═════════════════════════════════════════════════════ */}
      <PageVente />
    </>
  )
}
