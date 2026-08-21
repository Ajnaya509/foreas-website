import { createHash } from 'node:crypto'

/**
 * FOREAS — ÉCRIRE DANS LES JOURNAUX SANS Y METTRE QUELQU'UN.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POURQUOI CE FICHIER EXISTE
 *
 * Le 21/08/2026, six endroits du site recopiaient une adresse e-mail COMPLÈTE
 * dans les journaux du serveur :
 *
 *   · api/webhooks/stripe/route.ts — deux fois, dont une sur le chemin du
 *     paiement ; la ligne partait à chaque `checkout.session.completed` ;
 *   · lib/email.ts — quatre fois ;
 *   · api/waitlist/route.ts — une fois, à chaque inscription.
 *
 * Les journaux de l'hébergeur sont conservés et lisibles par toute personne
 * ayant accès au tableau de bord. Une adresse e-mail y est une donnée
 * personnelle au repos, dans un endroit que personne ne considère comme une
 * base de données — donc que personne ne surveille, ne chiffre, ni ne purge.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POURQUOI UN REPÈRE ET PAS UN SIMPLE RETRAIT
 *
 * Retirer purement l'adresse aurait rendu les journaux inutilisables : quand
 * deux lignes parlent du même incident, il faut pouvoir le savoir.
 *
 * Un repère stable résout les deux problèmes à la fois. La même adresse donne
 * toujours le même repère, donc on peut suivre un incident de bout en bout ;
 * et le repère ne permet pas de remonter à la personne.
 *
 * ⚠️ CE N'EST PAS UNE PROMESSE D'ANONYMAT. L'ensemble des adresses e-mail
 * possibles est petit : qui possède déjà une liste d'adresses peut calculer
 * leurs repères et les rapprocher. Ce repère protège des journaux qui fuient,
 * pas d'un attaquant qui a déjà la liste. C'est écrit ici pour que personne ne
 * le prenne pour plus que ce qu'il est.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/**
 * Un repère court et stable pour une donnée personnelle, à écrire dans un
 * journal à la place de la donnée elle-même.
 *
 * Renvoie toujours quelque chose : `(absent)` si rien n'est fourni. Un journal
 * qui ne dit rien du tout est aussi difficile à lire qu'un journal qui ment.
 */
export function repere(valeur: unknown): string {
  if (typeof valeur !== 'string' || !valeur.trim()) return '(absent)'
  const normalisee = valeur.trim().toLowerCase()
  return `#${createHash('sha256').update(normalisee).digest('hex').slice(0, 8)}`
}
