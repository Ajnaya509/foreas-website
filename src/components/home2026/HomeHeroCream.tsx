'use client'

import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { MapPin, ArrowRight, LocateFixed, Loader2 } from 'lucide-react'
import { useTypewriter } from '@/hooks/useTypewriter'
import { useGeolocation } from '@/hooks/useGeolocation'
import AjnayaConversationModal from './AjnayaConversationModal'

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
  const inputRef = useRef<HTMLInputElement>(null)
  const geo = useGeolocation()

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

      // Pré-remplit le champ et ouvre le modal directement avec la zone matchée
      setZoneInput(data.zone_match)
      openModal(data.zone_match)

      if (typeof window !== 'undefined' && window.fbq) {
        window.fbq('trackCustom', 'GeolocationMatched', {
          zone: data.zone_match,
          in_range: data.in_range,
          distance_km: data.distance_km,
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
        {/* Halos très subtils (Apple ne crie jamais) */}
        <div
          className="absolute inset-0 pointer-events-none cream-halo-warm animate-halo-pulse"
          aria-hidden="true"
        />

        {/* Composant graphique gradient — opacity réduite Apple-style */}
        <div
          className="absolute top-1/2 left-0 right-0 -translate-y-28 sm:-translate-y-40 pointer-events-none opacity-25"
          aria-hidden="true"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/gradient-line.svg"
            alt=""
            className="w-full h-auto"
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
              className="text-[11px] sm:text-xs font-semibold tabular-nums"
              style={{ color: '#1d1d1f' }}
            >
              147 chauffeurs FOREAS en ligne ce soir
            </span>
          </motion.div>

          {/* H1 — slogan en NOIR APPLE pur (italique fait l'effet, pas le gradient) */}
          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
            className="font-semibold leading-[0.95] mb-5"
            style={{
              fontFamily: 'var(--font-genos), system-ui, sans-serif',
              letterSpacing: '-0.025em',
              color: '#1d1d1f',
              fontSize: 'clamp(2.75rem, 9.5vw, 6rem)',
            }}
          >
            Gagnez plus,
            <br />
            <span style={{ fontStyle: 'italic', color: '#1d1d1f' }}>
              roulez moins.
            </span>
          </motion.h1>

          {/* Sub-line vouvoyée Apple gray */}
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="text-base sm:text-lg leading-relaxed mb-10 sm:mb-12 max-w-xl mx-auto"
            style={{ color: '#6e6e73' }}
          >
            Tapez votre zone. Ajnaya vous dit où ça paie ce soir.
          </motion.p>

          {/* Search bar — blanc pur Apple avec ombre précise */}
          <motion.form
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.25 }}
            onSubmit={handleSubmit}
            className="max-w-xl mx-auto"
          >
            <div
              className="group relative flex items-center gap-2 rounded-full transition-all px-4 sm:px-5 py-2.5 sm:py-3 cursor-text focus-within:ring-2 focus-within:ring-[#0071E3]/30"
              style={{
                backgroundColor: '#ffffff',
                boxShadow:
                  '0 0 0 1px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.06), 0 12px 32px -16px rgba(0,0,0,0.18)',
              }}
              onClick={() => inputRef.current?.focus()}
            >
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
                className="flex-1 bg-transparent border-none outline-none text-base sm:text-lg font-medium placeholder-[#86868b] tabular-nums min-w-0 py-1"
                style={{ color: '#1d1d1f' }}
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
                {isLocating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <LocateFixed className="w-4 h-4" />
                )}
                {isLocated && (
                  <span
                    className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-violet-500"
                    aria-hidden="true"
                    style={{
                      boxShadow: '0 0 0 3px rgba(140, 82, 255, 0.20)',
                    }}
                  />
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
