'use client'

import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { MapPin, ArrowRight, LocateFixed } from 'lucide-react'
import { useTypewriter } from '@/hooks/useTypewriter'
import { useGeolocation } from '@/hooks/useGeolocation'
import AjnayaConversationModal from './AjnayaConversationModal'
import ZoneAutocomplete from './ZoneAutocomplete'

const PLACEHOLDER_ZONES = [
  'Aéroport CDG…',
  'La Défense…',
  'Lyon Part-Dieu…',
  'Marne-la-Vallée…',
  "Place d'Italie…",
  'Bordeaux Saint-Jean…',
]

const QUICK_ZONES = ['Aéroport CDG', 'La Défense', 'Bercy', 'Lyon Part-Dieu']

/**
 * HomeHeroCream — Hero blanc Apple absolu (Site2026v72)
 *
 * Refonte +100/100 design :
 * - Slogan en NOIR APPLE pur (#1d1d1f) — italique Genos fait le travail, pas le gradient
 * - Chip live live neutre gris Apple (plus de teinte violette criarde)
 * - Search bar blanc pur avec ombre Apple précise (1px ring + soft drop)
 * - BOUTON GÉOLOC en direct : pin live qui chope la position GPS du chauffeur
 *   et passe la zone canonique la plus proche à la Pieuvre (RPC zone-by-coords)
 * - CTA "Voir" → noir Apple solide (plus de gradient violet)
 * - Quick zones chips → neutre Apple #f5f5f7 (plus de teinte violette)
 * - Trust strip → flottant sans fond, séparateurs · ultra-subtils
 *
 * Skills :
 * - foreas-design-system : variant blanc Apple absolu, palette restreinte
 * - foreas-copy-atomic : vouvoiement, social proof immédiat (147 ce soir)
 */
