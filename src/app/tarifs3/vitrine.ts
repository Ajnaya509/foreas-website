/**
 * FOREAS — LES VISUELS DE LA COLONNE DE DROITE (bureau uniquement).
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⚠️ CE FICHIER NE CONTIENT QUE DES CAPTURES RÉELLES DE L'APPLICATION.
 *
 * Chandler a demandé « le mockup Rotato reprenant les multiples fonctionnalités ».
 * Mesuré le 27/08 : AUCUN export Rotato n'existe dans le dépôt — ni dans
 * `public/`, ni ailleurs. Construire la colonne autour d'images qui n'existent
 * pas aurait produit une page qui marche chez moi et casse partout ailleurs.
 *
 * Les deux visuels ci-dessous sont en revanche de vraies captures, déjà servies
 * par l'accueil (`src/components/experience/`). Elles montrent l'application
 * telle qu'elle est, pas telle qu'on l'imagine.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POUR AJOUTER UN EXPORT ROTATO
 *
 * Déposer le fichier dans `public/vitrine/`, puis ajouter une entrée ici. Rien
 * d'autre : la colonne s'adapte au nombre d'entrées, les pastilles de navigation
 * se construisent toutes seules.
 *
 * Format attendu : portrait, **au moins 640 px de large**, moins de 150 Ko.
 *
 * ⚠️ LA LARGEUR N'EST PAS UNE PRÉFÉRENCE, ELLE FIXE LA TAILLE D'AFFICHAGE.
 * Sur un écran à forte densité, afficher L pixels CSS réclame 2 × L pixels
 * réels. Les captures actuelles font 420 px : elles ne peuvent donc pas dépasser
 * 210 px à l'écran sans devenir molles — et c'est la seule raison pour laquelle
 * le téléphone de la colonne de droite est petit.
 *   source 640 px  → affichage net jusqu'à 320 px
 *   source 840 px  → affichage net jusqu'à 420 px
 * Un export Rotato en PNG transparent est l'idéal : le halo passe alors AUTOUR
 * de l'appareil au lieu de s'arrêter à un rectangle.
 * Au-delà, le visuel devient plus lourd que le reste de la page — et cette page
 * est celle où l'on prend une carte bancaire : elle doit s'afficher vite.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⚠️ RÈGLE SUR LES LÉGENDES
 *
 * Elles décrivent CE QUI EST À L'ÉCRAN, jamais ce que le produit promet.
 * « Le verdict arrive sur l'écran de la course » se vérifie en regardant l'image.
 * « Ajnaya lit sept plateformes en direct » ne se vérifie nulle part — et c'est
 * déjà interdit par `src/lib/verite-commerciale.ts`.
 */

export interface VisuelVitrine {
  /** Chemin public de l'image d'attente. Toujours présent, même pour une vidéo. */
  poster: string
  /** Chemin de la vidéo, si le visuel est animé. Absent = image fixe. */
  video?: string
  largeur: number
  hauteur: number
  /** Texte alternatif : ce qu'un lecteur d'écran doit entendre. */
  alt: string
  /** Le titre de la fonctionnalité. Court. */
  titre: string
  /** Une phrase. Ce qui est visible à l'écran, rien de plus. */
  description: string
}

export const VITRINE: readonly VisuelVitrine[] = [
  /* ═══ LES DEUX EXPORTS ROTATO DE CHANDLER (27/08) ═══════════════════════
     ⚠️ ILS ONT UN FOND BLANC, ET C'EST LA SEULE RAISON DU PANNEAU CLAIR.
     Rotato exporte par défaut sur fond blanc. Mesuré : les quatre coins sont
     à #FFFFFF exactement. J'ai tenté de le détourer — `colorkey` sur le blanc
     pur laisse l'OMBRE PORTÉE, qui est un dégradé de gris et non du blanc.
     Et tout seuil assez large pour l'effacer mange aussi le cadre argenté du
     téléphone et la bannière de notification.
     Le panneau clair n'est donc pas un choix esthétique : c'est ce que le
     matériau permet. Un export « fond transparent » depuis Rotato ferait
     flotter le téléphone directement sur le noir, halo passant autour.

     ⚠️ POIDS : les sources font 18 et 30 Mo. Sur une page où quelqu'un sort sa
     carte bancaire, c'est inacceptable. Recadrées en portrait sur le téléphone,
     réduites à 540 px et ramenées à 30 images par seconde, elles pèsent 205 et
     390 Ko — soit 1 % de la source, sans perte visible à la taille d'affichage.
  */
  {
    video: '/vitrine/alerte-communaute.mp4',
    poster: '/vitrine/alerte-communaute.jpg',
    largeur: 540,
    hauteur: 796,
    alt: 'Carte de l’application avec une alerte de contrôle signalée par un autre chauffeur.',
    titre: 'L’alerte tombe sur la carte.',
    description:
      'Un contrôle signalé par un collègue, à quatre cents mètres. Elle arrive là où le chauffeur regarde déjà.',
  },
  {
    video: '/vitrine/fil-collegues.mp4',
    poster: '/vitrine/fil-collegues.jpg',
    largeur: 540,
    hauteur: 796,
    alt: 'Fil de discussion entre chauffeurs, avec un bouton pour signaler à son tour.',
    titre: 'Le fil des collègues.',
    description:
      'Ce que les autres voient sur le terrain, écrit en clair. Et un bouton pour signaler à son tour.',
  },

  /* ═══ LA PLACE DES PROCHAINS EXPORTS ════════════════════════════════════
     Les deux captures brutes de l'accueil (`coach-accepte`, `boers-cdg`) ont été
     RETIRÉES d'ici le 27/08. Elles montrent de vraies fonctionnalités — le
     verdict avant d'accepter, la zone qui paie — mais ce sont des captures
     d'écran SANS CADRE D'APPAREIL. Posées dans le même panneau que les mockups
     Rotato, elles remplissaient la surface d'un bord à l'autre et cassaient
     l'unité : deux photos de produit à côté de deux copies d'écran.

     Elles reviendront le jour où elles existent en mockup Rotato. Le fichier est
     prêt : une entrée de plus, et la colonne s'adapte toute seule.
  */
] as const
