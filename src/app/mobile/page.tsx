import type { Metadata } from 'next'
import Ecran1Zone from './Ecran1Zone'
import PageVente from './PageVente'
import BarreCollante from './BarreCollante'

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
 * ⚠️ INTROUVABLE SUR GOOGLE, ET C'EST MAINTENANT DÉFINITIF.
 * Le 06/09, Chandler a décidé que cette page devient l'accueil sur téléphone :
 * `/` sert désormais EXACTEMENT ces trois blocs à tout téléphone (bascule sur
 * l'en-tête `user-agent`, dans `src/app/page.tsx`). Le même contenu vit donc à
 * deux adresses. `/` est l'adresse canonique et la seule indexée ; laisser
 * celle-ci indexable créerait un doublon qui se ferait concurrence sur les
 * mêmes mots. Le `noindex` reste, pour cette raison-ci.
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

      {/* ══ 3 — LA BARRE ═════════════════════════════════════════════════════
          UNE porte sous le pouce dès que le hero est passé, et elle change en
          descendant : sa zone sur WhatsApp d'abord, l'essai après les trois
          arguments. Sans elle, la première porte WhatsApp de la page est au
          cinquième écran, et plus d'un visiteur mobile sur deux ne fait jamais
          défiler. */}
      <BarreCollante />

      {/* Les notifications de section ont été retirées le 05/09, sur demande :
          « on en discutera plus tard ». Le composant et sa feuille de style
          sont supprimés, pas commentés — un composant qu'on ne rend plus mais
          qu'on garde « au cas où » devient un faux témoin. Il est dans
          l'historique git, récupérable d'une commande. */}
    </>
  )
}
