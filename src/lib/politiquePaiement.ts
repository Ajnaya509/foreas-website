import { PRIX_MENSUEL_CENTIMES, PRIX_ANNUEL_CENTIMES, ESSAI_JOURS } from './offre'

/** Pure amount calculation. Account eligibility is verified by the server in
 * checkoutEligibility before both the preview and the actual checkout. Prices
 * and trial duration come only from offre.ts; no browser flag grants a trial. */

export type Formule = 'mensuel' | 'annuel'

/** HTTP data remains untrusted even when the server returned 200. Only the
 * calculator's complete, displayable shape may reach the payment summary. */
export function estDebitDuJour(value: unknown, formule: Formule): value is DebitDuJour {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const data = value as Record<string, unknown>
  if (typeof data.essai !== 'boolean') return false
  const expected = calculerDebitDuJour(formule, !data.essai, Date.now())
  for (const [key, field] of Object.entries(expected)) {
    if (key !== 'premierDebitISO' && data[key] !== field) return false
  }
  return data.essai
    ? typeof data.premierDebitISO === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(data.premierDebitISO) && Number.isFinite(Date.parse(data.premierDebitISO))
    : data.premierDebitISO === null
}

/**
 * Ce que l'offre annuelle représente ramené au mois.
 *
 * ⚠️ ON ARRONDIT VERS LE HAUT, ET CE N'EST PAS UN DÉTAIL COMPTABLE.
 *
 * 249,99 ÷ 12 = 20,8325 €. Deux arrondis possibles, deux conséquences opposées :
 *
 *   · 20,83 × 12 = 249,96 €  → le calcul du chauffeur tombe SOUS le prix réel.
 *                              Il découvre trois centimes qu'il n'avait pas vus.
 *                              Ça ressemble à un frais caché, même minuscule.
 *   · 20,84 × 12 = 250,08 €  → le calcul tombe AU-DESSUS du prix réel.
 *                              Il paie neuf centimes de moins que son estimation.
 *
 * UN PRIX AFFICHÉ NE DOIT JAMAIS ÊTRE PLUS BAS QUE CE QUI SERA PRÉLEVÉ.
 * `Math.ceil` est le seul arrondi qui respecte cette règle, et c'est pour ça
 * qu'il est ici plutôt que `Math.round`.
 */
export const EQUIVALENT_MENSUEL_ANNUEL_CENTIMES = Math.ceil(PRIX_ANNUEL_CENTIMES / 12)

/** Douze mensualités : la seule comparaison honnête pour un prix barré. */
export const REFERENCE_DOUZE_MOIS_CENTIMES = PRIX_MENSUEL_CENTIMES * 12

/** Le prix affiché sur la carte mensuelle. Même source que le serveur. */
export const PRIX_MENSUEL_AFFICHE_CENTIMES = PRIX_MENSUEL_CENTIMES

// The caller supplies the personal decision from checkoutEligibility.
// Explicit direct reactivation can waive a new account's trial.
// There is no public boolean able to grant an already-used trial again.

/** Ce que le serveur accorde, tel que la page a le droit de l'afficher. */
export interface DebitDuJour {
  formule: Formule
  /** Vrai seulement si le serveur pose réellement un `trial_end`. */
  essai: boolean
  joursEssai: number | null
  /** Prélevé à la seconde où le chauffeur valide. Zéro pendant un essai. */
  montantAujourdhuiCentimes: number
  /** Prélevé ensuite, à chaque échéance. */
  montantEnsuiteCentimes: number
  periodicite: 'mois' | 'an'
  /** Date du premier vrai débit. `null` quand il a lieu tout de suite. */
  premierDebitISO: string | null
  /** Durée d'engagement affichée à droite du récapitulatif. */
  moisEngages: number
  /**
   * Ce que douze mois coûteraient au tarif mensuel.
   * `null` sur la formule mensuelle : il n'y a alors rien à comparer, et un
   * prix barré sans comparaison honnête est une manipulation.
   */
  referenceMensuelleCentimes: number | null
  /** L'économie, calculée. Jamais saisie. */
  economiePct: number | null
  /** L'annuel ramené au mois, arrondi VERS LE HAUT (voir la constante). */
  equivalentMensuelCentimes: number | null
}

