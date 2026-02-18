'use client'

import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'

/* ─────────────────────────────────────────────
   FOREAS Sync — Orbital Particle Login
   ───────────────────────────────────────────── */

interface Particle {
  orbit: number
  angle: number
  speed: number
  size: number
  opacity: number
  color: string
  trail: { x: number; y: number; opacity: number }[]
}

const COLORS = {
  cyan: '#00D4FF',
  purple: '#8C52FF',
  magenta: '#EC4899',
  white: '#ffffff',
}

const ORBIT_COUNT = 5
const PARTICLES_PER_ORBIT = [8, 12, 6, 10, 4]
const ORBIT_RADII = [80, 130, 180, 230, 280]

function createParticles(): Particle[] {
  const particles: Particle[] = []
  const colorKeys = Object.values(COLORS)
  for (let o = 0; o < ORBIT_COUNT; o++) {
    for (let p = 0; p < PARTICLES_PER_ORBIT[o]; p++) {
      particles.push({
        orbit: o,
        angle: (Math.PI * 2 * p) / PARTICLES_PER_ORBIT[o] + Math.random() * 0.5,
        speed: (0.002 + Math.random() * 0.003) * (o % 2 === 0 ? 1 : -1),
        size: 1.5 + Math.random() * 2.5,
        opacity: 0.3 + Math.random() * 0.7,
        color: colorKeys[Math.floor(Math.random() * colorKeys.length)],
        trail: [],
      })
    }
  }
  return particles
}

function OrbitalCanvas({ phase }: { phase: 'idle' | 'sending' | 'success' }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>(createParticles())
  const frameRef = useRef<number>(0)
  const phaseRef = useRef(phase)
  const convergenceRef = useRef(0)
  const pulseRef = useRef(0)

  useEffect(() => {
    phaseRef.current = phase
    if (phase === 'sending') convergenceRef.current = 0
  }, [phase])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const w = canvas.clientWidth
    const h = canvas.clientHeight
    canvas.width = w * dpr
    canvas.height = h * dpr
    ctx.scale(dpr, dpr)

    const cx = w / 2
    const cy = h / 2
    const currentPhase = phaseRef.current

    // Clear
    ctx.clearRect(0, 0, w, h)

    // Draw orbit rings (subtle)
    for (let i = 0; i < ORBIT_COUNT; i++) {
      const r = ORBIT_RADII[i]
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.strokeStyle =
        currentPhase === 'success'
          ? `rgba(0, 212, 255, ${0.06 + pulseRef.current * 0.1})`
          : `rgba(255, 255, 255, ${0.03 + Math.sin(Date.now() / 2000 + i) * 0.01})`
      ctx.lineWidth = 0.5
      ctx.stroke()
    }

    // Center glow
    const glowRadius = currentPhase === 'success' ? 60 + pulseRef.current * 40 : 40 + Math.sin(Date.now() / 1000) * 5
    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowRadius)
    if (currentPhase === 'success') {
      gradient.addColorStop(0, `rgba(0, 212, 255, ${0.3 + pulseRef.current * 0.3})`)
      gradient.addColorStop(0.5, `rgba(140, 82, 255, ${0.1 + pulseRef.current * 0.1})`)
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
    } else {
      gradient.addColorStop(0, 'rgba(140, 82, 255, 0.15)')
      gradient.addColorStop(0.5, 'rgba(0, 212, 255, 0.05)')
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
    }
    ctx.fillStyle = gradient
    ctx.fillRect(cx - glowRadius, cy - glowRadius, glowRadius * 2, glowRadius * 2)

    // Update & draw particles
    const particles = particlesRef.current
    for (const p of particles) {
      // Speed multiplier based on phase
      let speedMul = 1
      if (currentPhase === 'sending') {
        speedMul = 3 + convergenceRef.current * 8
        p.angle += p.speed * speedMul
      } else if (currentPhase === 'success') {
        speedMul = 0.5
        p.angle += p.speed * speedMul
      } else {
        p.angle += p.speed
      }

      // Orbit radius — converge toward center when sending
      let orbitR = ORBIT_RADII[p.orbit]
      if (currentPhase === 'sending') {
        orbitR = ORBIT_RADII[p.orbit] * (1 - convergenceRef.current * 0.9)
      } else if (currentPhase === 'success') {
        orbitR = ORBIT_RADII[p.orbit] * 0.1 + ORBIT_RADII[p.orbit] * 0.9 * (1 - pulseRef.current)
      }

      // Slight elliptical wobble
      const wobble = Math.sin(p.angle * 3 + Date.now() / 1000) * 0.08
      const x = cx + Math.cos(p.angle) * orbitR * (1 + wobble)
      const y = cy + Math.sin(p.angle) * orbitR * (0.85 + wobble * 0.5)

      // Trail
      p.trail.push({ x, y, opacity: p.opacity })
      if (p.trail.length > 8) p.trail.shift()

      // Draw trail
      for (let t = 0; t < p.trail.length; t++) {
        const tp = p.trail[t]
        const trailOpacity = (t / p.trail.length) * tp.opacity * 0.3
        ctx.beginPath()
        ctx.arc(tp.x, tp.y, p.size * 0.5, 0, Math.PI * 2)
        ctx.fillStyle = p.color.replace(')', `, ${trailOpacity})`).replace('rgb', 'rgba').replace('#', '')
        // Use hex color with alpha
        ctx.globalAlpha = trailOpacity
        ctx.fillStyle = p.color
        ctx.fill()
        ctx.globalAlpha = 1
      }

      // Draw particle
      const particleGlow = ctx.createRadialGradient(x, y, 0, x, y, p.size * 3)
      particleGlow.addColorStop(0, p.color)
      particleGlow.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.globalAlpha = p.opacity * (currentPhase === 'sending' ? 0.8 + convergenceRef.current * 0.2 : 1)
      ctx.beginPath()
      ctx.arc(x, y, p.size * 2, 0, Math.PI * 2)
      ctx.fillStyle = particleGlow
      ctx.fill()

      ctx.beginPath()
      ctx.arc(x, y, p.size, 0, Math.PI * 2)
      ctx.fillStyle = p.color
      ctx.fill()
      ctx.globalAlpha = 1
    }

    // Update convergence
    if (currentPhase === 'sending') {
      convergenceRef.current = Math.min(1, convergenceRef.current + 0.008)
    }
    if (currentPhase === 'success') {
      pulseRef.current = Math.min(1, pulseRef.current + 0.02)
    }

    // Success flash
    if (currentPhase === 'success' && pulseRef.current < 0.3) {
      ctx.fillStyle = `rgba(0, 212, 255, ${(0.3 - pulseRef.current) * 0.5})`
      ctx.fillRect(0, 0, w, h)
    }

    frameRef.current = requestAnimationFrame(draw)
  }, [])

  useEffect(() => {
    frameRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(frameRef.current)
  }, [draw])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ width: '100%', height: '100%' }}
    />
  )
}

