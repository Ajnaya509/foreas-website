'use client'

/**
 * acquisition.ts — d'où vient la personne, capté à l'ARRIVÉE sur le site.
 *
 * Constat qui a motivé ce fichier : les seuls `pieuvre_prospects.utm_source`
 * remplis valent tous `foreas_site` / `home_hero_search_v1` — une constante
 * écrite par la Pieuvre, PAS l'origine réelle du visiteur. Côté site, le
 * payload envoyé au cerveau contenait littéralement `utm: {}`
 * (src/app/api/ajnaya/home-modal/route.ts). Autrement dit : personne ne captait
 * l'origine. On la capte ici, une fois, au premier contact.
 *
 * Règles :
 *  - PREMIER TOUCHER GAGNE : on n'écrase pas l'origine d'une visite antérieure.
 *  - Cookie 1ère partie `foreas_acq`, 90 jours, lisible par le serveur (les routes
 *    API en ont besoin) — aucune donnée personnelle dedans, uniquement des
 *    paramètres de campagne déjà présents dans l'URL.
 *  - `_fbc` / `_fbp` / `_ttclid` ne sont PAS copiés ici : ce sont des cookies posés
 *    par les pixels, lus côté serveur directement (voir /api/observe).
 */

export const ACQ_COOKIE = 'foreas_acq'
const NINETY_DAYS_SEC = 60 * 60 * 24 * 90

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

const URL_KEYS: Array<keyof Acquisition> = [
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

function clean(v: string | null): string | undefined {
  if (!v) return undefined
  const t = v.trim().slice(0, 200)
  return t.length > 0 ? t : undefined
}

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const raw = document.cookie
    .split(';')
    .find((c) => c.trim().startsWith(name + '='))
  return raw ? raw.split('=').slice(1).join('=') : null
}

/** Origine déjà mémorisée (premier toucher), ou null. */
export function getStoredAcquisition(): Acquisition | null {
  const raw = readCookie(ACQ_COOKIE)
  if (!raw) return null
  try {
    const parsed = JSON.parse(decodeURIComponent(raw))
    return parsed && typeof parsed === 'object' ? (parsed as Acquisition) : null
  } catch {
    return null
  }
}

/**
 * À appeler au montage global. Lit l'URL courante, et si — et seulement si —
 * aucune origine n'est encore mémorisée, la fige pour 90 jours.
 * Retourne l'origine effective (mémorisée ou fraîchement captée).
 */
export function captureAcquisition(): Acquisition | null {
  if (typeof window === 'undefined') return null

  const existing = getStoredAcquisition()
  if (existing) return existing // premier toucher gagne

  const params = new URLSearchParams(window.location.search)
  const acq: Acquisition = {}
  for (const key of URL_KEYS) {
    const value = clean(params.get(key))
    if (value) acq[key] = value
  }

  // Referrer : on ne garde que l'origine (pas le chemin) — moins de données, même signal.
  if (document.referrer) {
    try {
      const refOrigin = new URL(document.referrer).origin
      if (refOrigin && refOrigin !== window.location.origin) acq.referrer = refOrigin
    } catch {
      /* referrer illisible — on l'ignore */
    }
  }

  // Une visite directe sans aucun paramètre reste une information : on la garde
  // avec son chemin d'atterrissage, sinon "direct" reste invisible pour toujours.
  acq.landing_path = window.location.pathname.slice(0, 200)
  acq.first_seen_at = new Date().toISOString()

  try {
    const encoded = encodeURIComponent(JSON.stringify(acq))
    document.cookie = `${ACQ_COOKIE}=${encoded}; path=/; max-age=${NINETY_DAYS_SEC}; secure; samesite=lax`
  } catch {
    /* cookie refusé — l'objet est quand même renvoyé à l'appelant */
  }

  return acq
}
