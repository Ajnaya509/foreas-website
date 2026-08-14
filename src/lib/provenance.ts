/**
 * FOREAS — PROVENANCE. D'où vient le chiffre qu'on montre au chauffeur.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POURQUOI CE FICHIER EXISTE (constat du 14/08/2026)
 *
 * La « Première Valeur » du site, c'est le moment où un chauffeur tape sa zone et
 * reçoit un chiffre. C'est le seul instant où FOREAS peut prouver quelque chose
 * avant de demander quoi que ce soit. Ce chiffre doit donc être irréprochable.
 *
 * Or `/api/home/zone-stats` embarquait NEUF ZONES DE CHIFFRES INVENTÉS — CDG à
 * 41,80 €/h, Orly à 38,40 €/h, La Défense à 36,20 €/h, avec un nombre de courses,
 * un pourcentage de demande et une date « mise à jour à l'instant ». Ils étaient
 * servis avec `has_data: true`, c'est-à-dire présentés comme des données mesurées.
 *
 * Ils ne sortaient PAS en production le jour du constat (la base répondait, avec
 * des zéros honnêtes). Mais ils étaient armés : deux `catch` muets faisaient
 * glisser vers eux dès le premier hoquet réseau, la première erreur de droits,
 * le premier quota dépassé. Et personne ne l'aurait vu — la page aurait eu l'air
 * MEILLEURE que d'habitude. C'est le pire type de panne : celle qui embellit.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * LA RÈGLE
 *
 *   Tout chiffre montré au public porte sa provenance. Quand on ne sait pas,
 *   on le dit — on n'invente jamais un chiffre plausible pour combler le vide.
 *
 * Un repli qui fabrique une valeur crédible est plus dangereux qu'une panne
 * visible : la panne se répare, le mensonge plausible s'installe.
 * (Même principe que le repli GPS : un repli doit être `null`, jamais une
 * coordonnée vraisemblable.)
 */

/** D'où vient un chiffre affiché. Trois états, pas un de plus. */
export type Provenance =
  /** Agrégé depuis des courses RÉELLEMENT enregistrées dans cette zone. */
  | 'mesuree'
  /** Déduit d'une zone voisine, d'une moyenne ou d'un modèle — pas de cette zone. */
  | 'estimation'
  /** On ne sait pas. Aucun chiffre n'est montré, et on le dit franchement. */
  | 'indisponible'

/** Ce que le visiteur lit à l'écran, à côté du chiffre. */
export const ETIQUETTE_PROVENANCE: Record<Provenance, string> = {
  mesuree: 'MESURÉ',
  estimation: 'ESTIMATION',
  indisponible: 'PAS DE DONNÉE',
}

/** Phrase honnête, à afficher quand le chiffre manque ou n'est qu'une estimation. */
export const EXPLICATION_PROVENANCE: Record<Provenance, string> = {
  mesuree: 'Calculé sur les courses réellement enregistrées dans cette zone.',
  estimation:
    'Pas encore assez de courses ici. Ce chiffre vient d’une zone voisine — prends-le comme un ordre de grandeur, pas comme une promesse.',
  indisponible:
    'On n’a pas encore de course enregistrée sur cette zone. On préfère te le dire plutôt que t’avancer un chiffre inventé.',
}

/**
 * Déduit la provenance d'une réponse de zone.
 *
 * `echec` est le cas important : erreur de base, exception réseau, droits refusés.
 * Il DOIT donner `indisponible`, jamais un repli fabriqué. Une lecture bloquée par
 * les droits (RLS) renvoie zéro ligne EN SILENCE — indistinguable d'une zone
 * réellement vide — donc on ne remplit jamais ce vide avec autre chose que la vérité.
 */
export function deduireProvenance(opts: {
  echec?: boolean
  aDesDonnees?: boolean
  zoneDeRepli?: unknown
}): Provenance {
  if (opts.echec) return 'indisponible'
  if (opts.aDesDonnees) return 'mesuree'
  if (opts.zoneDeRepli) return 'estimation'
  return 'indisponible'
}

/** Un chiffre issu de cette provenance peut-il être affiché comme un fait ? */
export function peutEtreAffirme(p: Provenance): boolean {
  return p === 'mesuree'
}
