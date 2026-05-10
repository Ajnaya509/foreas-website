'use client'

/**
 * IOSWaitlistView — Affiché quand l'user est sur iPhone/iPad/iPod sur /subscribe.
 *
 * Pourquoi ? Apple guideline 3.1.1 interdit Stripe Checkout in-app pour digital
 * goods. Plutôt que de risquer un blocage App Store + une UX dégradée, on
 * collecte l'email pour les prévenir quand l'app iOS sera live (StoreKit / IAP).
 *
 * Décision Chandler 10/05/2026 : "L'app iOS arrive, mais d'ici là on capte les
 * leads via cette page d'attente plutôt que de les laisser fuir."
 *
 * UX :
 *  - Capture email dans table Supabase `ios_waitlist` (RLS public insert ok)
 *  - Confirmation immédiate "On vous prévient dès la sortie iOS"
 *  - CTA secondaire : "Continuer sur Android" (deep link Google Play)
 *
 * Design System §13 : variant pulse (Ajnaya réfléchit) — halo violet+cyan
 * pulsant 0.9s en arrière. Brièveté radicale §1.2 : phrases ≤ 5 mots max.
 */

import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
)

const PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=com.foreas.driver'

export default function IOSWaitlistView() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState<string>('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorMsg('Email invalide')
      setStatus('error')
      return
    }

    setStatus('loading')
    setErrorMsg('')
    try {
      const { error } = await supabase
        .from('ios_waitlist')
        .insert({
          email: email.trim().toLowerCase(),
          ua: typeof navigator !== 'undefined' ? navigator.userAgent : null,
          source: 'subscribe_ios_guard',
        })
      // 23505 = unique violation → l'email est déjà inscrit, on traite ça comme success
      if (error && error.code !== '23505') {
        throw error
      }
      setStatus('success')
      // Tracking Meta CAPI
      try {
        const fbq = (window as unknown as { fbq?: (...args: unknown[]) => void }).fbq
        fbq?.('trackCustom', 'IOSWaitlistJoined', { email_hash: btoa(email).slice(0, 16) })
      } catch { /* ignore */ }
    } catch (err) {
      setErrorMsg((err as Error).message || 'Erreur — réessayez')
      setStatus('error')
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden"
      style={{ backgroundColor: '#000000' }}
    >
      {/* Halos couche 2 — variant pulse (Ajnaya réfléchit) §13 */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 60% 50% at 30% 20%, rgba(140, 82, 255, 0.22) 0%, transparent 70%),' +
            'radial-gradient(ellipse 50% 40% at 80% 80%, rgba(0, 212, 255, 0.14) 0%, transparent 70%)',
          filter: 'blur(60px)',
          animation: 'halo-pulse-fast 0.9s ease-in-out infinite alternate',
        }}
      />

      <div className="relative max-w-md w-full">
        {/* Eyebrow */}
        <p
          className="text-[10px] font-extrabold uppercase mb-5 tabular-nums"
          style={{
            color: '#00D4FF',
            letterSpacing: '0.25em',
          }}
        >
          FOREAS · iOS Bientôt
        </p>

        {/* Headline brièveté radicale */}
        <h1
          className="text-4xl sm:text-5xl font-black leading-[0.95] mb-4"
          style={{
            color: '#F8FAFC',
            letterSpacing: '-0.04em',
          }}
        >
          L'iPhone arrive.
          <br />
          <span
            style={{
              backgroundImage:
                'linear-gradient(135deg, #6C3CE0 0%, #8C52FF 50%, #00D4FF 100%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            On vous prévient.
          </span>
        </h1>

        <p
          className="text-base mb-8"
          style={{ color: 'rgba(248, 250, 252, 0.78)' }}
        >
          App Android dispo · iOS en cours d'optimisation StoreKit.
          <br />
          Email = priorité d'accès.
        </p>

        {status === 'success' ? (
          <div
            className="rounded-2xl border p-5"
            style={{
              backgroundColor: 'rgba(16, 185, 129, 0.08)',
              borderColor: 'rgba(16, 185, 129, 0.25)',
            }}
          >
            <p className="text-[15px] font-bold mb-1" style={{ color: '#10B981' }}>
              ✓ Inscrit.
            </p>
            <p className="text-[13px]" style={{ color: 'rgba(248, 250, 252, 0.78)' }}>
              On vous écrit dès la sortie iOS.
            </p>
            <a
              href={PLAY_STORE_URL}
              className="inline-flex items-center gap-2 mt-4 text-[13px] font-semibold transition-colors"
              style={{ color: '#00D4FF' }}
            >
              Vous avez un Android aussi ? →
            </a>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre@email.fr"
              autoComplete="email"
              inputMode="email"
              enterKeyHint="send"
              required
              disabled={status === 'loading'}
              className="w-full px-4 py-3.5 rounded-2xl text-[15px] font-medium outline-none transition-all"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: '#F8FAFC',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'rgba(0, 212, 255, 0.45)'
                e.target.style.boxShadow = '0 0 0 3px rgba(0, 212, 255, 0.18)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.08)'
                e.target.style.boxShadow = 'none'
              }}
            />
            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full py-3.5 rounded-2xl text-[15px] font-extrabold transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60"
              style={{
                background: 'linear-gradient(135deg, #8C52FF 0%, #6C3CE0 100%)',
                color: '#F8FAFC',
                boxShadow:
                  '0 8px 24px -8px rgba(140, 82, 255, 0.55), 0 0 0 1px rgba(140, 82, 255, 0.25)',
              }}
            >
              {status === 'loading' ? 'Envoi…' : 'Me prévenir'}
            </button>
            {errorMsg && (
              <p className="text-xs" style={{ color: '#EF4444' }}>
                {errorMsg}
              </p>
            )}
          </form>
        )}

        <a
          href={PLAY_STORE_URL}
          className="block mt-5 text-center text-[12px]"
          style={{ color: 'rgba(248, 250, 252, 0.32)' }}
        >
          · Disponible sur Google Play ·
        </a>
      </div>
    </div>
  )
}
