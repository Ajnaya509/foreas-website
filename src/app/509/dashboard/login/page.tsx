'use client'

import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

/* ─────────────────────────────────────────────
   FOREAS Sync V2 — Nebula Orbital Login
   Spectaculaire: plus de particules, orbites inclinées,
   nébuleuse centrale, effets de lumière
   ───────────────────────────────────────────── */

interface Particle {
  orbit: number
  angle: number
  speed: number
  size: number
  opacity: number
  hue: number
  tiltX: number
  tiltY: number
  trail: { x: number; y: number }[]
}

const ORBIT_CONFIG = [
  { radius: 60, count: 6, tiltX: 0.95, tiltY: 0.6 },
  { radius: 100, count: 10, tiltX: 0.8, tiltY: 0.85 },
  { radius: 150, count: 14, tiltX: 0.95, tiltY: 0.7 },
  { radius: 200, count: 10, tiltX: 0.75, tiltY: 0.9 },
  { radius: 260, count: 16, tiltX: 0.9, tiltY: 0.65 },
  { radius: 320, count: 8, tiltX: 0.85, tiltY: 0.8 },
  { radius: 380, count: 12, tiltX: 0.7, tiltY: 0.95 },
]

function hueToColor(hue: number): string {
  if (hue < 60) return `hsl(${185 + hue * 1.2}, 100%, ${55 + hue * 0.3}%)`  // cyan range
  if (hue < 120) return `hsl(${260 + (hue - 60) * 0.5}, 80%, ${60 + (hue - 60) * 0.2}%)` // purple range
  return `hsl(${320 + (hue - 120) * 0.8}, 85%, ${55 + (hue - 120) * 0.3}%)` // magenta range
}

function createParticles(): Particle[] {
  const particles: Particle[] = []
  for (let o = 0; o < ORBIT_CONFIG.length; o++) {
    const cfg = ORBIT_CONFIG[o]
    for (let p = 0; p < cfg.count; p++) {
      const dir = o % 2 === 0 ? 1 : -1
      particles.push({
        orbit: o,
        angle: (Math.PI * 2 * p) / cfg.count + Math.random() * 0.8,
        speed: (0.001 + Math.random() * 0.004) * dir,
        size: 1 + Math.random() * 3,
        opacity: 0.2 + Math.random() * 0.8,
        hue: Math.random() * 180,
        tiltX: cfg.tiltX + (Math.random() - 0.5) * 0.1,
        tiltY: cfg.tiltY + (Math.random() - 0.5) * 0.1,
        trail: [],
      })
    }
  }
  return particles
}

