'use client'

import React from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { useReducedMotion } from '@/hooks/useDevicePerf'

/**
 * DepthBackground — Site2026v51
 *
 * Système de profondeur Apple/Stripe/Linear-grade :
 *
 * Z-stack ascendant (8 couches calibrées) :
 *   0. Solid noir #050508 (body)
 *   1. Mesh radial 3 stops (cyan TL + violet center + gold BR) — 6-10% opacity max
 *   2. Linear gradient diagonal subtil (signature einvoice page)
 *   3. Grain SVG noise overlay (1-2% opacity) — casse le "trop CSS"
 *   4. Orbes flottants blur 200px (parallax scroll-driven)
 *   5. Vignette edges (dark fade aux bords pour focus center)
 *   ───────── Le contenu prend les couches 6+ ─────────
 *
 * Variants :
 *   - 'hero' : full intensity (orbes 5, mesh visible)
 *   - 'section' : intensity moyenne (orbes 2, mesh discret)
 *   - 'minimal' : juste solide + grain
 *
 * Usage :
 *   <section className="relative">
 *     <DepthBackground variant="hero" />
 *     <div className="relative z-10">{content}</div>
 *   </section>
 */

export type DepthVariant = 'hero' | 'section' | 'minimal'

interface DepthBackgroundProps {
  variant?: DepthVariant
  parallax?: boolean              // active scroll-driven parallax (orbes)
  meshIntensity?: number          // 0.5 - 1.5 multiplicateur opacity mesh
  className?: string
}

export function DepthBackground({
  variant = 'section',
  parallax = true,
  meshIntensity = 1,
  className = '',
}: DepthBackgroundProps) {
  const reducedMotion = useReducedMotion()
  const ref = React.useRef<HTMLDivElement>(null)

  // Parallax scroll-driven (only desktop, only if no reduce-motion)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })

  const orbY1 = useTransform(scrollYProgress, [0, 1], [0, -120])
  const orbY2 = useTransform(scrollYProgress, [0, 1], [0, -80])
  const orbY3 = useTransform(scrollYProgress, [0, 1], [0, 100])
  const orbY4 = useTransform(scrollYProgress, [0, 1], [0, -60])
  const orbY5 = useTransform(scrollYProgress, [0, 1], [0, 140])

  const useParallax = parallax && !reducedMotion

  // Intensity multipliers
  const intensities = {
    hero:    { mesh: 1.2, orbs: 5, vignette: 0.6 },
    section: { mesh: 0.7, orbs: 2, vignette: 0.4 },
    minimal: { mesh: 0,   orbs: 0, vignette: 0.3 },
  }
  const cfg = intensities[variant]

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
    >
      {/* ── Layer 1 — Mesh radial 3 stops (Stripe homepage style) ── */}
      {variant !== 'minimal' && (
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 80% 50% at 20% 0%, rgba(0, 212, 255, ${0.10 * cfg.mesh * meshIntensity}) 0%, transparent 50%),
              radial-gradient(ellipse 70% 60% at 80% 30%, rgba(140, 82, 255, ${0.08 * cfg.mesh * meshIntensity}) 0%, transparent 55%),
              radial-gradient(ellipse 60% 40% at 50% 100%, rgba(245, 200, 66, ${0.05 * cfg.mesh * meshIntensity}) 0%, transparent 60%)
            `,
          }}
        />
      )}

      {/* ── Layer 2 — Linear diagonal subtil (signature einvoice) ── */}
      {variant === 'hero' && (
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, rgba(0, 212, 255, ${0.06 * meshIntensity}) 0%, rgba(140, 82, 255, ${0.04 * meshIntensity}) 50%, transparent 100%)`,
          }}
        />
      )}

      {/* ── Layer 3 — Grain SVG noise overlay (Apple Vision Pro style) ── */}
      <div
        className="absolute inset-0 opacity-[0.018] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.5 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: '180px 180px',
        }}
      />

      {/* ── Layer 4 — Orbes flottants parallax scroll-driven ── */}
      {cfg.orbs >= 1 && (
        <motion.div
          style={useParallax ? { y: orbY1 } : undefined}
          className="absolute top-[-10%] left-[10%] w-[600px] h-[600px] rounded-full bg-accent-cyan/[0.05] blur-[180px]"
        />
      )}
      {cfg.orbs >= 2 && (
        <motion.div
          style={useParallax ? { y: orbY2 } : undefined}
          className="absolute top-[40%] right-[5%] w-[500px] h-[500px] rounded-full bg-accent-purple/[0.06] blur-[160px]"
        />
      )}
      {cfg.orbs >= 3 && (
        <motion.div
          style={useParallax ? { y: orbY3 } : undefined}
          className="absolute bottom-[-15%] left-[30%] w-[700px] h-[700px] rounded-full bg-[#B494FF]/[0.04] blur-[200px]"
        />
      )}
      {cfg.orbs >= 4 && (
        <motion.div
          style={useParallax ? { y: orbY4 } : undefined}
          className="absolute top-[20%] left-[50%] w-[400px] h-[400px] rounded-full bg-accent-cyan/[0.03] blur-[140px]"
        />
      )}
      {cfg.orbs >= 5 && (
        <motion.div
          style={useParallax ? { y: orbY5 } : undefined}
          className="absolute bottom-[10%] right-[20%] w-[450px] h-[450px] rounded-full bg-accent-gold/[0.04] blur-[150px]"
        />
      )}

      {/* ── Layer 5 — Vignette edges (focus center, Apple style) ── */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 100% 80% at 50% 50%, transparent 40%, rgba(5, 5, 8, ${cfg.vignette}) 100%)`,
        }}
      />
    </div>
  )
}

export default DepthBackground
