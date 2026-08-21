/**
 * FOREAS — LES SUJETS DES PAGES FABRIQUÉES EN SÉRIE. UNE SEULE LISTE.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POURQUOI CE FICHIER EXISTE
 *
 * La liste vivait à DEUX endroits, recopiée à la main :
 *   · src/app/(marketing)/[topic]/page.tsx  — qui décide si la page s'affiche
 *   · src/app/go/[topic]/route.ts           — qui décide de l'attribution du clic
 *
 * Et le second portait ce commentaire : « Doit rester aligné sur VALID_TOPICS
 * de … ». Une consigne d'alignement manuel entre deux fichiers est exactement
 * le piège qui s'est déclenché sept fois dans ce dépôt cette semaine — double
 * prix, prompt jumeau, durée d'essai. Une liste qui vit à deux endroits finit
 * toujours par diverger.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⚠️ CE QUE LA DIVERGENCE COÛTAIT DÉJÀ
 *
 * Mesuré le 21/08/2026 : la base compte ONZE pages actives, les deux listes en
 * connaissent DIX. La onzième porte l'identifiant `go` — le même mot que la
 * route qui envoie vers les boutiques.
 *
 * Résultat vérifié en production : `/go` renvoie vers l'App Store. La page
 * n'est donc affichable NULLE PART. Elle est active depuis le 4 avril 2026,
 * son texte est entretenu, et aucun visiteur ne l'a jamais vue.
 *
 * C'est une panne silencieuse : rien n'échoue, rien n'alerte, la page existe
 * simplement dans le vide. La règle « chaque page active est atteignable »
 * dans scripts/verifier-canon.mjs est là pour que ça ne se reproduise pas.
 */

/** Les sujets qui ont une page affichable, à `/<sujet>`. */
export const SUJETS = [
  'airbnb',
  'surge',
  'premium',
  'optimisation',
  'revenus',
  'flotte',
  'charges',
  'aeroport',
  'evenements',
  'clients',
] as const

export type Sujet = (typeof SUJETS)[number]

export function sujetValide(valeur: string): valeur is Sujet {
  return (SUJETS as readonly string[]).includes(valeur)
}

/**
 * Les mots que le routeur `/go` réserve pour lui-même.
 *
 * Next.js sert une route statique avant une route dynamique. Un sujet qui
 * porterait l'un de ces mots serait donc mangé par le routeur, en silence.
 */
export const MOTS_RESERVES_PAR_GO = ['zones', 'rentabilite', 'clientele', 'ajnaya', 'communaute', 'desktop'] as const