function NebulaCanvas({ phase }: { phase: 'idle' | 'sending' | 'success' }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>(createParticles())
  const frameRef = useRef<number>(0)
  const phaseRef = useRef(phase)
  const convergenceRef = useRef(0)
  const successTimeRef = useRef(0)
  const timeRef = useRef(0)

  useEffect(() => {
    phaseRef.current = phase
    if (phase === 'sending') convergenceRef.current = 0
    if (phase === 'success') successTimeRef.current = 0
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
    timeRef.current += 0.016

    // Clear with slight fade (motion blur)
    ctx.fillStyle = 'rgba(5, 5, 8, 0.15)'
    ctx.fillRect(0, 0, w, h)

    // ─── Nebula core glow ───
    const coreSize = currentPhase === 'success'
      ? 120 + successTimeRef.current * 200
      : currentPhase === 'sending'
        ? 80 + convergenceRef.current * 60
        : 60 + Math.sin(timeRef.current * 0.5) * 10

    const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreSize)
    if (currentPhase === 'success') {
      coreGrad.addColorStop(0, `rgba(0, 212, 255, ${0.4 + successTimeRef.current * 0.4})`)
      coreGrad.addColorStop(0.3, `rgba(140, 82, 255, ${0.2 + successTimeRef.current * 0.2})`)
      coreGrad.addColorStop(0.6, `rgba(236, 72, 153, ${0.05})`)
      coreGrad.addColorStop(1, 'rgba(0, 0, 0, 0)')
    } else if (currentPhase === 'sending') {
      coreGrad.addColorStop(0, `rgba(0, 212, 255, ${0.2 + convergenceRef.current * 0.3})`)
      coreGrad.addColorStop(0.4, `rgba(140, 82, 255, ${0.1 + convergenceRef.current * 0.15})`)
      coreGrad.addColorStop(1, 'rgba(0, 0, 0, 0)')
    } else {
      coreGrad.addColorStop(0, 'rgba(140, 82, 255, 0.12)')
      coreGrad.addColorStop(0.4, 'rgba(0, 212, 255, 0.06)')
      coreGrad.addColorStop(0.7, 'rgba(236, 72, 153, 0.02)')
      coreGrad.addColorStop(1, 'rgba(0, 0, 0, 0)')
    }
    ctx.fillStyle = coreGrad
    ctx.beginPath()
    ctx.arc(cx, cy, coreSize, 0, Math.PI * 2)
    ctx.fill()

    // ─── Orbit rings (ghostly) ───
    for (let i = 0; i < ORBIT_CONFIG.length; i++) {
      const cfg = ORBIT_CONFIG[i]
      const r = cfg.radius
      const ringOpacity = currentPhase === 'success'
        ? 0.05 + successTimeRef.current * 0.08
        : 0.015 + Math.sin(timeRef.current + i * 0.7) * 0.008

      ctx.save()
      ctx.translate(cx, cy)
      ctx.scale(cfg.tiltX, cfg.tiltY)
      ctx.beginPath()
      ctx.arc(0, 0, r, 0, Math.PI * 2)
      ctx.strokeStyle = currentPhase === 'success'
        ? `rgba(0, 212, 255, ${ringOpacity})`
        : `rgba(200, 200, 255, ${ringOpacity})`
      ctx.lineWidth = 0.5
      ctx.stroke()
      ctx.restore()
    }

    // ─── Particles ───
    const particles = particlesRef.current
    for (const p of particles) {
      const cfg = ORBIT_CONFIG[p.orbit]

      // Speed
      let speedMul = 1
      if (currentPhase === 'sending') {
        speedMul = 2 + convergenceRef.current * 12
      } else if (currentPhase === 'success') {
        speedMul = 0.3
      }
      p.angle += p.speed * speedMul

      // Orbit radius — converge
      let orbitR = cfg.radius
      if (currentPhase === 'sending') {
        orbitR = cfg.radius * (1 - convergenceRef.current * 0.95)
      } else if (currentPhase === 'success') {
        orbitR = cfg.radius * (0.05 + 0.95 * Math.min(1, successTimeRef.current * 2))
      }

      // 3D-ish position with tilt
      const x = cx + Math.cos(p.angle) * orbitR * p.tiltX
      const y = cy + Math.sin(p.angle) * orbitR * p.tiltY

      // Trail
      p.trail.push({ x, y })
      if (p.trail.length > 12) p.trail.shift()

      // Draw trail
      for (let t = 0; t < p.trail.length - 1; t++) {
        const tp = p.trail[t]
        const progress = t / p.trail.length
        const trailOp = progress * p.opacity * 0.25
        ctx.beginPath()
        ctx.arc(tp.x, tp.y, p.size * 0.4 * progress, 0, Math.PI * 2)
        ctx.fillStyle = hueToColor(p.hue)
        ctx.globalAlpha = trailOp
        ctx.fill()
      }

      // Outer glow
      const glowSize = p.size * (currentPhase === 'sending' ? 4 + convergenceRef.current * 3 : 3.5)
      const glow = ctx.createRadialGradient(x, y, 0, x, y, glowSize)
      glow.addColorStop(0, hueToColor(p.hue))
      glow.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.globalAlpha = p.opacity * (currentPhase === 'sending' ? 0.5 + convergenceRef.current * 0.5 : 0.4)
      ctx.beginPath()
      ctx.arc(x, y, glowSize, 0, Math.PI * 2)
      ctx.fillStyle = glow
      ctx.fill()

      // Core particle
      ctx.globalAlpha = p.opacity * (currentPhase === 'sending' ? 0.8 + convergenceRef.current * 0.2 : 0.9)
      ctx.beginPath()
      ctx.arc(x, y, p.size, 0, Math.PI * 2)
      ctx.fillStyle = hueToColor(p.hue)
      ctx.fill()

      // Bright center dot
      ctx.globalAlpha = p.opacity
      ctx.beginPath()
      ctx.arc(x, y, p.size * 0.4, 0, Math.PI * 2)
      ctx.fillStyle = '#ffffff'
      ctx.fill()

      ctx.globalAlpha = 1
    }

    // ─── Convergence / Success progress ───
    if (currentPhase === 'sending') {
      convergenceRef.current = Math.min(1, convergenceRef.current + 0.006)
    }
    if (currentPhase === 'success') {
      successTimeRef.current = Math.min(1, successTimeRef.current + 0.015)
    }

    // ─── Success flash ───
    if (currentPhase === 'success' && successTimeRef.current < 0.2) {
      const flashOp = (0.2 - successTimeRef.current) * 2
      ctx.fillStyle = `rgba(0, 212, 255, ${flashOp * 0.4})`
      ctx.fillRect(0, 0, w, h)
    }

    // ─── Ambient floating dust ───
    for (let i = 0; i < 30; i++) {
      const dx = cx + Math.sin(timeRef.current * 0.3 + i * 47) * (w * 0.45)
      const dy = cy + Math.cos(timeRef.current * 0.2 + i * 31) * (h * 0.45)
      ctx.globalAlpha = 0.03 + Math.sin(timeRef.current + i) * 0.02
      ctx.beginPath()
      ctx.arc(dx, dy, 0.8, 0, Math.PI * 2)
      ctx.fillStyle = '#aabbff'
      ctx.fill()
    }
    ctx.globalAlpha = 1

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
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setError('')
    setPhase('sending')

    try {
      const { error: authError } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/509/dashboard/auth/callback?role=${role}`,
        },
      })

      if (authError) {
        console.error('Auth error:', authError)
        setError(authError.message)
        setPhase('idle')
        return
      }

      setPhase('success')
      setTimeout(() => setEmailSent(true), 1500)
    } catch (err) {
      console.error('Login error:', err)
      setError('Erreur de connexion. Réessayez.')
      setPhase('idle')
    }
  }

  // Dev bypass
  const handleDevBypass = () => {
    router.push(role === 'driver' ? '/509/dashboard/driver' : '/509/dashboard/partner')
  }

  return (
    <main className="min-h-screen bg-[#050508] flex items-center justify-center px-4 relative overflow-hidden">
      {/* Nebula Canvas */}
      <div className="absolute inset-0">
        <NebulaCanvas phase={phase} />
      </div>

      {/* Vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 20%, rgba(5,5,8,0.4) 50%, #050508 80%)',
        }}
      />

      {/* Content */}
      <div className="relative z-10 w-full max-w-[420px]">
        <AnimatePresence mode="wait">
          {!emailSent ? (
            <motion.div
              key="login"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Logo */}
              <div className="text-center mb-8">
                <motion.div
                  className="inline-flex items-center justify-center mb-4 cursor-pointer"
                  whileHover={{ scale: 1.05 }}
                  onDoubleClick={handleDevBypass}
                  animate={
                    phase === 'sending'
                      ? { scale: [1, 1.15, 1], transition: { repeat: Infinity, duration: 0.6 } }
                      : phase === 'success'
                        ? { scale: [1, 1.4, 1.2], transition: { duration: 0.5 } }
                        : {}
                  }
                >
                  <div className="relative">
                    <Image
                      src="/assets/logo-mini-blanc.svg"
                      alt="FOREAS"
                      width={52}
                      height={52}
                      className="relative z-10"
                    />
                    <div
                      className={`absolute -inset-4 rounded-full transition-all duration-700 ${
                        phase === 'sending'
                          ? 'bg-accent-cyan/15 shadow-[0_0_40px_15px] shadow-accent-cyan/25'
                          : phase === 'success'
                            ? 'bg-accent-cyan/25 shadow-[0_0_80px_30px] shadow-accent-cyan/40'
                            : 'bg-transparent'
                      }`}
                    />
                  </div>
                </motion.div>

                <motion.h1
                  className="font-title text-[28px] text-white mb-1 tracking-wider"
                  animate={phase === 'success' ? { color: '#00D4FF' } : {}}
                >
                  {phase === 'success' ? 'Lien envoyé ✓' : 'FOREAS Sync'}
                </motion.h1>
                <p className="text-white/30 text-[13px]">
                  {phase === 'sending' ? 'Synchronisation...' : phase === 'success' ? 'Vérifiez votre boîte mail' : 'Connectez votre espace dashboard'}
                </p>

                <motion.div
                  className="mt-4 mx-auto h-[1.5px] rounded-full bg-gradient-to-r from-transparent via-accent-cyan/70 to-transparent"
                  animate={
                    phase === 'sending'
                      ? { width: ['8rem', '14rem', '8rem'], opacity: [0.6, 1, 0.6], transition: { repeat: Infinity, duration: 1 } }
                      : phase === 'success'
                        ? { width: '18rem', opacity: 1 }
                        : { width: '10rem', opacity: 0.5 }
                  }
                  style={{ width: '10rem' }}
                />
              </div>

              {/* Card */}
              <motion.div
                className="backdrop-blur-2xl bg-white/[0.03] border border-white/[0.06] rounded-2xl p-7 shadow-[0_8px_60px_-12px] shadow-black/50"
                animate={
                  phase === 'sending' ? { borderColor: 'rgba(0,212,255,0.12)' }
                    : phase === 'success' ? { borderColor: 'rgba(0,212,255,0.25)' }
                    : {}
                }
              >
                {/* Role Toggle */}
                <div className="flex gap-1.5 p-1 bg-white/[0.02] rounded-xl mb-6">
                  {(['driver', 'partner'] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() => { setRole(r); setError('') }}
                      disabled={phase !== 'idle'}
                      className={`flex-1 py-2 rounded-lg text-[13px] font-medium transition-all duration-300 ${
                        role === r
                          ? r === 'driver'
                            ? 'bg-accent-cyan/8 text-accent-cyan border border-accent-cyan/15'
                            : 'bg-accent-purple/8 text-accent-purple border border-accent-purple/15'
                          : 'text-white/25 hover:text-white/40 border border-transparent'
                      }`}
                    >
                      {r === 'driver' ? 'Chauffeur' : 'Partenaire'}
                    </button>
                  ))}
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="block text-white/30 text-[10px] font-medium mb-1.5 uppercase tracking-[0.15em]">
                      {role === 'driver' ? 'Votre email' : 'Email professionnel'}
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); setError('') }}
                        placeholder={role === 'driver' ? 'nom@email.com' : 'contact@flotte.com'}
                        disabled={phase !== 'idle'}
                        className="w-full pl-10 pr-4 py-3 bg-white/[0.02] border border-white/[0.06] rounded-xl text-white text-[13px] placeholder:text-white/12 focus:outline-none focus:border-accent-cyan/25 focus:bg-white/[0.04] transition-all disabled:opacity-30"
                      />
                      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                      </svg>
                    </div>
                  </div>

                  {error && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-red-400/80 text-[11px] text-center"
                    >
                      {error}
                    </motion.p>
                  )}

                  <motion.button
                    type="submit"
                    disabled={phase !== 'idle' || !email.trim()}
                    className={`w-full py-3 rounded-xl font-medium text-[13px] text-white transition-all duration-300 relative overflow-hidden ${
                      phase !== 'idle' ? 'opacity-60 cursor-wait'
                        : !email.trim() ? 'opacity-30 cursor-not-allowed'
                        : 'hover:scale-[1.01] active:scale-[0.99]'
                    }`}
                    style={{
                      background: role === 'driver'
                        ? 'linear-gradient(135deg, #00D4FF 0%, #0099bb 100%)'
                        : 'linear-gradient(135deg, #8C52FF 0%, #6b3fd4 100%)',
                    }}
                    whileHover={phase === 'idle' && email.trim() ? {
                      boxShadow: role === 'driver'
                        ? '0 0 35px 8px rgba(0,212,255,0.25)'
                        : '0 0 35px 8px rgba(140,82,255,0.25)'
                    } : {}}
                  >
                    {phase === 'sending' ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                          <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" className="opacity-75" />
                        </svg>
                        Envoi du lien...
                      </span>
                    ) : phase === 'success' ? (
                      <span className="flex items-center justify-center gap-1.5">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                        Envoyé !
                      </span>
                    ) : (
                      <span className="relative z-10">Recevoir mon lien de connexion</span>
                    )}
                  </motion.button>
                </form>

                <p className="text-center text-white/15 text-[10px] mt-4 leading-relaxed">
                  Un lien sécurisé sera envoyé. Pas de mot de passe.
                </p>

                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px bg-white/[0.04]" />
                  <span className="text-white/10 text-[9px] uppercase tracking-[0.2em]">ou</span>
                  <div className="flex-1 h-px bg-white/[0.04]" />
                </div>

                {role === 'driver' ? (
                  <button
                    disabled={phase !== 'idle'}
                    className="w-full py-2.5 rounded-xl border border-white/[0.05] text-white/25 hover:text-white/40 hover:border-white/[0.1] hover:bg-white/[0.02] transition-all text-[12px] font-medium disabled:opacity-20"
                  >
                    Connexion par SMS
                  </button>
                ) : (
                  <p className="text-center text-white/20 text-[11px]">
                    Pas encore partenaire ?{' '}
                    <a href="/509#contact" className="text-accent-purple/60 hover:text-accent-purple/80 transition-colors">
                      Contactez-nous
                    </a>
                  </p>
                )}
              </motion.div>

              <p className="text-center mt-5">
                <a href="/509" className="text-white/12 hover:text-white/30 text-[11px] transition-colors inline-flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                  </svg>
                  Retour au site
                </a>
              </p>
            </motion.div>
          ) : (
            /* ─── Email Sent ─── */
            <motion.div
              key="sent"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="text-center"
            >
              <motion.div
                className="inline-flex items-center justify-center w-18 h-18 rounded-full bg-accent-cyan/10 border border-accent-cyan/15 mb-5 p-4"
                animate={{
                  boxShadow: [
                    '0 0 0 0 rgba(0,212,255,0)',
                    '0 0 0 25px rgba(0,212,255,0.08)',
                    '0 0 0 50px rgba(0,212,255,0)',
                  ],
                }}
                transition={{ repeat: Infinity, duration: 2.5 }}
              >
                <svg className="w-8 h-8 text-accent-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
              </motion.div>

              <h2 className="font-title text-2xl text-white mb-2">Vérifiez votre email</h2>
              <p className="text-white/30 text-[13px] mb-1">Un lien de connexion a été envoyé à</p>
              <p className="text-accent-cyan font-medium text-[13px] mb-6">{email}</p>

              <div className="backdrop-blur-xl bg-white/[0.02] border border-white/[0.05] rounded-xl p-4 max-w-[300px] mx-auto mb-6">
                <p className="text-white/25 text-[11px] leading-relaxed">
                  Cliquez sur le lien dans l'email pour accéder à votre dashboard. Le lien expire dans 10 minutes.
                </p>
              </div>

              <button
                onClick={() => { setPhase('idle'); setEmailSent(false); setEmail('') }}
                className="text-white/20 hover:text-white/40 text-[11px] transition-colors"
              >
                ← Autre email
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  )
}
