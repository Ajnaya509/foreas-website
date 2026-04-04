'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion, useReducedMotion } from 'framer-motion'
import Link from 'next/link'

// ─── Types ────────────────────────────────────────────────────────────────────
export interface LandingContent {
  topic_slug: string
  meta_title?: string
  meta_description?: string
  content: {
    hero_stat: string
    hero_stat_source: string
    story_character: string
    story_body: string
    before_title: string
    after_title: string
    before_items: string[]
    after_items: string[]
    projection_intro: string
    projection_items: string[]
    aha_headline: string
    aha_body: string
    proof_items: Array<{ name: string; location: string; period: string; result: string }>
    cta_headline: string
    cta_guarantee: string
  }
}

// ─── Tracking hook ────────────────────────────────────────────────────────────
function useLandingTracking(topicSlug: string) {
  const searchParams = useSearchParams()
  const tracked = useRef(false)
  const scrollTimeout = useRef<ReturnType<typeof setTimeout>>()
  const maxScroll = useRef(0)
  const startTime = useRef(Date.now())

  const getUtm = useCallback(() => ({
    utm_source: searchParams.get('utm_source') || 'direct',
    utm_medium: searchParams.get('utm_medium') || 'none',
    utm_campaign: searchParams.get('utm_campaign') || 'none',
  }), [searchParams])

  useEffect(() => {
    if (tracked.current) return
    tracked.current = true

    // Pageview
    fetch('/api/track-landing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic_slug: topicSlug, event_type: 'pageview', ...getUtm() }),
    }).catch(() => {})

    // Scroll tracking — throttled, +20% threshold
    const scrollHandler = () => {
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current)
      scrollTimeout.current = setTimeout(() => {
        const scrollPercent = Math.round(
          (window.scrollY / Math.max(document.body.scrollHeight - window.innerHeight, 1)) * 100
        )
        if (scrollPercent > maxScroll.current + 20) {
          maxScroll.current = scrollPercent
          fetch('/api/track-landing', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              topic_slug: topicSlug,
              event_type: 'scroll',
              scroll_depth: maxScroll.current,
              time_on_page: Math.round((Date.now() - startTime.current) / 1000),
            }),
          }).catch(() => {})
        }
      }, 500)
    }

    window.addEventListener('scroll', scrollHandler, { passive: true })
    return () => {
      window.removeEventListener('scroll', scrollHandler)
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current)
    }
  }, [topicSlug, getUtm])

  const trackCTAClick = useCallback(() => {
    fetch('/api/track-landing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic_slug: topicSlug, event_type: 'cta_click', ...getUtm() }),
    }).catch(() => {})
  }, [topicSlug, getUtm])

  return { trackCTAClick }
}

