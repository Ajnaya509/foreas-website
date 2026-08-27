import { PRIX_MENSUEL_CENTIMES, PRIX_ANNUEL_CENTIMES, ESSAI_JOURS } from './offre'

/**
 * FOREAS — CE QUI EST RÉELLEMENT PRÉLEVÉ AUJOURD'HUI.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POURQUOI CE FICHIER EXISTE
 *
 * Le brief de la page de paiement pose une règle en toutes lettres :
 *
 *     « ne jamais déduire l'essai dans le navigateur »
 *     « afficher 3 jours accordés seulement après confirmation du serveur »
 *
 * Et la maquette retenue, elle, montre « 249,99 € aujourd'hui ».
 *
 * ⚠️ CES DEUX PHRASES SE CONTREDISENT SUR LE SITE D'AUJOURD'HUI.
 *
 * Mesuré dans le dépôt : le tunnel du site part avec `IMMEDIATE_PAYMENT = false`
 * (src/app/tarifs2/page.tsx). Donc `POST /api/checkout` pose un `trial_end` de
 * trois jours, et le chauffeur est débité de **0 € aujourd'hui**, puis du montant
 * plein trois jours plus tard.
 *
 * Écrire « 249,99 € aujourd'hui » en dur dans la page aurait donc produit un
 * chiffre faux — plausible, joli, et faux. C'est exactement le mécanisme que le
 * dépôt combat depuis des semaines : une valeur recopiée dans un `.tsx`, plus
 * reliée à rien, qui affirme.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CE QUE CE FICHIER FAIT
 *
 * Il calcule le débit du jour à partir des DEUX seules constantes qui décident
 * vraiment du montant — celles que `POST /api/checkout` utilise pour construire
 * son `price_data`. Il ne décide rien : il rapporte.
 *
 * Aucun montant, aucun pourcentage, aucune date n'est écrit à la main ici.
 * `359,88 €` et `−30,5 %` sont des RÉSULTATS. C'est la seule parade certaine
 * contre le « 359,58 € » que le brief interdit : un chiffre qu'on ne tape jamais
 * ne peut pas être tapé de travers.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CE QU'IL NE FAIT PAS
 *
 * Il ne touche à aucune règle de prix, d'essai, d'abonnement ou de paiement.
 * Il n'appelle pas Stripe. Il ne lit aucun secret. Il est pur.
 */

export type Formule = 'mensuel' | 'annuel'

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

/**
 * Le tunnel que le site emprunte réellement.
 *
 * ⚠️ Cette valeur est en miroir de `IMMEDIATE_PAYMENT` dans
 * `src/app/tarifs2/page.tsx`, et c'est elle qui part dans le corps du POST vers
 * `/api/checkout` sous le nom `immediate`.
 *
 * `false` = essai de trois jours, 0 € aujourd'hui.
 * `true`  = encaissement comptant, montant plein aujourd'hui.
 *
 * Le jour où Chandler bascule le site en comptant, il change CE booléen, et la
 * page de paiement dit la vérité toute seule — récapitulatif, bouton, date de
 * premier débit. Rien d'autre à modifier.
 */
export const TUNNEL_SITE_IMMEDIAT = false

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