/**
 * ⚠️ POURQUOI L'ARRONDI EST À UNE DÉCIMALE, ET PAS À L'ENTIER.
 *
 * 109,89 / 359,88 = 30,535 %. Arrondi à l'entier cela donnerait « −31 % », un
 * chiffre plus flatteur que la réalité. Le brief demande « −30,5 % ». On garde
 * donc la décimale, et on arrondit vers le bas quand le doute existe : une
 * remise annoncée plus grande qu'elle n'est, c'est une promesse en trop.
 */
function pourcentageEconomie(referenceCentimes: number, payeCentimes: number): number {
  const brut = ((referenceCentimes - payeCentimes) / referenceCentimes) * 100
  return Math.floor(brut * 10) / 10
}

/**
 * Le calcul, à un instant donné.
 *
 * `maintenantMs` est un paramètre et non un `Date.now()` caché : une fonction
 * qui lit l'horloge toute seule ne peut pas être testée, et la date du premier
 * débit est précisément ce qu'il faut pouvoir vérifier.
 */
/**
 * L'économie annuelle en pourcentage, calculée une fois pour l'affichage de la
 * carte. Le même calcul que dans `calculerDebitDuJour` — mais la carte doit
 * pouvoir l'afficher AVANT que le serveur ait répondu, sinon le badge
 * apparaîtrait après coup et la carte sauterait.
 */
export const ECONOMIE_ANNUELLE_PCT = pourcentageEconomie(
  REFERENCE_DOUZE_MOIS_CENTIMES,
  PRIX_ANNUEL_CENTIMES,
)

export function calculerDebitDuJour(
  formule: Formule,
  immediat: boolean,
  maintenantMs: number,
): DebitDuJour {
  const annuel = formule === 'annuel'
  const montantPlein = annuel ? PRIX_ANNUEL_CENTIMES : PRIX_MENSUEL_CENTIMES
  const essai = !immediat

  const premierDebitISO = essai
    ? new Date(maintenantMs + ESSAI_JOURS * 24 * 60 * 60 * 1000).toISOString()
    : null

  const referenceMensuelleCentimes = annuel ? PRIX_MENSUEL_CENTIMES * 12 : null

  return {
    formule,
    essai,
    joursEssai: essai ? ESSAI_JOURS : null,
    montantAujourdhuiCentimes: essai ? 0 : montantPlein,
    montantEnsuiteCentimes: montantPlein,
    periodicite: annuel ? 'an' : 'mois',
    premierDebitISO,
    moisEngages: annuel ? 12 : 1,
    referenceMensuelleCentimes,
    economiePct:
      referenceMensuelleCentimes !== null
        ? pourcentageEconomie(referenceMensuelleCentimes, montantPlein)
        : null,
    equivalentMensuelCentimes: annuel ? EQUIVALENT_MENSUEL_ANNUEL_CENTIMES : null,
  }
}

/**
 * Ce que la page envoie dans le champ `plan` du POST vers `/api/checkout`.
 *
 * ⚠️ On envoie le nom CANONIQUE, pas un alias hérité.
 *
 * `resoudreFormule()` (src/lib/offre.ts, ligne 63) accepte six écritures :
 * `pro_monthly`, `pro_annual`, `monthly`, `annual`, `mensuel`, `annuel`. Les
 * quatre premières sont des restes d'une grille tarifaire retirée en juillet, et
 * le dépôt a déjà payé cher le fait de les promener : la chaîne envoyée par le
 * navigateur finissait dans les métadonnées Stripe, donc dans le mail de
 * bienvenue et chez les régies publicitaires, sous un nom d'offre qui n'existait
 * plus.
 *
 * On envoie donc exactement le mot que le serveur va réécrire après résolution.
 * Demande et décision deviennent identiques : plus rien à désynchroniser.
 */
export function planPourCheckout(formule: Formule): Formule {
  return formule
}
