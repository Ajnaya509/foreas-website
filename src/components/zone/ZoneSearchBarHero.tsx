'use client'

import { useState, useEffect, useRef, FormEvent } from 'react'
import { motion } from 'framer-motion'
import { MapPin, ArrowRight, Loader2 } from 'lucide-react'
import { useTypewriter } from '@/hooks/useTypewriter'
import { recordSearch, readVisitState, type SarcasmLevel } from '@/lib/sarcasticVisits'
import { getVisitorId } from '@/lib/zoneFingerprint'
import ZoneSearchResultCard from './ZoneSearchResultCard'

const PLACEHOLDER_ZONES = [
  'Aéroport CDG…',
  'La Défense…',
  'Place d\'Italie…',
  'Lyon Part-Dieu…',
  'Bordeaux Saint-Jean…',
  'Bercy…',
]

interface ZoneStats {
  zone_match: string
  avg_hourly: number
  demand_delta_pct: number
  top_pool: string
  courses_count: number
  week_iso: string
  last_updated: string
  has_data: boolean
  fallback_zone?: { name: string; avg_hourly: number }
}

/**
 * ZoneSearchBarHero — composant principal du hero /ou-ca-paie
 *
 * Design system : variant pulse 0.9s (Ajnaya réfléchit), eyebrow officielle,
 * letter-spacing -0.045em sur display, glass card focus cyan glow.
 *
 * Copy-atomic : open loop H1 "Tu fais combien net cette semaine ?" alterné,
 * placeholder animé qui se tape tout seul = mécanisme rendu visible.
 */
