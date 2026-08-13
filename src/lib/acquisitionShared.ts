/**
 * acquisitionShared — le contrat d'acquisition, sans frontière client/serveur.
 *
 * Pourquoi ce fichier existe : `acquisition.ts` porte la directive `'use client'`.
 * Quand un module serveur importait `ACQ_COOKIE` depuis là, Next ne lui donnait
 * PAS la chaîne `'foreas_acq'` mais une *client reference* (une fonction stub).
 * `request.cookies.get(<fonction>)` renvoie `undefined`, le `try/catch` avalait
 * le silence, et les 4 routes serveur écrivaient une origine VIDE — prouvé en
 * prod : canal_memory ne contenait que `_canal` et `_recorded_at`.
 *
 * Un nom de cookie et une forme de données ne sont ni client ni serveur. Ils
 * vivent ici, dans un module neutre que les deux côtés peuvent lire pour de vrai.
 */

/** Nom du cookie 1ère partie qui porte l'origine du visiteur (90 j). */
export const ACQ_COOKIE = 'foreas_acq'

/** Durée de vie du cookie d'origine, en secondes (90 jours). */
export const ACQ_MAX_AGE_SEC = 60 * 60 * 24 * 90

/** Champs captés. Tous optionnels — on ne stocke que ce qui existe vraiment. */
export interface Acquisition {
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_content?: string
  utm_term?: string
  fbclid?: string
  gclid?: string
  ttclid?: string
  /** Click-to-WhatsApp Ads (Meta) — la clé d'attribution des campagnes CTWA. */
  ctwa_clid?: string
  /** Referrer de la toute première page vue (origine seule, jamais l'URL complète). */
  referrer?: string
  /** Chemin de la page d'atterrissage. */
  landing_path?: string
  /** Horodatage du premier contact. */
  first_seen_at?: string
}

/** Paramètres d'URL lus au premier contact. */
export const ACQ_URL_KEYS: Array<keyof Acquisition> = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
  'fbclid',
  'gclid',
  'ttclid',
  'ctwa_clid',
]
