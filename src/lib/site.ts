/**
 * FOREAS — L'ADRESSE PUBLIQUE DU SITE. Source unique.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POURQUOI CE FICHIER EXISTE (20/08/2026)
 *
 * Les balises canoniques du site se contredisaient, mesuré en production :
 *   /            → https://www.foreas.xyz          (avec www)
 *   /ou-ca-paie  → https://foreas.xyz/ou-ca-paie   (sans www)
 *   /tarifs2     → aucune
 *
 * Or l'apex redirige vers www (307 vérifié). Une canonique qui désigne une URL
 * qui redirige s'annule elle-même : elle dit à Google « la version de référence
 * est là-bas », et là-bas répond « non, plus loin ». Google finit par choisir
 * seul, et il ne choisit pas toujours la bonne. Deux versions d'une même page
 * qui se concurrencent, c'est du jus de référencement coupé en deux.
 *
 * Une seule adresse, ici, et tout le monde la lit.
 *
 * ⚠️ Une URL d'infrastructure (Railway, Vercel) n'est JAMAIS une adresse
 * publique. En production, l'absence de configuration ne doit pas produire un
 * domaine `.railway.app` en canonique — d'où la valeur écrite en dur ci-dessous
 * plutôt qu'une lecture d'environnement au repli hasardeux.
 */

/** L'adresse de référence. Avec `www`, parce que c'est ce que sert la production. */
export const URL_SITE = 'https://www.foreas.xyz' as const

/** Construit l'URL canonique absolue d'un chemin. */
export function canonique(chemin: string): string {
  const c = chemin.startsWith('/') ? chemin : `/${chemin}`
  return c === '/' ? URL_SITE : `${URL_SITE}${c.replace(/\/$/, '')}`
}
