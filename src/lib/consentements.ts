/**
 * FOREAS — CE QUE LE NAVIGATEUR A LE DROIT DE SAVOIR DES ACCORDS.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⚠️ 22/08/2026 — CE FICHIER EXISTE PARCE QUE LE FILTRE ARRIVAIT TROP TARD.
 *
 * Jusqu'ici, les composants importaient le registre complet — noms, citations,
 * villes — et filtraient ensuite avec `temoignagePubliable()`.
 *
 * Mesuré sur la production : DEUX fichiers JavaScript de la page d'accueil,
 * 90 539 et 13 485 octets, contenaient **les six noms**. Chaque visiteur les
 * téléchargeait. L'écran était propre ; le réseau ne l'était pas.
 *
 * **Un filtre qui s'exécute chez le visiteur ne protège personne : la diffusion
 * a déjà eu lieu quand il tourne.**
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * LE PRINCIPE
 *
 * Le navigateur a besoin de savoir **s'il** doit afficher quelque chose.
 * Il n'a pas besoin de savoir **qui**.
 *
 * Ce fichier ne porte donc que des identifiants autorisés. Le nom, la citation
 * et la ville vivent dans `consentements.prive.ts`, marqué `server-only` : la
 * fabrication échoue si un composant client tente de l'importer.
 *
 * Quand un accord est signé, deux choses bougent ensemble :
 *   1. son statut passe à `approuve` dans le registre privé ;
 *   2. son identifiant entre dans la liste ci-dessous ;
 *   3. le serveur passe son nom et sa citation en PROPRIÉTÉ au composant.
 *
 * Une règle de `npm run canon` vérifie que 1 et 2 ne divergent jamais.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/**
 * Les identifiants dont l'accord écrit est signé et couvre le site.
 *
 * ⚠️ VIDE AU 22/08/2026 : les six accords sont au statut « en attente ».
 * Ce n'est pas un oubli — c'est l'état réel, et il doit se voir.
 */
export const TEMOIGNAGES_AUTORISES: readonly string[] = []

/** Cette personne peut-elle être montrée sur le site ? */
export function temoignagePubliable(id: string): boolean {
  return TEMOIGNAGES_AUTORISES.includes(id)
}

/**
 * Y a-t-il au moins une personne montrable ?
 *
 * ⚠️ À N'UTILISER QUE POUR MASQUER UN CONTENEUR ENTIER, jamais pour décider
 * d'afficher une personne précise : c'est un « au moins un », donc un « tous ou
 * aucun ». Le jour où UNE signe, il rendrait `true` pour les six.
 */
export function auMoinsUnTemoignagePubliable(): boolean {
  return TEMOIGNAGES_AUTORISES.length > 0
}

/**
 * Variante par nom affiché, pour les listes venues de la base.
 *
 * ⚠️ ELLE REND TOUJOURS `false` TANT QUE LA LISTE EST VIDE, et c'est correct :
 * aucun nom ne peut être publiable si aucun accord n'est signé. Le jour où un
 * accord passe, le rapprochement nom → identifiant se fera CÔTÉ SERVEUR, où le
 * nom a le droit d'exister — pas ici.
 */
export function temoignagePubliableParNom(_nom: string): boolean {
  return TEMOIGNAGES_AUTORISES.length > 0
}