// ─── Section fade-in wrapper ──────────────────────────────────────────────────
function FadeIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const prefersReduced = useReducedMotion()
  if (prefersReduced) return <>{children}</>
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.55, delay, ease: [0.25, 0.1, 0.25, 1] }}
    >
      {children}
    </motion.div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function LandingPageTemplate({ content }: { content: LandingContent }) {
  const { topic_slug, content: c } = content
  const { trackCTAClick } = useLandingTracking(topic_slug)
  const [showStickyCtA, setShowStickyCta] = useState(false)

  // Sticky CTA après 50% scroll
  useEffect(() => {
    const handler = () => {
      const pct = window.scrollY / Math.max(document.body.scrollHeight - window.innerHeight, 1)
      setShowStickyCta(pct > 0.5)
    }
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  const ctaHref = `/go/${topic_slug}`

  return (
    <div className="bg-[#050508] text-white min-h-screen overflow-x-hidden">

      {/* ── SECTION 1 — PATTERN INTERRUPT ─────────────────────────────────── */}
      <section className="min-h-screen flex flex-col items-center justify-center px-4 py-20 text-center relative">
        {/* Gradient glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-[0.06]"
            style={{ background: 'radial-gradient(circle, #00D4FF 0%, transparent 70%)' }} />
        </div>

        <FadeIn>
          <p className="text-xs uppercase tracking-[0.3em] text-[#00D4FF] mb-6 font-medium">
            FOREAS Driver
          </p>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-[#00D4FF] leading-tight mb-6 max-w-3xl"
            style={{ fontFamily: 'Genos, sans-serif' }}>
            {c.hero_stat}
          </h1>
          <p className="text-gray-400 text-sm mb-10 max-w-xs mx-auto">
            {c.hero_stat_source}
          </p>
          <Link
            href={ctaHref}
            onClick={trackCTAClick}
            className="inline-block px-8 py-4 bg-[#00D4FF] text-[#050508] font-black text-base rounded-2xl hover:bg-cyan-300 transition-all shadow-[0_0_30px_rgba(0,212,255,0.3)]"
          >
            Essayer gratuitement →
          </Link>
        </FadeIn>

        {/* Scroll arrow */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-gray-600"
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 14l-6-6h12l-6 6z" />
          </svg>
        </motion.div>
      </section>

      {/* ── SECTION 2 — EPIPHANY BRIDGE ───────────────────────────────────── */}
      <section className="px-4 py-20 max-w-2xl mx-auto">
        <FadeIn>
          <p className="text-xs uppercase tracking-[0.25em] text-gray-500 mb-8">L&apos;histoire</p>
          <div className="prose prose-invert prose-lg max-w-none">
            <p className="text-gray-300 leading-relaxed text-lg whitespace-pre-line">
              {c.story_body}
            </p>
          </div>
        </FadeIn>
      </section>

      {/* ── SECTION 3 — DÉSIR VS RÉALITÉ ──────────────────────────────────── */}
      <section className="px-4 py-20 max-w-4xl mx-auto">
        <FadeIn>
          <p className="text-xs uppercase tracking-[0.25em] text-gray-500 mb-10 text-center">La réalité vs le possible</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Avant */}
            <div className="rounded-2xl border border-red-900/40 bg-red-950/10 p-6">
              <p className="text-red-400 text-xs font-bold uppercase tracking-widest mb-4">
                {c.before_title}
              </p>
              <ul className="space-y-3">
                {c.before_items.map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-gray-400 text-sm">
                    <span className="text-red-500 mt-0.5 flex-shrink-0">✕</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            {/* Après */}
            <div className="rounded-2xl border border-[#00D4FF]/30 bg-[#00D4FF]/5 p-6">
              <p className="text-[#00D4FF] text-xs font-bold uppercase tracking-widest mb-4">
                {c.after_title}
              </p>
              <ul className="space-y-3">
                {c.after_items.map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-gray-200 text-sm">
                    <span className="text-[#10B981] mt-0.5 flex-shrink-0">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </FadeIn>
      </section>

      {/* ── SECTION 4 — BOULE DE CRISTAL ──────────────────────────────────── */}
      <section className="px-4 py-20 max-w-2xl mx-auto text-center">
        <FadeIn>
          <p className="text-xs uppercase tracking-[0.25em] text-gray-500 mb-4">Dans 30 jours</p>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-8" style={{ fontFamily: 'Genos, sans-serif' }}>
            {c.projection_intro}
          </h2>
          <ul className="space-y-4 text-left max-w-sm mx-auto">
            {c.projection_items.map((item, i) => (
              <FadeIn key={i} delay={i * 0.1}>
                <li className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-[#00D4FF] text-lg font-bold flex-shrink-0">{i + 1}</span>
                  <span className="text-gray-300 text-sm leading-relaxed">{item}</span>
                </li>
              </FadeIn>
            ))}
          </ul>
        </FadeIn>
      </section>

      {/* ── SECTION 5 — AHA MOMENT ────────────────────────────────────────── */}
      <section className="px-4 py-20 max-w-2xl mx-auto">
        <FadeIn>
          <div className="rounded-2xl border border-[#8C52FF]/40 bg-[#8C52FF]/5 p-8 text-center">
            <p className="text-xs uppercase tracking-[0.25em] text-[#8C52FF] mb-4">Ce que fait FOREAS</p>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4" style={{ fontFamily: 'Genos, sans-serif' }}>
              {c.aha_headline}
            </h2>
            <p className="text-gray-400 text-base leading-relaxed">
              {c.aha_body}
            </p>
          </div>
        </FadeIn>
      </section>

      {/* ── SECTION 6 — PREUVES ───────────────────────────────────────────── */}
      <section className="px-4 py-20 max-w-2xl mx-auto">
        <FadeIn>
          <p className="text-xs uppercase tracking-[0.25em] text-gray-500 mb-8 text-center">Résultats réels</p>
          <div className="space-y-4">
            {c.proof_items.map((proof, i) => (
              <FadeIn key={i} delay={i * 0.08}>
                <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                  <div>
                    <p className="text-white font-semibold text-sm">{proof.name}</p>
                    <p className="text-gray-500 text-xs">{proof.location} · {proof.period}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[#10B981] font-black text-lg">{proof.result}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </FadeIn>
      </section>

      {/* ── SECTION 7 — CTA FINAL ─────────────────────────────────────────── */}
      <section className="px-4 py-24 text-center relative">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at center bottom, rgba(0,212,255,0.06) 0%, transparent 60%)' }} />

        <FadeIn>
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4 max-w-lg mx-auto" style={{ fontFamily: 'Genos, sans-serif' }}>
            {c.cta_headline}
          </h2>
          <p className="text-gray-400 text-sm mb-8 max-w-sm mx-auto">{c.cta_guarantee}</p>

          <Link
            href={ctaHref}
            onClick={trackCTAClick}
            className="inline-block px-10 py-5 bg-[#00D4FF] text-[#050508] font-black text-lg rounded-2xl hover:bg-cyan-300 transition-all shadow-[0_0_50px_rgba(0,212,255,0.4)] mb-4"
          >
            Commencer l&apos;essai gratuit →
          </Link>

          <p className="text-xs text-gray-600 mt-4">
            Annulation en 1 clic · Pas d&apos;engagement · 0€ débité pendant l&apos;essai
          </p>
        </FadeIn>
      </section>

      {/* ── STICKY CTA MOBILE ─────────────────────────────────────────────── */}
      {showStickyCtA && (
        <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden px-4 pb-4 pt-2 bg-gradient-to-t from-[#050508] to-transparent">
          <Link
            href={ctaHref}
            onClick={trackCTAClick}
            className="block w-full py-4 bg-[#00D4FF] text-[#050508] font-black text-center rounded-2xl shadow-[0_0_30px_rgba(0,212,255,0.4)]"
          >
            Essayer gratuitement →
          </Link>
        </div>
      )}
    </div>
  )
}
