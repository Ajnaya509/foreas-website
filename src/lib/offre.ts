/**
 * FOREAS — L'OFFRE. Source unique de vérité des montants.
 *
 * POURQUOI CE FICHIER EXISTE (constat du 14/08/2026)
 * Le site encaissait DEUX PRIX DIFFÉRENTS pour le même produit :
 *   · /tarifs2 → /api/checkout ........... 29,99 €/mois  (offre réelle)
 *   · /checkout → /api/subscription/create  97 €/mois     (ancienne grille)
 * Le 22/07, le mapping `PRICE_IDS` (Pro 97 € / Elite 247 €) avait été retiré de
 * `/api/checkout` précisément parce qu'il « aurait facturé 97 € au lieu de 29,99 € ».
 * Le même piège est resté dans son jumeau `/api/subscription/create`, en ligne,
 * atteignable depuis /checkout — corrigé d'un côté, oublié de l'autre.
 *
 * RÈGLE : aucun montant en dur ailleurs. Un prix qui vit à deux endroits finit
 * toujours par diverger — c'est exactement ce qui vient de se produire.
 *
 * ⚠️ Ces montants doivent rester alignés sur `pieuvre_pricing_plans` (Supabase),
 * qui est la référence côté Pieuvre/app. Ce fichier est la référence côté SITE.
 */

/** 29,99 € par mois, en centimes (Stripe raisonne en centimes). */
export const PRIX_MENSUEL_CENTIMES = 2999

/** 249,99 € par an, en centimes. */
export const PRIX_ANNUEL_CENTIMES = 24999

/** Durée de l'essai, en jours. Identique pour tout le monde, quel que soit le jour d'inscription. */
export const ESSAI_JOURS = 3

/** Devise unique. */
export const DEVISE = 'eur' as const

/** Les deux seules formules vendables aujourd'hui. Tout le reste est une ancienne offre. */
export type FormuleActive = 'mensuel' | 'annuel'

export const FORMULES: Record<
  FormuleActive,
  { libelle: string; centimes: number; intervalle: 'month' | 'year'; sousTitre: string }
> = {
  mensuel: {
    libelle: 'FOREAS',
    centimes: PRIX_MENSUEL_CENTIMES,
    intervalle: 'month',
    sousTitre: 'moins d’1 € par jour',
  },
  annuel: {
    libelle: 'FOREAS · annuel',
    centimes: PRIX_ANNUEL_CENTIMES,
    intervalle: 'year',
    sousTitre: '2 mois offerts',
  },
}

/**
 * Anciennes clés de formule encore présentes dans des liens, des campagnes ou
 * d'anciens e-mails. On les fait atterrir sur la BONNE formule au BON prix
 * plutôt que de renvoyer une erreur à un prospect qui a sa carte en main.
 *
 * `elite_*` n'est volontairement PAS ici : cette formule n'existe plus. Un lien
 * Elite doit échouer proprement, pas vendre 247 € un produit qui n'est plus au
 * catalogue. C'est la seule façon de rendre l'ancienne offre techniquement
 * insouscriptible, comme exigé.
 */
const ALIAS_ANCIENNES_CLES: Record<string, FormuleActive> = {
  pro_monthly: 'mensuel',
  pro_annual: 'annuel',
  monthly: 'mensuel',
  annual: 'annuel',
  mensuel: 'mensuel',
  annuel: 'annuel',
}

/**
 * Traduit ce que le navigateur envoie en une formule vendable.
 * Renvoie `null` si la formule demandée n'existe plus (ex. `elite_monthly`) —
 * l'appelant DOIT alors refuser la souscription.
 */
export function resoudreFormule(cle: string | undefined | null): FormuleActive | null {
  if (!cle) return null
  return ALIAS_ANCIENNES_CLES[cle.trim().toLowerCase()] ?? null
}

/** Affichage français : 2999 → « 29,99 € ». */
export function formaterEuros(centimes: number): string {
  return (centimes / 100).toLocaleString('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  })
}
