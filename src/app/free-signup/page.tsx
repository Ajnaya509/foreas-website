'use client'

/**
 * /free-signup — Inscription tier Free FOREAS (auth Supabase only)
 *
 * Différence vs /subscribe :
 *  - Aucune CB demandée (cohérent avec H3 Freemium "Cheval de Troie")
 *  - Auth Supabase magic link (passwordless OTP) ou phone-only signup
 *  - Crée un row dans `public.user_profiles` avec tier='free' (trigger via webhook)
 *  - Redirige vers /success?tier=free puis app native (deep link foreas://)
 *
 * Stratégie : Tentacule 0 captures = la valeur réelle. Le user free n'a aucune
 * friction d'inscription (juste email/téléphone), accepte les permissions, sa
 * data alimente la heatmap collective. J+7-14 il essaie le Pro.
 *
 * Source de vérité décision Chandler : PRICING_FEATURES_MASTER.md §1.1
 *
 * Design System §13 : variant pulse (Ajnaya réfléchit) — fond noir Apple +
 * halos violet+cyan + brièveté radicale §1.2 (≤ 5 mots/phrase).
 */

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
)

function FreeSignupContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const referralCode = searchParams.get('ref') ?? ''

  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [method, setMethod] = useState<'email' | 'phone'>('email')
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')

    try {
      if (method === 'email') {
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          throw new Error('Email invalide')
        }
        const { error } = await supabase.auth.signInWithOtp({
          email: email.trim().toLowerCase(),
          options: {
            // emailRedirectTo : le user clique le lien magic dans son email →
            // il atterrit ici → redirect vers /success?tier=free
            emailRedirectTo: `${process.env.NEXT_PUBLIC_WEBAPP_URL ?? 'https://foreas.xyz'}/success?tier=free`,
            data: {
              tier: 'free',
              referred_by: referralCode || null,
              source: 'free_signup_web',
            },
          },
        })
        if (error) throw error
      } else {
        // Phone OTP
        const cleaned = phone.replace(/\s|\./g, '')
        if (!cleaned || cleaned.length < 8) {
          throw new Error('Téléphone invalide')
        }
        const e164 = cleaned.startsWith('+')
          ? cleaned
          : cleaned.startsWith('0')
            ? `+33${cleaned.substring(1)}`
            : `+${cleaned}`
        const { error } = await supabase.auth.signInWithOtp({
          phone: e164,
          options: {
            data: {
              tier: 'free',
              referred_by: referralCode || null,
              source: 'free_signup_web_phone',
            },
          },
        })
        if (error) throw error
      }

      setStatus('sent')
      // Tracking Meta CAPI
      try {
        const fbq = (window as unknown as { fbq?: (...args: unknown[]) => void }).fbq
        fbq?.('trackCustom', 'FreeSignupStarted', { method, referral: referralCode })
      } catch { /* ignore */ }
    } catch (err) {
      setErrorMsg((err as Error).message ?? 'Erreur — réessayez')
      setStatus('error')
    }
  }

  return (
    <div
      className="min-h-screen relative overflow-hidden flex items-center justify-center p-6"
      style={{ backgroundColor: '#000' }}
    >
      {/* ─── Halos couche 2 — variant pulse §13 ──────────────────────────── */}
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
      {/* Micro-grain anti-banding §17 */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{ backgroundColor: 'rgba(255, 255, 255, 0.012)' }}
      />

      <div className="relative max-w-md w-full">
        {/* Eyebrow */}
        <p
          className="text-[10px] font-extrabold uppercase mb-4 tabular-nums"
          style={{ color: '#00D4FF', letterSpacing: '0.25em' }}
        >
          FOREAS · GRATUIT
        </p>

        {/* H1 brièveté radicale §1.2 */}
        <h1
          className="text-4xl sm:text-5xl font-black leading-[0.92] mb-3"
          style={{ color: '#F8FAFC', letterSpacing: '-0.04em' }}
        >
          La heatmap.
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
            Sans CB.
          </span>
        </h1>

        <p
          className="text-base mb-8"
          style={{ color: 'rgba(248, 250, 252, 0.78)' }}
        >
          3 zones. Chat communauté. Ajnaya 3×/jour.
        </p>

        {status === 'sent' ? (
          <div
            className="rounded-2xl border p-5"
            style={{
              backgroundColor: 'rgba(16, 185, 129, 0.08)',
              borderColor: 'rgba(16, 185, 129, 0.25)',
            }}
          >
            <p className="text-[15px] font-bold mb-1" style={{ color: '#10B981' }}>
              ✓ {method === 'email' ? 'Email envoyé' : 'SMS envoyé'}
            </p>
            <p className="text-[13px]" style={{ color: 'rgba(248, 250, 252, 0.78)' }}>
              {method === 'email'
                ? 'Cliquez le lien reçu pour activer.'
                : 'Code reçu par SMS dans 10s max.'}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Toggle email/phone */}
            <div
              className="inline-flex p-1 rounded-full mb-3"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              {(['email', 'phone'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMethod(m)}
                  className="px-4 py-1.5 rounded-full text-[12px] font-bold transition-all"
                  style={{
                    backgroundColor: method === m ? '#F8FAFC' : 'transparent',
                    color: method === m ? '#000' : 'rgba(248, 250, 252, 0.52)',
                  }}
                >
                  {m === 'email' ? 'Email' : 'Téléphone'}
                </button>
              ))}
            </div>

            {method === 'email' ? (
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
            ) : (
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="06 12 34 56 78"
                autoComplete="tel"
                inputMode="tel"
                enterKeyHint="send"
                required
                disabled={status === 'loading'}
                className="w-full px-4 py-3.5 rounded-2xl text-[15px] font-medium outline-none transition-all tabular-nums"
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
            )}

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
              {status === 'loading' ? 'Envoi…' : 'Activer mon Free'}
            </button>

            {errorMsg && (
              <p className="text-xs" style={{ color: '#EF4444' }} role="alert">
                {errorMsg}
              </p>
            )}
          </form>
        )}

        <button
          type="button"
          onClick={() => router.push('/subscribe')}
          className="block mx-auto mt-6 text-[12px]"
          style={{ color: 'rgba(248, 250, 252, 0.52)' }}
        >
          Voir Pro & Elite →
        </button>

        {referralCode && (
          <p
            className="text-center mt-4 text-[10px]"
            style={{ color: 'rgba(248, 250, 252, 0.32)' }}
          >
            · Invité par {referralCode} ·
          </p>
        )}
      </div>
    </div>
  )
}

export default function FreeSignupPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#000' }}>
          <div
            aria-hidden
            className="w-8 h-8 rounded-full"
            style={{
              background: 'linear-gradient(135deg, #8C52FF, #00D4FF)',
              animation: 'halo-pulse-fast 0.9s ease-in-out infinite alternate',
            }}
          />
        </div>
      }
    >
      <FreeSignupContent />
    </Suspense>
  )
}
