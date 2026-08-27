/**
 * FOREAS — LES PHRASES DE LA PAGE DE PAIEMENT.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * TROIS RÈGLES, TOUTES POSÉES PAR CHANDLER, TOUTES VÉRIFIÉES AVANT D'ÉCRIRE ICI
 *
 * 1. LE DÉCLIC DANS LES CINQ PREMIERS MOTS.
 *    Elles s'affichent une par une, puis s'effacent. Un lecteur n'attrape que le
 *    début : une phrase dont la révélation arrive au bout est une phrase perdue.
 *
 * 2. UN ENFANT DE ONZE ANS DOIT COMPRENDRE.
 *    « Beaucoup de chauffeurs VTC sont issus de l'immigration, à ne pas
 *    oublier. » Ce n'est pas une préférence de style, c'est une contrainte de
 *    lecture : dans une langue qui n'est pas la première, une phrase qu'on doit
 *    relire deux fois ne se lit pas du tout.
 *    ❌ verbes réfléchis abstraits · ellipses et deux-points · mots de bureau
 *    ✅ les mots de sa facture : marge, charges, rentable, facturé, commission
 *
 * 3. AUCUN TUTOIEMENT. Troisième personne, ou constat.
 *    Une phrase qui tutoie S'ADRESSE, donc elle vend. Une phrase à la troisième
 *    personne CONSTATE. Un constat se laisse vérifier ; une adresse se laisse
 *    refuser. Sur une page de paiement, c'est la différence entre convaincre et
 *    argumenter.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⚠️ ET UNE QUATRIÈME, QUI NE SE VOIT PAS MAIS QUI PROTÈGE
 *
 * AUCUNE DE CES PHRASES NE PROMET UNE FONCTION DE L'APPLICATION.
 * Elles parlent du métier du chauffeur, jamais de ce que FOREAS sait faire.
 * C'est délibéré : `src/lib/verite-commerciale.ts` interdit déjà « en direct »,
 * « 7 plateformes », « on fait ta compta » — parce que ces promesses avaient été
 * mesurées fausses. Une phrase qui reste au niveau du métier ne peut pas devenir
 * fausse le jour où une fonction change.
 *
 * Si quelqu'un ajoute ici une phrase qui commence par « FOREAS », il change la
 * nature du fichier et doit d'abord prouver ce qu'il affirme.
 */

export interface PhrasePaiement {
  /** Le texte affiché, tel quel. */
  texte: string
  /**
   * `true` quand la phrase avance un chiffre de marché.
   *
   * ⚠️ CE DRAPEAU N'EST PAS DÉCORATIF : `phrasesAffichables()` retire ces
   * phrases tant que `SOURCES_MARCHE_PROUVEES` vaut `false`. Un chiffre sans
   * source affiché sur une page où l'on prend une carte bancaire, c'est
   * exactement le genre d'affirmation que le contrôle `npm run canon` existe
   * pour empêcher.
   */
  chiffreASourcer?: true
}

/**
 * Les sources des deux phrases chiffrées ne sont pas encore versées au dossier.
 *
 * Mesuré le 27/08 (recherche publique) : charges 30 à 50 % du chiffre
 * d'affaires · commissions Heetch 15-18 %, Bolt 19-20 %, Uber 23-25 % · une
 * baisse de 10 % des kilomètres à vide améliore le net de 5 à 8 %.
 *
 * C'est cohérent et probablement juste. Ce n'est pas une source opposable.
 * Le jour où Chandler verse les références, on passe ce drapeau à `true` et les
 * deux phrases apparaissent d'elles-mêmes.
 */
export const SOURCES_MARCHE_PROUVEES = false

export const PHRASES: readonly PhrasePaiement[] = [
  // ── Ce qui reste vraiment ────────────────────────────────────────────────
  { texte: 'L’argent qui rentre n’est pas celui qui reste.' },
  { texte: 'Une course payée peut faire perdre de l’argent.' },
  { texte: 'Une journée pleine n’est pas une journée rentable.' },

  // ── La décision ─────────────────────────────────────────────────────────
  { texte: 'Une course est rentable ou non avant d’être acceptée.' },
  { texte: 'Accepter une course engage l’heure qui suit.' },
  { texte: 'Prendre une course, c’est une décision. Pas un réflexe.' },

  // ── La plateforme et lui ────────────────────────────────────────────────
  { texte: 'Une plateforme cherche du volume. Un chauffeur cherche de la marge.' },
  { texte: 'Une commission plus basse ne garantit pas un meilleur revenu.', chiffreASourcer: true },
  { texte: 'Les plateformes comptent les courses. Personne ne compte le bénéfice.' },

  // ── Ce qui n'est pas facturé ────────────────────────────────────────────
  { texte: 'Le kilomètre à vide est à la charge du chauffeur.' },
  { texte: 'Le temps d’attente n’est facturé à personne.' },

  // ── Le statut ───────────────────────────────────────────────────────────
  { texte: 'Un chauffeur VTC dirige une entreprise, pas seulement un véhicule.' },
  { texte: 'Conduire s’apprend vite. Choisir ses courses, beaucoup moins.' },

  // ── Les chiffres ────────────────────────────────────────────────────────
  { texte: 'Les kilomètres à vide coûtent 5 à 8 % du net.', chiffreASourcer: true },
  { texte: 'La marge vient des décisions, pas des courses.' },
] as const

/**
 * Les phrases que la page a le droit d'afficher aujourd'hui.
 *
 * ⚠️ Ce filtre est la raison d'être du drapeau. Sans lui, `chiffreASourcer`
 * serait un commentaire — c'est-à-dire un vœu. Le dépôt a déjà payé le prix
 * d'un garde écrit puis jamais branché.
 */
export function phrasesAffichables(): readonly PhrasePaiement[] {
  if (SOURCES_MARCHE_PROUVEES) return PHRASES
  return PHRASES.filter((p) => !p.chiffreASourcer)
}
