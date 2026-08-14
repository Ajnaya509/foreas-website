/**
 * FOREAS — LES DEUX FICHES D'APPLICATION. Source unique de vérité.
 *
 * POURQUOI CE FICHIER EXISTE (mesuré le 14/08/2026)
 * Les deux vraies fiches EXISTENT et répondent HTTP 200 :
 *   Android → com.chandler509.foreasdriver
 *   iOS     → id6782316405
 * Mais le site pointait ailleurs dans 7 fichiers et 11 endroits, tous en HTTP 404 :
 *   `com.foreas.driver` (n'existe pas) · `com.foreas.app` (n'existe pas) ·
 *   `id000000000` (bouchon) · et surtout `id[APP_ID]` — un gabarit jamais rempli,
 *   parti en production tel quel.
 *
 * Ce que ça coûtait, concrètement :
 *   · /success — la page qu'un chauffeur voit APRÈS AVOIR PAYÉ → 404 pour installer ;
 *   · /download — la page dédiée au téléchargement → les DEUX liens en 404 ;
 *   · l'e-mail de bienvenue (src/lib/email.ts) → les DEUX liens en 404 ;
 *   · /go et /go/desktop — les liens courts des QR codes et des campagnes.
 *
 * RÈGLE : aucune URL de boutique écrite ailleurs. Onze copies d'une même URL, c'est
 * onze occasions qu'une seule soit juste.
 */

/** Identifiant du paquet Android (Google Play). */
export const ANDROID_PACKAGE = 'com.chandler509.foreasdriver'

/** Identifiant numérique de la fiche App Store (sans le préfixe « id »). */
export const IOS_APP_ID = '6782316405'

/** Fiche Google Play — vérifiée HTTP 200 le 14/08/2026. */
export const PLAY_STORE_URL = `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE}`

/** Fiche App Store — vérifiée HTTP 200 le 14/08/2026. */
export const APP_STORE_URL = `https://apps.apple.com/fr/app/id${IOS_APP_ID}`

/**
 * Lien Google Play avec paramètre de campagne (attribution Play Install Referrer).
 * `referrer` doit rester court : Google le tronque au-delà de ~1000 caractères.
 */
export function playStoreUrlAvecCampagne(campagne: string): string {
  const referrer = encodeURIComponent(`utm_source=foreas_site&utm_campaign=${campagne}`)
  return `${PLAY_STORE_URL}&referrer=${referrer}`
}

/**
 * Choisit la bonne boutique depuis l'en-tête `user-agent`.
 * Sur un ordinateur, il n'existe pas de bonne réponse : on renvoie `null` pour que
 * l'appelant propose les deux plutôt que d'envoyer un utilisateur de bureau vers
 * une fiche mobile qu'il ne pourra pas installer.
 */
export function boutiquePourAgent(userAgent: string | null | undefined): string | null {
  const ua = (userAgent || '').toLowerCase()
  if (/iphone|ipad|ipod/.test(ua)) return APP_STORE_URL
  if (/android/.test(ua)) return PLAY_STORE_URL
  return null
}
