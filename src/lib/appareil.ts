/**
 * FOREAS — RECONNAÎTRE UN TÉLÉPHONE, CÔTÉ SERVEUR.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POURQUOI CÔTÉ SERVEUR, ET PAS EN CSS NI AVEC `useIsMobile()`
 *
 * L'accueil sert DEUX pages différentes, pas deux mises en page de la même :
 * l'ordinateur reçoit le parcours « téléphone vivant », le téléphone reçoit le
 * hero de zone, la page de vente et la barre sous le pouce. Ce ne sont pas les
 * mêmes composants ni le même texte.
 *
 *   · En CSS, il faudrait envoyer LES DEUX et en cacher une — le visiteur
 *     paierait le poids des deux pages pour n'en lire qu'une.
 *   · Avec `useIsMobile()`, la décision arrive APRÈS le premier rendu. Le
 *     défaut est déjà écrit noir sur blanc dans `ExperienceClient` :
 *     « desktop puis téléphone mobile au premier paint ». Sur une page
 *     d'accueil, ce clignotement est la première chose que le visiteur voit.
 *
 * L'en-tête `user-agent` arrive avec la requête : la décision est prise avant
 * qu'un seul octet parte, et le visiteur ne voit jamais l'autre page.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * LES TROIS RÈGLES, ET CE QU'ELLES COÛTENT SI ON LES INVERSE
 *
 * 1. UNE TABLETTE N'EST PAS UN TÉLÉPHONE. La page mobile est dessinée pour un
 *    pouce sur un écran étroit ; étalée sur mille pixels, elle est ridicule.
 *    Les tablettes sont donc écartées AVANT tout le reste — et notamment les
 *    Android qui n'écrivent pas « Mobile » dans leur agent, seule marque fiable
 *    qui distingue un téléphone Android d'une tablette Android.
 *
 * 2. L'iPad SE FAIT PASSER POUR UN MAC depuis iPadOS 13 : son agent dit
 *    « Macintosh ». On ne peut donc pas le reconnaître, et c'est sans gravité —
 *    il tombe dans « ordinateur », qui est exactement ce qu'on veut pour lui.
 *
 * 3. SANS AGENT LISIBLE, ON SERT L'ORDINATEUR. C'est la version qui s'adapte
 *    déjà à un écran étroit ; l'inverse n'est pas vrai. Un défaut doit tomber
 *    du côté où il se voit le moins.
 *
 * ⚠️ GOOGLE N'A PAS DE CAS PARTICULIER, ET C'EST DÉLIBÉRÉ.
 * Googlebot Smartphone annonce « Mobile » comme n'importe quel téléphone : il
 * reçoit donc ce que reçoit un chauffeur. Lui servir autre chose qu'à l'humain
 * porte un nom — du cloaking — et se paie en déclassement.
 *
 * Vérifié par `scripts/tests-accueil-telephone.mjs`, sur seize agents copiés
 * d'appareils réels. Il a été vu rouge avant d'être vert.
 */

/**
 * Une tablette, ou quelque chose qui se comporte comme telle.
 *
 * `Android(?!.*Mobile)` : un téléphone Android écrit toujours « Mobile » après
 * « Android » ; une tablette Android ne l'écrit jamais. C'est la règle que
 * Google lui-même documente pour distinguer les deux.
 */
const TABLETTE = /iPad|Tablet|PlayBook|Silk|Kindle|Nexus (?:7|9|10)|Android(?!.*Mobile)/i

/** Les marques d'un téléphone, toutes plateformes confondues. */
const TELEPHONE = /iPhone|iPod|Android.*Mobile|Windows Phone|IEMobile|BlackBerry|BB10|Opera Mini|Mobile Safari|webOS/i

/**
 * Vrai si cette requête vient d'un TÉLÉPHONE — et d'un téléphone seulement.
 *
 * Tablette, ordinateur, robot d'indexation ordinateur, agent absent ou
 * illisible : faux. Voir l'en-tête de ce fichier pour le pourquoi de chaque
 * règle.
 */
export function estTelephone(userAgent: string | null | undefined): boolean {
  const ua = String(userAgent ?? '')
  if (!ua) return false
  // L'ordre compte : une tablette Android contient « Android », et une tablette
  // Amazon contient « Silk ». Les écarter d'abord évite de les rattraper ensuite.
  if (TABLETTE.test(ua)) return false
  return TELEPHONE.test(ua)
}
