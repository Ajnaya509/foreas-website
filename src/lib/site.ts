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

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * LE BLOC DE PARTAGE D'UNE PAGE. AJOUTÉ LE 21/08/2026.
 *
 * 🔴 MESURÉ : sur les 22 adresses du plan du site, NEUF servaient l'adresse de
 * partage de l'accueil — `og:url = https://www.foreas.xyz` — à côté d'une
 * canonique pourtant correcte. Et le même titre que l'accueil.
 *
 * Concrètement : quelqu'un partage `/tarifs2` dans une conversation, l'aperçu
 * affiche l'accueil, et le lien de l'aperçu mène à l'accueil. La page de prix
 * ne peut donc pas être partagée. Idem pour les huit autres.
 *
 * La cause : ces neuf `layout.tsx` ne déclaraient QUE `alternates`. Tout le
 * reste — titre, bloc de partage — était hérité du layout racine, en entier.
 *
 * ⚠️ LE PIÈGE, ET IL EST SÉVÈRE : Next fusionne les métadonnées au PREMIER
 * NIVEAU seulement. Écrire `openGraph: { url }` dans un layout enfant ne
 * complète pas le bloc du parent — il le REMPLACE. On perdrait d'un coup
 * `siteName`, `locale`, `type` et la description, sur neuf pages, en croyant
 * n'avoir corrigé qu'une adresse.
 *
 * D'où cette fonction : elle reconstruit le bloc ENTIER, et il n'y a qu'un
 * endroit à modifier le jour où le parent change.
 */

/** Les valeurs communes du bloc de partage. Doivent rester alignées sur src/app/layout.tsx. */
const PARTAGE_COMMUN = {
  siteName: 'FOREAS',
  locale: 'fr_FR',
  type: 'website',
} as const

/**
 * Le bloc de partage d'une page, complet.
 *
 * @param chemin       le chemin de la page, par exemple '/tarifs2'
 * @param titre        le titre propre à la page
 * @param description  la description propre à la page
 */
export function partage(chemin: string, titre: string, description: string) {
  return {
    ...PARTAGE_COMMUN,
    title: titre,
    description,
    url: canonique(chemin),
  }
}

/** Les métadonnées complètes d'une page : titre, description, canonique, partage. */
export function metadonneesPage(chemin: string, titre: string, description: string) {
  return {
    title: titre,
    description,
    alternates: { canonical: canonique(chemin) },
    openGraph: partage(chemin, titre, description),
    twitter: {
      card: 'summary_large_image' as const,
      title: titre,
      description,
    },
  }
}
