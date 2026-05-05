/**
 * auth-urls.ts — Helper centralisé des portes d'authentification
 *
 * Source de vérité : /Users/chandlermilien/FOREAS-SHARED/AUTH_ARCHITECTURE.md
 * Contrat v1.0 — 2026-05-05
 *
 * RÈGLES :
 *  - Ne JAMAIS hardcoder le subdomain dashboard ailleurs que dans ce fichier
 *  - Ne JAMAIS utiliser target="_blank" sur les CTAs auth
 *  - Ne JAMAIS créer de page /login côté site — toute auth vit sur le dashboard
 *  - Toujours matcher le rôle au contexte de page
 */

const DASH =
  process.env.NEXT_PUBLIC_DASHBOARD_URL ?? "https://partners.foreas.xyz";

export const authUrls = {
  /** Porte générique — smart routing par rôle côté dashboard */
  loginGeneric: `${DASH}/login`,
  /** Porte Admin — eyebrow "Console Admin · Accès restreint" */
  loginAdmin: `${DASH}/login?role=admin`,
  /** Porte Directeur Partenaire — eyebrow "Espace Directeur · Coopérative VTC" */
  loginPartner: `${DASH}/login?role=partner`,
  /** Porte Chauffeur — eyebrow "Espace Chauffeur · Données privées" */
  loginDriver: `${DASH}/login?role=driver`,
  /** Reset mot de passe */
  authReset: `${DASH}/auth/reset`,
} as const;

/**
 * Construit une URL /login avec `next=` pour préserver l'intent post-auth.
 * Le path `next` doit commencer par /admin, /partner ou /driver.
 *
 * @example
 * loginWithNext("partner", "/partner/commissions")
 * // → https://partners.foreas.xyz/login?role=partner&next=%2Fpartner%2Fcommissions
 */
export function loginWithNext(
  role: "admin" | "partner" | "driver",
  next: string
): string {
  const params = new URLSearchParams({ role, next });
  return `${DASH}/login?${params.toString()}`;
}