/* ─────────────────────────────────────────────
   Main Login Page
   ───────────────────────────────────────────── */
export default function DashboardLogin() {
  const router = useRouter()
  const [role, setRole] = useState<'driver' | 'partner'>('driver')
  const [email, setEmail] = useState('')
  const [phase, setPhase] = useState<'idle' | 'sending' | 'success'>('idle')
  const [emailSent, setEmailSent] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setPhase('sending')

    // Simulate magic link send (TODO: wire Supabase)
    setTimeout(() => {
      setPhase('success')
      setTimeout(() => {
        setEmailSent(true)
      }, 1200)
    }, 2500)
  }

  // For now: dev bypass — double-click logo to skip to dashboard
  const handleDevBypass = () => {
    router.push(role === 'driver' ? '/509/dashboard/driver' : '/509/dashboard/partner')
  }

  return (
    <main className="min-h-screen bg-[#050508] flex items-center justify-center px-4 relative overflow-hidden">
      {/* Orbital Canvas — full background */}
      <div className="absolute inset-0">
        <OrbitalCanvas phase={phase} />
      </div>

      {/* Vignette overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 30%, #050508 75%)',
        }}
      />

      {/* Content */}
      <div className="relative z-10 w-full max-w-md">
        <AnimatePresence mode="wait">
          {!emailSent ? (
            <motion.div
              key="login-form"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Logo + Brand */}
              <div className="text-center mb-8">
                <motion.div
                  className="inline-flex items-center justify-center mb-5 cursor-pointer"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onDoubleClick={handleDevBypass}
                  animate={
                    phase === 'sending'
                      ? { scale: [1, 1.1, 1], transition: { repeat: Infinity, duration: 0.8 } }
                      : phase === 'success'
                        ? { scale: [1, 1.3, 1.15], transition: { duration: 0.6 } }
                        : {}
                  }
                >
                  <div className="relative">
                    <Image
                      src="/assets/logo-mini-blanc.svg"
                      alt="FOREAS"
                      width={56}
                      height={56}
                      className="relative z-10"
                    />
                    {/* Logo glow ring */}
                    <div
                      className={`absolute inset-0 -m-3 rounded-full transition-all duration-1000 ${
                        phase === 'sending'
                          ? 'bg-accent-cyan/20 shadow-[0_0_30px_10px] shadow-accent-cyan/30 scale-110'
                          : phase === 'success'
                            ? 'bg-accent-cyan/30 shadow-[0_0_60px_20px] shadow-accent-cyan/50 scale-125'
                            : 'bg-transparent'
                      }`}
                    />
                  </div>
                </motion.div>

                <motion.h1
                  className="font-title text-3xl text-white mb-1.5 tracking-wide"
                  animate={
                    phase === 'success' ? { color: '#00D4FF', transition: { duration: 0.4 } } : {}
                  }
                >
                  {phase === 'success' ? 'Lien envoyé' : 'FOREAS Sync'}
                </motion.h1>
                <p className="text-white/35 text-sm">
                  {phase === 'sending'
                    ? 'Synchronisation en cours...'
                    : phase === 'success'
                      ? 'Vérifiez votre boîte mail'
                      : 'Connectez votre espace dashboard'}
                </p>

                {/* Gradient pulse line */}
                <motion.div
                  className="mt-5 mx-auto h-[2px] rounded-full bg-gradient-to-r from-accent-purple/60 via-accent-cyan/80 to-accent-cyan/60"
                  animate={
                    phase === 'sending'
                      ? {
                          width: ['12rem', '16rem', '12rem'],
                          boxShadow: [
                            '0 0 8px 1px rgba(0,212,255,0.2)',
                            '0 0 20px 4px rgba(0,212,255,0.5)',
                            '0 0 8px 1px rgba(0,212,255,0.2)',
                          ],
                          transition: { repeat: Infinity, duration: 1.2 },
                        }
                      : phase === 'success'
                        ? { width: '20rem', boxShadow: '0 0 30px 6px rgba(0,212,255,0.6)' }
                        : { width: '12rem', boxShadow: '0 0 8px 1px rgba(0,212,255,0.2)' }
                  }
                  style={{ width: '12rem' }}
                />
              </div>

              {/* Login Card */}
              <motion.div
                className="backdrop-blur-xl bg-[#0a0a12]/80 border border-white/[0.06] rounded-2xl p-8 shadow-2xl"
                animate={
                  phase === 'sending'
                    ? {
                        borderColor: 'rgba(0,212,255,0.15)',
                        transition: { duration: 0.5 },
                      }
                    : phase === 'success'
                      ? { borderColor: 'rgba(0,212,255,0.3)' }
                      : {}
                }
              >
                {/* Role Toggle */}
                <div className="flex gap-2 p-1 bg-white/[0.03] rounded-xl mb-7">
                  {(['driver', 'partner'] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() => setRole(r)}
                      disabled={phase !== 'idle'}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                        role === r
                          ? r === 'driver'
                            ? 'bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/20 shadow-[0_0_12px_2px] shadow-accent-cyan/10'
                            : 'bg-accent-purple/10 text-accent-purple border border-accent-purple/20 shadow-[0_0_12px_2px] shadow-accent-purple/10'
                          : 'text-white/30 hover:text-white/50 border border-transparent'
                      }`}
                    >
                      {r === 'driver' ? '🚗  Chauffeur' : '🏢  Partenaire'}
                    </button>
                  ))}
                </div>

                <form onSubmit={handleLogin} className="space-y-5">
                  {/* Email */}
                  <div>
                    <label className="block text-white/40 text-[11px] font-medium mb-2 uppercase tracking-widest">
                      {role === 'driver' ? 'Votre email' : 'Email professionnel'}
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={role === 'driver' ? 'nom@email.com' : 'contact@flotte.com'}
                        disabled={phase !== 'idle'}
                        className="w-full pl-11 pr-4 py-3.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white placeholder:text-white/15 focus:outline-none focus:border-accent-cyan/30 focus:bg-white/[0.05] transition-all text-sm disabled:opacity-40"
                      />
                      {/* Mail icon */}
                      <svg
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                        />
                      </svg>
                    </div>
                  </div>

                  {/* Submit button */}
                  <motion.button
                    type="submit"
                    disabled={phase !== 'idle' || !email.trim()}
                    className={`w-full py-3.5 rounded-xl font-semibold text-sm text-white transition-all duration-300 relative overflow-hidden ${
                      phase !== 'idle'
                        ? 'opacity-70 cursor-wait'
                        : !email.trim()
                          ? 'opacity-40 cursor-not-allowed'
                          : 'hover:scale-[1.01] active:scale-[0.99]'
                    }`}
                    style={{
                      background:
                        role === 'driver'
                          ? 'linear-gradient(135deg, #00D4FF 0%, #00a8cc 100%)'
                          : 'linear-gradient(135deg, #8C52FF 0%, #6b3fd4 100%)',
                    }}
                    whileHover={phase === 'idle' && email.trim() ? { boxShadow: role === 'driver' ? '0 0 30px 5px rgba(0,212,255,0.3)' : '0 0 30px 5px rgba(140,82,255,0.3)' } : {}}
                  >
                    {phase === 'sending' ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                          <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" className="opacity-75" />
                        </svg>
                        Envoi du lien magique...
                      </span>
                    ) : phase === 'success' ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                        Lien envoyé !
                      </span>
                    ) : (
                      <>
                        <span className="relative z-10">
                          {role === 'driver' ? 'Recevoir mon lien de connexion' : 'Recevoir le magic link'}
                        </span>
                        {/* Shimmer effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 translate-x-[-200%] animate-[shimmer_3s_infinite]" />
                      </>
                    )}
                  </motion.button>
                </form>

                {/* Info text */}
                <p className="text-center text-white/20 text-[11px] mt-5 leading-relaxed">
                  {role === 'driver'
                    ? 'Un lien sécurisé sera envoyé à votre email. Pas de mot de passe nécessaire.'
                    : 'Accédez à votre espace partenaire via un lien sécurisé.'}
                </p>

                {/* Divider */}
                <div className="flex items-center gap-3 my-5">
                  <div className="flex-1 h-px bg-white/[0.04]" />
                  <span className="text-white/15 text-[10px] uppercase tracking-widest">ou</span>
                  <div className="flex-1 h-px bg-white/[0.04]" />
                </div>

                {/* Secondary options */}
                {role === 'driver' ? (
                  <button
                    disabled={phase !== 'idle'}
                    className="w-full py-3 rounded-xl border border-white/[0.06] text-white/35 hover:text-white/55 hover:border-white/[0.12] hover:bg-white/[0.02] transition-all text-sm font-medium disabled:opacity-30"
                  >
                    📱  Connexion par SMS
                  </button>
                ) : (
                  <p className="text-center text-white/25 text-xs">
                    Pas encore partenaire ?{' '}
                    <a
                      href="/509#contact"
                      className="text-accent-purple/70 hover:text-accent-purple transition-colors"
                    >
                      Contactez-nous
                    </a>
                  </p>
                )}
              </motion.div>

              {/* Back link */}
              <p className="text-center mt-6">
                <a
                  href="/509"
                  className="text-white/15 hover:text-white/35 text-xs transition-colors inline-flex items-center gap-1.5"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                  </svg>
                  Retour au site
                </a>
              </p>
            </motion.div>
          ) : (
            /* ─── Email Sent confirmation ─── */
            <motion.div
              key="email-sent"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="text-center"
            >
              <motion.div
                className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-accent-cyan/10 border border-accent-cyan/20 mb-6"
                animate={{
                  boxShadow: [
                    '0 0 0 0 rgba(0,212,255,0)',
                    '0 0 0 20px rgba(0,212,255,0.1)',
                    '0 0 0 40px rgba(0,212,255,0)',
                  ],
                }}
                transition={{ repeat: Infinity, duration: 2.5 }}
              >
                <svg className="w-9 h-9 text-accent-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                  />
                </svg>
              </motion.div>

              <h2 className="font-title text-2xl text-white mb-3">Vérifiez votre email</h2>
              <p className="text-white/40 text-sm mb-2 max-w-xs mx-auto">
                Un lien de connexion a été envoyé à
              </p>
              <p className="text-accent-cyan font-medium text-sm mb-8">{email}</p>

              <div className="backdrop-blur-xl bg-[#0a0a12]/60 border border-white/[0.06] rounded-xl p-5 max-w-xs mx-auto mb-8">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-accent-cyan/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-3 h-3 text-accent-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-white/30 text-xs leading-relaxed text-left">
                    Cliquez sur le lien dans l'email pour accéder instantanément à votre dashboard. Le lien expire dans 10 minutes.
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setPhase('idle')
                  setEmailSent(false)
                  setEmail('')
                }}
                className="text-white/25 hover:text-white/45 text-xs transition-colors"
              >
                ← Utiliser un autre email
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Shimmer keyframe (injected via style) */}
      <style jsx global>{`
        @keyframes shimmer {
          0% { transform: translateX(-200%) skewX(-12deg); }
          100% { transform: translateX(200%) skewX(-12deg); }
        }
      `}</style>
    </main>
  )
}