export default function ZoneSearchBarHero() {
  const [zoneInput, setZoneInput] = useState('')
  const [stats, setStats] = useState<ZoneStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [sarcasmLevel, setSarcasmLevel] = useState<SarcasmLevel>(1)
  const [hasInteracted, setHasInteracted] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Placeholder animé (en boucle)
  const animatedPlaceholder = useTypewriter({
    texts: PLACEHOLDER_ZONES,
    typeSpeedMs: 80,
    pauseMs: 1400,
    eraseSpeedMs: 35,
    startDelayMs: 1200,
  })

  // Init fingerprint silencieux dès le mount (pour retargeting + persistance)
  useEffect(() => {
    let cancelled = false
    getVisitorId().then((identity) => {
      if (cancelled) return
      // Lecture initiale de l'état visite (pour pré-charger le sarcasme)
      const state = readVisitState()
      setSarcasmLevel(state.level)

      // Tracking init Meta CAPI (visitorId + page_view)
      if (typeof window !== 'undefined' && window.fbq) {
        window.fbq('trackCustom', 'HomeSearchPageView', {
          visitor_id: identity.visitorId,
          confidence: identity.confidence,
          page: '/ou-ca-paie',
        })
      }
    })
    return () => {
      cancelled = true
    }
  }, [])

  // Soumission de la search
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const zone = zoneInput.trim()
    if (!zone) {
      inputRef.current?.focus()
      return
    }

    setLoading(true)
    setHasInteracted(true)

    // 1. Enregistrer la visite (sarcasm level)
    const newState = recordSearch(zone)
    setSarcasmLevel(newState.level)

    // 2. Tracking Meta CAPI — HomeSearchSubmitted
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('trackCustom', 'HomeSearchSubmitted', {
        zone,
        visit_count: newState.count,
        sarcasm_level: newState.level,
      })
    }

    try {
      const res = await fetch(`/api/home/zone-stats?zone=${encodeURIComponent(zone)}`)
      const data = (await res.json()) as ZoneStats
      setStats(data)

      // 3. Tracking Meta CAPI — HomeSearchResultViewed
      if (typeof window !== 'undefined' && window.fbq) {
        window.fbq('trackCustom', 'HomeSearchResultViewed', {
          zone: data.zone_match,
          has_data: data.has_data,
          avg_hourly: data.avg_hourly,
        })
      }
    } catch {
      // Silencieux côté UX, fallback affiché
      setStats({
        zone_match: zone,
        avg_hourly: 0,
        demand_delta_pct: 0,
        top_pool: '',
        courses_count: 0,
        week_iso: '',
        last_updated: new Date().toISOString(),
        has_data: false,
        fallback_zone: { name: 'Aéroport CDG', avg_hourly: 41.8 },
      })
    } finally {
      setLoading(false)
    }
  }

  const handleWAClick = () => {
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('trackCustom', 'WhatsAppLinkClicked', {
        section: 'hero_zone',
        zone: stats?.zone_match,
      })
    }
  }

  return (
    <section className="relative pt-28 sm:pt-32 pb-12 sm:pb-16 px-4 overflow-hidden">
      {/* Background variant pulse — halo rapide 0.9s "Ajnaya réfléchit" */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0 animate-halo-pulse-fast"
          style={{
            background:
              'radial-gradient(ellipse 60% 50% at 25% 15%, rgba(140,82,255,0.22) 0%, transparent 70%),' +
              'radial-gradient(ellipse 50% 45% at 80% 20%, rgba(0,212,255,0.14) 0%, transparent 70%)',
          }}
        />
        <div
          className="absolute inset-0 animate-halo-pulse"
          style={{
            background:
              'radial-gradient(ellipse 70% 60% at 50% 90%, rgba(140,82,255,0.08) 0%, transparent 75%),' +
              'radial-gradient(ellipse 35% 30% at 90% 70%, rgba(255,102,153,0.07) 0%, transparent 70%)',
          }}
        />
        {/* Micro-grain anti-banding */}
        <div className="absolute inset-0" style={{ backgroundColor: 'rgba(255,255,255,0.012)' }} />
      </div>

      <div className="relative max-w-3xl mx-auto text-center">
        {/* Eyebrow officielle — design system §11 */}
        <motion.p
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-[#00D4FF] text-[10px] font-extrabold uppercase mb-6"
          style={{ letterSpacing: '0.28em' }}
        >
          FOREAS · IA · MOBILITÉ INTELLIGENTE
        </motion.p>

        {/* H1 — Niveau L2 hero */}
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.05] mb-3 text-[#F8FAFC]"
          style={{ letterSpacing: '-0.045em' }}
        >
          Gagne plus.{' '}
          <span className="bg-gradient-to-r from-violet-300 via-cyan-200 to-violet-300 bg-clip-text text-transparent">
            Roule moins.
          </span>
        </motion.h1>

        {/* Sub identitaire */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="text-white/70 text-base sm:text-lg mb-10 leading-relaxed max-w-xl mx-auto"
        >
          Tape ta zone. Ajnaya te dit où ça paie ce soir.
        </motion.p>

        {/* Search bar — glass card focus cyan glow */}
        <motion.form
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          onSubmit={handleSubmit}
          className="max-w-xl mx-auto"
        >
          <div
            className="group relative flex items-center gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-md px-4 sm:px-5 py-3 sm:py-4 transition-all focus-within:border-cyan-400/50"
            style={{ boxShadow: '0 0 0 1px rgba(255,255,255,0.04), 0 20px 60px -20px rgba(0,212,255,0.20)' }}
          >
            <MapPin className="w-5 h-5 text-cyan-300 flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={zoneInput}
              onChange={(e) => setZoneInput(e.target.value)}
              placeholder={hasInteracted ? 'Tape ta zone…' : animatedPlaceholder}
              autoComplete="off"
              spellCheck={false}
              className="flex-1 bg-transparent border-none outline-none text-[#F8FAFC] placeholder-white/30 text-base sm:text-lg font-medium"
              style={{ fontVariantNumeric: 'tabular-nums' }}
            />
            <button
              type="submit"
              disabled={loading || !zoneInput.trim()}
              aria-label="Voir le tarif horaire"
              className="flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-sm font-bold transition-all bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ boxShadow: '0 0 24px rgba(140,82,255,0.30)' }}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span className="hidden sm:inline">Voir</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          {/* Trust strip sous la barre */}
          <p className="text-white/45 text-xs mt-3 tabular-nums">
            Données réelles · 247 chauffeurs FOREAS · maj toutes les heures · sans inscription
          </p>
        </motion.form>

        {/* Résultat search */}
        {stats && (
          <div className="mt-8 max-w-xl mx-auto text-left">
            <ZoneSearchResultCard
              stats={stats}
              sarcasmLevel={sarcasmLevel}
              onWhatsAppClick={handleWAClick}
            />
          </div>
        )}
      </div>
    </section>
  )
}

// ─── Type augmentation pour Meta Pixel ──────────────────────────────
declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void
  }
}
