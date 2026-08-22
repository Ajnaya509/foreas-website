/**
 * FOREAS — LES CINQ PARCOURS. UNE SEULE DÉCLARATION, LUE PAR LES CONTRÔLES.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POURQUOI CE FICHIER EST DU CODE ET PAS UN DOCUMENT
 *
 * Un tableau dans un document Markdown vieillit sans prévenir : personne ne le
 * relit, rien ne le contredit, et il finit par décrire un site qui n'existe
 * plus. Ce dépôt en a la preuve — plusieurs commentaires y affirmaient des
 * choses fausses depuis des semaines, y compris « toute surface qui affiche une
 * citation lit maintenant cette fonction », alors qu'une page la recopiait.
 *
 * Ce manifeste est lu par `npm run canon` : si une page mère disparaît, si une
 * route de boutique s'en va, ou si une page cesse de compter sa vue, la
 * vérification échoue. Le document, lui, se GÉNÈRE à partir d'ici.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CE QU'UN PARCOURS EST, ET CE QU'IL N'EST PAS
 *
 * Un parcours n'est pas une catégorie de pages : c'est UNE phrase qu'un
 * chauffeur se dit dans sa voiture, et le chemin qui y répond. Une page
 * secondaire n'existe que si elle répond à une question DISTINCTE de celle de sa
 * page mère. « Trois mots différents » ne fait pas une page.
 *
 * ⚠️ L'ÉTAT EST DÉCLARATIF ET HONNÊTE. `bloque` ne veut pas dire « en retard » :
 * il veut dire qu'il manque quelque chose qu'on ne peut pas fabriquer ici.
 */

import type { Intention } from '@/lib/mesure'

export type EtatParcours = 'brouillon' | 'test' | 'publie' | 'bloque' | 'retire'

export interface Parcours {
  /** L'identifiant, qui sert aussi de suffixe à la route de boutique. */
  id: Extract<Intention, 'rentabilite' | 'zones' | 'clientele' | 'ajnaya' | 'communaute'>
  /** La phrase que le chauffeur se dit. Pas un slogan : ce qu'il pense vraiment. */
  question: string
  /** La page qui répond. Une seule. */
  pageMere: string
  /** Celles qui répondent à une question distincte. Les autres fusionnent. */
  pagesSecondaires: readonly string[]
  /** Ce qu'on promet, mot pour mot. C'est cette phrase qui se compare, pas un résumé. */
  promesse: string
  /** Ce qui prouve la promesse — ou pourquoi rien ne la prouve encore. */
  preuve: string
  /** L'action principale. Toujours l'offre. */
  action: string
  /** La route qui envoie vers la boutique. */
  routeBoutique: string
  /** L'état réel, sans complaisance. */
  etat: EtatParcours
  /** Ce qui manque pour passer à l'état suivant. Vide si rien ne manque. */
  bloque: readonly string[]
}

export const PARCOURS: readonly Parcours[] = [
  {
    id: 'rentabilite',
    question: 'Je roule beaucoup et il ne me reste rien.',
    pageMere: '/revenus',
    pagesSecondaires: ['/charges', '/ou-ca-paie'],
    promesse: 'Vois ce qu’il te reste, avec TES chiffres — pas une moyenne.',
    preuve:
      'Le calculateur de l’accueil, depuis le 21/08 : le chauffeur saisit sa course et SA commission, et la formule est écrite sous le résultat. Aucun taux inventé.',
    action: '/tarifs2',
    routeBoutique: '/go/rentabilite',
    etat: 'bloque',
    bloque: [
      'trois taux de commission coexistent dans FOREAS, aucun mesuré — décision Chandler',
      // ⚠️ 21/08/2026 (soir) — LA LIGNE SUIVANTE ÉTAIT PÉRIMÉE, ET RETIRÉE.
      //
      // Elle disait « /revenus affiche encore 18,75 € sur une course de 25 € ».
      // Mesuré ce soir sur la production : la chaîne « 18,75 » est ABSENTE de
      // /revenus, /surge, /clients, /experience et /cap. Le calcul a bien été
      // retiré — c'est le manifeste qui n'avait pas suivi.
      //
      // Ce fichier est du CODE, lu par `npm run canon`. Un manifeste qui décrit
      // un blocage résolu fait travailler quelqu'un pour rien — et, pire, fait
      // douter des blocages qui sont réels.
    ],
  },
  {
    id: 'zones',
    question: 'Je tourne à vide, je ne sais pas où aller.',
    pageMere: '/surge',
    pagesSecondaires: ['/aeroport', '/evenements'],
    promesse: 'Tape ta zone, vois ce qui s’y est vraiment payé à cette heure-ci.',
    preuve:
      'Le champ de recherche de l’accueil répond avant tout engagement. L’ouverture de la fenêtre Ajnaya est comptée depuis le 21/08 — avant, elle n’était comptée nulle part.',
    action: '/tarifs2',
    routeBoutique: '/go/zones',
    etat: 'test',
    bloque: [],
  },
  {
    id: 'clientele',
    question: 'Je ne veux plus dépendre de la plateforme.',
    pageMere: '/clients',
    pagesSecondaires: ['/airbnb', '/premium', '/professionnels'],
    promesse: 'Ta clientèle à toi, réservée en direct, sans commission de plateforme.',
    preuve:
      'Aucune preuve mesurée pour l’instant. Le formulaire de contact fonctionne depuis le 21/08 — avant, il n’envoyait rien, et tout le B2B du site tombait là.',
    action: '/tarifs2',
    routeBoutique: '/go/clientele',
    etat: 'brouillon',
    bloque: [
      'quatre pages pour une seule question tant qu’aucune n’a produit un contact mesuré',
    ],
  },
  {
    id: 'ajnaya',
    question: 'Encore une appli qui va me sortir des graphiques.',
    // 22/08 — le parcours Ajnaya part désormais de l'accueil : `/experience`
    // redirige vers `/`. Laisser l'ancienne adresse ici aurait fait échouer la
    // règle de canon qui vérifie que chaque page mère répond.
    pageMere: '/',
    pagesSecondaires: ['/technologie'],
    promesse: 'Une conversation, pas un tableau de bord de plus.',
    preuve:
      '36 conversations enregistrées dans widget_conversations. C’est le seul endroit du site où quelqu’un a réellement interagi.',
    action: '/tarifs2',
    routeBoutique: '/go/ajnaya',
    etat: 'test',
    bloque: [],
  },
  {
    id: 'communaute',
    question: 'Qui d’autre l’utilise vraiment ?',
    pageMere: '/cap',
    pagesSecondaires: [],
    promesse: 'Aucune promesse tant que les accords manquent.',
    preuve:
      'AUCUNE. Six chauffeurs ont été filmés à visage découvert ; les six accords sont « en attente », sans preuve enregistrée. Toutes les preuves sociales du site sont masquées depuis le 21/08.',
    action: '/tarifs2',
    routeBoutique: '/go/communaute',
    etat: 'bloque',
    bloque: [
      'six accords de témoignage écrits — c’est la seule action qui rende au site sa preuve sociale',
    ],
  },
] as const

/** Toutes les pages qui doivent exister et compter leur vue. */
export function pagesDesParcours(): string[] {
  return PARCOURS.flatMap((p) => [p.pageMere, ...p.pagesSecondaires])
}

/** Toutes les routes de boutique qui doivent répondre. */
export function routesBoutique(): string[] {
  return PARCOURS.map((p) => p.routeBoutique)
}