export default function HomeHeroCream() {
  const [zoneInput, setZoneInput] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [hasInteracted, setHasInteracted] = useState(false)
  const [geolocError, setGeolocError] = useState<string | null>(null)
  // Site2026v77 nano-detail #9 : compteur live driver count (RPC + fallback)
  const [liveDriverCount, setLiveDriverCount] = useState<number>(147)
  // Site2026v79 : feedback géoloc précis (zone détectée + distance + accuracy)
  const [locateFeedback, setLocateFeedback] = useState<{
    zone: string
    distance_km: number
    accuracy_m: number
  } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const geo = useGeolocation()

  // Fetch driver count au mount + refresh toutes les 60s
  useEffect(() => {
    let cancelled = false
    const fetchCount = async () => {
      try {
        const res = await fetch('/api/live-driver-count', { cache: 'no-store' })
        if (!res.ok) return
        const data = (await res.json()) as { count?: number }
        if (!cancelled && typeof data.count === 'number') {
          setLiveDriverCount(data.count)
        }
      } catch { /* fallback statique 147 */ }
    }
    fetchCount()
    const id = setInterval(fetchCount, 60_000)
    return () => { cancelled = true; clearInterval(id) }
  }, [])

  const animatedPlaceholder = useTypewriter({
    texts: PLACEHOLDER_ZONES,
    typeSpeedMs: 75,
    pauseMs: 1500,
    eraseSpeedMs: 35,
    startDelayMs: 1400,
  })

  const openModal = (initialZone = '') => {
    setHasInteracted(true)
    if (initialZone) setZoneInput(initialZone)
    setModalOpen(true)
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('trackCustom', 'AjnayaModalOpened', {
        zone: initialZone || 'empty',
        source: 'hero_search',
      })
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    openModal(zoneInput.trim())
  }

  /**
   * Géolocalisation en direct : on chope la position du chauffeur,
   * on appelle /api/home/zone-by-coords pour identifier la zone canonique
   * la plus proche, et on ouvre le modal Ajnaya pré-rempli.
   */
  const handleLocate = async () => {
    setGeolocError(null)
    setLocateFeedback(null)
    setHasInteracted(true)

    // Haptic feedback web (iOS / Android compatibles)
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try { navigator.vibrate?.(6) } catch { /* silencieux */ }
    }

    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('trackCustom', 'GeolocationRequested', { source: 'hero_search' })
    }

    const coords = await geo.request()
    if (!coords) {
      // Le hook a déjà setté un message d'erreur lisible
      setGeolocError(geo.error)
      return
    }

    try {
      const res = await fetch(
        `/api/home/zone-by-coords?lat=${coords.lat}&lng=${coords.lng}`,
      )
      if (!res.ok) throw new Error(`status ${res.status}`)
      const data = await res.json() as {
        zone_match: string
        in_range: boolean
        distance_km: number
      }

      // Garde anti-faux-match : si la position détectée est HORS du rayon de
      // la zone la plus proche (ou > 50 km), on ne pré-remplit PAS — sinon on
      // affiche "Bordeaux Saint-Jean" à un chauffeur parisien qui a un GPS tordu.
      const OUT_OF_RANGE_KM = 50
      if (!data.in_range || data.distance_km > OUT_OF_RANGE_KM) {
        setGeolocError(
          `Vous êtes à ${data.distance_km} km de la zone FOREAS la plus proche (${data.zone_match}). Tapez la zone où vous comptez bosser ce soir.`
        )
        if (typeof window !== 'undefined' && window.fbq) {
          window.fbq('trackCustom', 'GeolocationOutOfRange', {
            nearest_zone: data.zone_match,
            distance_km: data.distance_km,
          })
        }
        return
      }

      // Position cohérente — pré-remplit le champ + affiche feedback précis
      setZoneInput(data.zone_match)
      setLocateFeedback({
        zone: data.zone_match,
        distance_km: data.distance_km,
        accuracy_m: Math.round(coords.accuracy),
      })
      // Petit délai (1.2s) pour que l'user voie le feedback "détectée à 0.4 km"
      // avant que le modal s'ouvre — c'est ce qui crée la confiance dans la précision
      setTimeout(() => openModal(data.zone_match), 900)

      if (typeof window !== 'undefined' && window.fbq) {
        window.fbq('trackCustom', 'GeolocationMatched', {
          zone: data.zone_match,
          in_range: data.in_range,
          distance_km: data.distance_km,
          accuracy_m: Math.round(coords.accuracy),
        })
      }
    } catch {
      setGeolocError("Position trouvée — mais impossible de joindre Ajnaya à l'instant. Tapez votre zone.")
    }
  }

  const isLocating = geo.state === 'requesting'
  const isLocated = geo.state === 'granted'

  return (
    <>
      <section
        className="relative min-h-[100svh] flex items-center justify-center overflow-hidden bg-cream-warm-textured"
        aria-label="Tarif horaire VTC en direct"
      >
        {/* ─── Apple Vision Pro spatial halos ───────────────────────────────
           4 blobs colorés diffus qui drift lentement en background.
           Effet Aurora/Nebula spatial. Sur fond blanc Apple, ça donne la
           profondeur Vision Pro sans casser l'épure.                          */}
        <div
          className="absolute inset-0 pointer-events-none overflow-hidden"
          aria-hidden="true"
        >
          {/* Blob 1 — Violet brand top-left (le + visible) */}
          <div
            className="absolute -top-[15%] -left-[10%] w-[55%] h-[55%] rounded-full animate-vision-a"
            style={{
              background:
                'radial-gradient(circle at 50% 50%, rgba(140, 82, 255, 0.28) 0%, rgba(140, 82, 255, 0.06) 50%, transparent 80%)',
              filter: 'blur(40px)',
              willChange: 'transform',
            }}
          />
          {/* Blob 2 — Violet secondaire top-right (remplace ancien cyan qui teintait la search bar) */}
          <div
            className="absolute -top-[5%] -right-[12%] w-[48%] h-[48%] rounded-full animate-vision-b"
            style={{
              background:
                'radial-gradient(circle at 50% 50%, rgba(108, 60, 224, 0.18) 0%, rgba(108, 60, 224, 0.04) 55%, transparent 80%)',
              filter: 'blur(48px)',
              willChange: 'transform',
            }}
          />
          {/* Blob 3 — Rose warm bottom-center (humain) */}
          <div
            className="absolute -bottom-[20%] left-[25%] w-[60%] h-[55%] rounded-full animate-vision-c"
            style={{
              background:
                'radial-gradient(circle at 50% 50%, rgba(255, 102, 153, 0.15) 0%, rgba(255, 102, 153, 0.04) 55%, transparent 80%)',
              filter: 'blur(56px)',
              willChange: 'transform',
            }}
          />
          {/* Blob 4 — Or précieux mid-left (subtil award) */}
          <div
            className="absolute top-[40%] -left-[15%] w-[35%] h-[35%] rounded-full animate-vision-a"
            style={{
              background:
                'radial-gradient(circle at 50% 50%, rgba(245, 200, 66, 0.12) 0%, rgba(245, 200, 66, 0.03) 55%, transparent 80%)',
              filter: 'blur(50px)',
              animationDelay: '4s',
              willChange: 'transform',
            }}
          />
        </div>

        <div className="relative w-full max-w-3xl mx-auto px-5 sm:px-8 text-center pt-24 pb-20 sm:pt-24 sm:pb-24">
          {/* Chip live "147 chauffeurs en ligne" — neutre Apple */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-7 sm:mb-8"
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.04)',
              border: '1px solid rgba(0, 0, 0, 0.06)',
            }}
          >
            <span className="relative flex w-2 h-2" aria-hidden="true">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            <span
              className="text-[11px] sm:text-xs font-semibold"
              style={{ color: '#1d1d1f' }}
            >
              <span className="tabular-nums" id="hero-live-driver-count">{liveDriverCount}</span> chauffeurs FOREAS en ligne ce soir
            </span>
          </motion.div>

          {/* H1 — slogan : "Gagnez plus" noir Apple + "roulez moins." gradient brand sobre */}
          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
            className="font-semibold leading-[0.95] mb-5"
            style={{
              fontFamily: 'var(--font-genos), system-ui, sans-serif',
              // Design System §5 + §17 : letter-spacing -0.04em sur display ≥ 56px
              // Effet Apple-grade lettres serrées (Genos display weight 600+)
              letterSpacing: '-0.04em',
              color: '#1d1d1f',
              fontSize: 'clamp(2.75rem, 9.5vw, 6rem)',
            }}
          >
            Gagnez plus,
            <br />
            <span
              style={{
                fontStyle: 'italic',
                backgroundImage:
                  'linear-gradient(135deg, #6C3CE0 0%, #8C52FF 35%, #00D4FF 100%)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                color: 'transparent',
              }}
            >
              roulez moins.
            </span>
          </motion.h1>

          {/* Sub-line excitante — mention Uber/Bolt/Heetch + scan multi-plateformes */}
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="text-base sm:text-lg leading-relaxed mb-10 sm:mb-12 max-w-2xl mx-auto"
            style={{ color: '#6e6e73' }}
          >
            Tapez votre zone. Ajnaya scanne{' '}
            <strong style={{ color: '#1d1d1f', fontWeight: 700 }}>
              Uber, Bolt, Heetch
            </strong>{' '}
            + 4 autres plateformes — vous dit où foncer ce soir.
          </motion.p>

          {/* Search bar — blanc pur Apple avec ombre précise */}
          <motion.form
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.25 }}
            onSubmit={handleSubmit}
            className="max-w-xl mx-auto relative"
          >
            <div
              className="group relative flex items-center gap-2 rounded-full transition-all px-4 sm:px-5 py-2.5 sm:py-3 cursor-text focus-within:ring-2 focus-within:ring-black/10 overflow-hidden"
              style={{
                backgroundColor: '#ffffff',
                boxShadow:
                  '0 0 0 1px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.06), 0 12px 32px -16px rgba(0,0,0,0.18)',
              }}
              onClick={() => inputRef.current?.focus()}
            >
              {/* Shimmer cyan pendant fetch géoloc — Design System §16 :
                  "loader grey rotating spinner → utiliser shimmer cyan" */}
              {isLocating && (
                <span
                  aria-hidden
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background:
                      'linear-gradient(90deg, transparent 0%, rgba(0, 212, 255, 0.18) 45%, rgba(140, 82, 255, 0.12) 55%, transparent 100%)',
                    animation: 'foreas-shimmer-cyan 1.4s linear infinite',
                  }}
                />
              )}
              <MapPin
                className="w-5 h-5 flex-shrink-0"
                style={{ color: isLocated ? '#1d1d1f' : '#86868b' }}
              />
              <input
                ref={inputRef}
                type="text"
                value={zoneInput}
                onChange={(e) => setZoneInput(e.target.value)}
                onFocus={() => setHasInteracted(true)}
                placeholder={
                  hasInteracted ? 'Tapez votre zone…' : animatedPlaceholder
                }
                autoComplete="off"
                spellCheck={false}
                inputMode="search"
                enterKeyHint="search"
                autoCapitalize="words"
                className="flex-1 bg-transparent border-none outline-none focus:outline-none focus-visible:outline-none text-base sm:text-lg font-medium placeholder-[#86868b] tabular-nums min-w-0 py-1"
                style={{
                  color: '#1d1d1f',
                  // Override la règle globale `*:focus-visible { outline: 2px solid cyan }`
                  // de globals.css — le focus-within ring noir/10% du wrapper suffit pour
                  // l'accessibilité WCAG AA (indicateur visuel sur la pill entière).
                  outline: 'none',
                  boxShadow: 'none',
                  WebkitTapHighlightColor: 'transparent',
                }}
                aria-label="Votre zone d'opération"
              />

              {/* Bouton géoloc — pin live qui suit la position du chauffeur */}
              <button
                type="button"
                onClick={handleLocate}
                disabled={isLocating}
                aria-label={
                  isLocated
                    ? 'Position activée — relancer'
                    : 'Utiliser ma position en direct'
                }
                title="Utiliser ma position"
                className="relative flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-all hover:bg-black/[0.05] active:scale-95 disabled:cursor-wait"
                style={{
                  color: isLocated ? '#8C52FF' : '#86868b',
                }}
              >
                {/* Pas de Loader2 spin — le shimmer cyan sur la search bar fait le boulot.
                    On garde juste l'icône fixe (avec opacité réduite si isLocating). */}
                <LocateFixed
                  className="w-4 h-4 transition-opacity"
                  style={{ opacity: isLocating ? 0.4 : 1 }}
                />
                {isLocated && (
                  <>
                    {/* Dot violet — point central */}
                    <span
                      className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-violet-500"
                      aria-hidden="true"
                      style={{
                        boxShadow: '0 0 0 3px rgba(140, 82, 255, 0.20)',
                      }}
                    />
                    {/* Halo pulse 1.8s — Design System §17 respiration humaine 33 BPM */}
                    <span
                      aria-hidden="true"
                      className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-violet-400 animate-halo-pulse"
                      style={{
                        animation: 'foreas-locate-pulse 1.8s ease-in-out infinite',
                        pointerEvents: 'none',
                      }}
                    />
                  </>
                )}
              </button>

              {/* Bouton Voir — noir Apple desktop */}
              <button
                type="submit"
                disabled={!zoneInput.trim()}
                aria-label="Voir le tarif horaire"
                className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-semibold transition-all hover:bg-black active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: '#1d1d1f',
                  color: '#ffffff',
                }}
              >
                Voir
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              {/* Bouton Voir — mobile (icône seule) */}
              <button
                type="submit"
                disabled={!zoneInput.trim()}
                aria-label="Voir le tarif horaire"
                className="sm:hidden w-9 h-9 rounded-full text-white flex items-center justify-center transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#1d1d1f' }}
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Site2026v79 nano-detail #saisie : autocomplete des 51 zones canoniques */}
            {/* Position absolute → ne décale pas le layout sous la barre */}
            <ZoneAutocomplete
              value={zoneInput}
              onSelect={(zone) => {
                setZoneInput(zone)
                openModal(zone)
              }}
            />

            {/* Site2026v79 : feedback géoloc précis (rassure sur la précision) */}
            {/* Format : "📍 Aéroport CDG · 0.4 km · ± 8 m" */}
            {locateFeedback && !geolocError && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="flex items-center justify-center gap-2 mt-3"
                role="status"
                aria-live="polite"
              >
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full"
                  style={{
                    backgroundColor: 'rgba(140, 82, 255, 0.10)',
                    border: '1px solid rgba(140, 82, 255, 0.20)',
                  }}
                >
                  <MapPin className="w-3 h-3" style={{ color: '#6C3CE0' }} />
                  <span className="text-[11px] font-semibold tabular-nums" style={{ color: '#6C3CE0' }}>
                    {locateFeedback.zone}
                  </span>
                  <span className="text-[10px] tabular-nums" style={{ color: '#86868b' }}>
                    · {locateFeedback.distance_km < 1
                      ? `${Math.round(locateFeedback.distance_km * 1000)} m`
                      : `${locateFeedback.distance_km.toFixed(1)} km`}
                    · ± {locateFeedback.accuracy_m} m
                  </span>
                </span>
              </motion.div>
            )}

            {/* Erreur géoloc — message subtil sous la search bar */}
            {geolocError && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs mt-3"
                style={{ color: '#86868b' }}
                role="status"
              >
                {geolocError}
              </motion.p>
            )}

            {/* Quick zones — neutre Apple #f5f5f7 (plus de teinte violet) */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 mt-4"
            >
              <span
                className="text-[10px] sm:text-[11px] uppercase font-semibold w-full sm:w-auto sm:mr-1"
                style={{
                  color: '#86868b',
                  letterSpacing: '0.18em',
                }}
              >
                Essayez :
              </span>
              {QUICK_ZONES.map((z) => (
                <button
                  key={z}
                  type="button"
                  onClick={() => {
                    setZoneInput(z)
                    setHasInteracted(true)
                    openModal(z)
                  }}
                  className="px-3.5 py-1.5 rounded-full text-xs font-medium transition-all hover:bg-[#ebebed] active:scale-95"
                  style={{
                    backgroundColor: '#f5f5f7',
                    color: '#1d1d1f',
                  }}
                >
                  {z}
                </button>
              ))}
            </motion.div>

            {/* Trust strip — flottant sans fond, séparateurs · Apple gray */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.55 }}
              className="inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-1 mt-6"
            >
              <span
                className="text-[11px] font-medium tabular-nums"
                style={{ color: '#86868b' }}
              >
                51 zones
              </span>
              <span style={{ color: '#d2d2d7' }} aria-hidden="true">·</span>
              <span
                className="text-[11px] font-medium"
                style={{ color: '#86868b' }}
              >
                données réelles
              </span>
              <span style={{ color: '#d2d2d7' }} aria-hidden="true">·</span>
              <span
                className="text-[11px] font-medium"
                style={{ color: '#86868b' }}
              >
                sans inscription
              </span>
            </motion.div>
          </motion.form>
        </div>

        {/* Scroll indicator Apple-discret — micro-pulse fine */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.6 }}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 pointer-events-none"
          aria-hidden="true"
        >
          <span
            className="text-[9px] font-semibold tracking-[0.32em] uppercase"
            style={{ color: '#86868b' }}
          >
            Scroll
          </span>
          <motion.div
            className="w-px h-7"
            style={{
              background:
                'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.20) 50%, transparent 100%)',
            }}
            animate={{ y: [0, 6, 0], opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.div>
      </section>

      <AjnayaConversationModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        initialZone={zoneInput}
      />
    </>
  )
}

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void
  }
}
