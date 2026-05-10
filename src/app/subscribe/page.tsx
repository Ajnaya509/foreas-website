'use client'

/**
 * /subscribe — Page de souscription FOREAS (3 tiers : Free / Pro / Elite)
 *
 * Source de vérité prix : `lib/pricing.ts` (zéro hardcode ici)
 * Architecture verrouillée 10/05/2026 par Chandler — voir PRICING_FEATURES_MASTER.md
 *
 * Flow :
 *  1. Detection iOS (User-Agent) → IOSWaitlistView (Apple guideline 3.1.1)
 *  2. Sinon : 3 plans en grille avec toggle weekly/annual
 *     - Free → /free-signup (pas de Stripe checkout)
 *     - Pro / Elite → POST /api/create-checkout-session avec priceId
 *  3. Codes promo input (WELCOME20 / MLM25 / BETA60)
 *
 * Design System §13 : variant pulse (Ajnaya réfléchit) — fond noir Apple absolu
 * + halos violet+cyan diffus + 1 tier = 1 candidat L1 (le Pro popular).
 */

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import IOSWaitlistView from '@/components/IOSWaitlistView'
import {
  PLANS,
  PROMO_CODES,
  type Tier,
  type Billing,
  formatEuro,
  annualSavingsEur,
} from '@/lib/pricing'

// ─── User-Agent detection (côté client) ───────────────────────────────────────
function isIOSUserAgent(ua: string): boolean {
  return /iPhone|iPad|iPod/i.test(ua) && !/CriOS|FxiOS|EdgiOS/i.test(ua)
  // Note: on exclut Chrome/Firefox/Edge iOS qui sont WebKit déguisés. Apple
  // guideline 3.1.1 s'applique pareil mais ces browsers ne sont pas notre app
  // et un Stripe Checkout en web normal y est légal — on laisse passer.
}

function SubscribePageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const referralCode = searchParams.get('ref') ?? ''
  const userId = searchParams.get('uid') ?? ''
  const fromApp = searchParams.get('from') === 'app'

  // ─── Detection iOS au mount (skip si ?platform=android forcé) ──────────────
  const [isIOS, setIsIOS] = useState<boolean | null>(null)
  useEffect(() => {
    if (typeof navigator === 'undefined') {
      setIsIOS(false)
      return
    }
    const force = searchParams.get('platform')
    if (force === 'android') {
      setIsIOS(false)
      return
    }
    setIsIOS(isIOSUserAgent(navigator.userAgent))
  }, [searchParams])

  // ─── State checkout ────────────────────────────────────────────────────────
  const [billing, setBilling] = useState<Billing>('weekly')
  const [promo, setPromo] = useState('')
  const [loadingTier, setLoadingTier] = useState<Tier | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (isIOS === null) {
    // Skeleton bref pendant la detection UA (≤ 1 frame en pratique)
    return (
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
    )
  }

  if (isIOS) {
    return <IOSWaitlistView />
  }

  // ─── Action : Free → redirige vers /free-signup ──────────────────────────
  const handleFree = () => {
    const params = new URLSearchParams()
    if (referralCode) params.set('ref', referralCode)
    if (userId) params.set('uid', userId)
    router.push(`/free-signup${params.toString() ? `?${params}` : ''}`)
  }

  // ─── Action : Pro / Elite → checkout session ─────────────────────────────
  const handleCheckout = async (tier: Exclude<Tier, 'free'>) => {
    setLoadingTier(tier)
    setError(null)
    try {
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier,
          billing,
          userId: userId || 'guest',
          referralCode,
          promoCode: promo || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erreur création checkout')
      if (!data.url) throw new Error("Pas d'URL Stripe retournée")
      window.location.href = data.url
    } catch (err) {
      setError((err as Error).message)
      setLoadingTier(null)
    }
  }

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{ backgroundColor: '#000' }}
    >
      {/* ─── Halos couche 2 — variant pulse §13 ──────────────────────────── */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 50% 40% at 25% 15%, rgba(140, 82, 255, 0.22) 0%, transparent 70%),' +
            'radial-gradient(ellipse 45% 35% at 80% 80%, rgba(0, 212, 255, 0.14) 0%, transparent 70%),' +
            'radial-gradient(ellipse 55% 45% at 50% 100%, rgba(140, 82, 255, 0.08) 0%, transparent 70%)',
          filter: 'blur(80px)',
        }}
      />
      {/* Micro-grain anti-banding §17 */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{ backgroundColor: 'rgba(255, 255, 255, 0.012)' }}
      />

      <main className="relative max-w-5xl mx-auto px-5 sm:px-8 pt-16 pb-24">
        {/* Eyebrow */}
        <p
          className="text-[10px] font-extrabold uppercase text-center mb-5 tabular-nums"
          style={{ color: '#00D4FF', letterSpacing: '0.25em' }}
        >
          FOREAS · ABONNEMENT
        </p>

        {/* H1 brièveté radicale §1.2 */}
        <h1
          className="text-5xl sm:text-6xl font-black text-center leading-[0.92] mb-4"
          style={{ color: '#F8FAFC', letterSpacing: '-0.04em' }}
        >
          Choisissez votre tier.
        </h1>

        <p
          className="text-base text-center mb-10 max-w-xl mx-auto"
          style={{ color: 'rgba(248, 250, 252, 0.78)' }}
        >
          Annulation 1 clic. 0€ aujourd'hui.
        </p>

        {/* ─── Toggle Hebdo / Annuel ─────────────────────────────────────── */}
        <div className="flex justify-center mb-10">
          <div
            className="inline-flex p-1 rounded-full"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            {(['weekly', 'annual'] as const).map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => setBilling(b)}
                className="px-5 py-2 rounded-full text-[13px] font-bold transition-all"
                style={{
                  backgroundColor: billing === b ? '#F8FAFC' : 'transparent',
                  color: billing === b ? '#000' : 'rgba(248, 250, 252, 0.52)',
                }}
              >
                {b === 'weekly' ? 'Hebdomadaire' : 'Annuel −20%'}
              </button>
            ))}
          </div>
        </div>

        {/* ─── 3 plans en grille ────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
          {(['free', 'pro', 'elite'] as const).map((tier) => {
            const plan = PLANS[tier]
            const price = billing === 'weekly' ? plan.weeklyPrice : plan.annualPrice
            const isLoading = loadingTier === tier
            const isPopular = plan.popular === true

            return (
              <div
                key={tier}
                className="relative rounded-3xl p-6 flex flex-col"
                style={{
                  backgroundColor: isPopular
                    ? 'rgba(140, 82, 255, 0.06)'
                    : 'rgba(255, 255, 255, 0.04)',
                  border: `1px solid ${
                    isPopular
                      ? 'rgba(140, 82, 255, 0.30)'
                      : 'rgba(255, 255, 255, 0.06)'
                  }`,
                  boxShadow: isPopular
                    ? '0 0 40px rgba(140, 82, 255, 0.18), 0 0 80px rgba(0, 212, 255, 0.06)'
                    : 'none',
                }}
              >
                {/* Popular badge */}
                {isPopular && (
                  <div
                    className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tabular-nums"
                    style={{
                      background:
                        'linear-gradient(135deg, #8C52FF 0%, #6C3CE0 100%)',
                      color: '#F8FAFC',
                      letterSpacing: '0.18em',
                    }}
                  >
                    Populaire
                  </div>
                )}

                {/* Tier dot badge §11 */}
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{
                      backgroundColor: plan.badgeColor,
                      boxShadow:
                        plan.badgeStyle === 'pulse_radial'
                          ? `0 0 12px ${plan.badgeColor}, 0 0 24px ${plan.badgeColor}`
                          : plan.badgeStyle === 'halo'
                          ? `0 0 8px ${plan.badgeColor}`
                          : 'none',
                    }}
                  />
                  <h2
                    className="text-2xl font-black"
                    style={{ color: '#F8FAFC', letterSpacing: '-0.02em' }}
                  >
                    {plan.name}
                  </h2>
                </div>
                <p
                  className="text-[12px] mb-5"
                  style={{ color: 'rgba(248, 250, 252, 0.52)' }}
                >
                  {plan.tagline}
                </p>

                {/* Prix */}
                <div className="mb-1 flex items-baseline gap-1">
                  <span
                    className="text-4xl font-black tabular-nums"
                    style={{ color: '#F8FAFC', letterSpacing: '-0.04em' }}
                  >
                    {tier === 'free' ? 'Gratuit' : formatEuro(price)}
                  </span>
                  {tier !== 'free' && (
                    <span
                      className="text-sm font-medium"
                      style={{ color: 'rgba(248, 250, 252, 0.52)' }}
                    >
                      {billing === 'weekly' ? '€/sem' : '€/an'}
                    </span>
                  )}
                </div>
                {tier !== 'free' && billing === 'annual' && (
                  <p
                    className="text-[11px] mb-5 tabular-nums"
                    style={{ color: '#10B981' }}
                  >
                    −{formatEuro(annualSavingsEur(plan.weeklyPrice))} € vs hebdo
                  </p>
                )}
                {tier === 'free' && (
                  <p
                    className="text-[11px] mb-5"
                    style={{ color: 'rgba(248, 250, 252, 0.32)' }}
                  >
                    Sans CB · Sans engagement
                  </p>
                )}

                {/* Features */}
                <ul className="space-y-2 mb-6 flex-1">
                  {plan.features.map((f, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-[13px]"
                      style={{
                        color: f.included
                          ? 'rgba(248, 250, 252, 0.78)'
                          : 'rgba(248, 250, 252, 0.32)',
                      }}
                    >
                      <span
                        className="text-[14px] flex-shrink-0 leading-[1]"
                        style={{ color: f.included ? '#10B981' : '#6B7280' }}
                      >
                        {f.included ? '✓' : '✕'}
                      </span>
                      <span style={{ textDecoration: f.included ? 'none' : 'line-through' }}>
                        {f.label}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <button
                  type="button"
                  onClick={() => (tier === 'free' ? handleFree() : handleCheckout(tier))}
                  disabled={isLoading}
                  className="w-full py-3 rounded-2xl text-[14px] font-extrabold transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60"
                  style={{
                    background:
                      tier === 'free'
                        ? 'rgba(255, 255, 255, 0.06)'
                        : tier === 'elite'
                        ? 'linear-gradient(135deg, #FFD700 0%, #F5C842 100%)'
                        : 'linear-gradient(135deg, #8C52FF 0%, #6C3CE0 100%)',
                    color: tier === 'elite' ? '#1d1d1f' : '#F8FAFC',
                    border:
                      tier === 'free'
                        ? '1px solid rgba(255, 255, 255, 0.12)'
                        : 'none',
                    boxShadow:
                      tier === 'pro'
                        ? '0 8px 24px -8px rgba(140, 82, 255, 0.55)'
                        : tier === 'elite'
                        ? '0 8px 24px -8px rgba(255, 215, 0, 0.45)'
                        : 'none',
                  }}
                >
                  {isLoading
                    ? 'Redirection…'
                    : tier === 'free'
                    ? 'Commencer gratuit'
                    : tier === 'elite'
                    ? 'Passer Elite'
                    : 'Choisir Pro'}
                </button>
              </div>
            )
          })}
        </div>

        {error && (
          <p
            className="text-center mt-6 text-[13px]"
            style={{ color: '#EF4444' }}
            role="alert"
          >
            {error}
          </p>
        )}

        {/* ─── Codes promo (collapse simple) ────────────────────────────── */}
        <div className="mt-10 max-w-md mx-auto">
          <details>
            <summary
              className="text-[12px] font-medium cursor-pointer text-center"
              style={{ color: 'rgba(248, 250, 252, 0.52)' }}
            >
              J'ai un code promo
            </summary>
            <div className="mt-3 flex gap-2">
              <input
                type="text"
                value={promo}
                onChange={(e) => setPromo(e.target.value.toUpperCase())}
                placeholder="WELCOME20"
                autoCapitalize="characters"
                className="flex-1 px-3 py-2 rounded-xl text-[13px] font-mono uppercase tabular-nums"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  color: '#F8FAFC',
                  outline: 'none',
                }}
              />
            </div>
            <p
              className="mt-2 text-[10px]"
              style={{ color: 'rgba(248, 250, 252, 0.32)' }}
            >
              Codes valides : {PROMO_CODES.map((p) => p.code).join(' · ')}
            </p>
          </details>
        </div>

        {/* Trust micros §1.2 brièveté radicale */}
        <p
          className="text-center mt-10 text-[10px] tabular-nums"
          style={{ color: 'rgba(248, 250, 252, 0.32)', letterSpacing: '0.04em' }}
        >
          🔒 Stripe · Annulation 1 clic · Sans engagement
        </p>

        {fromApp && (
          <p
            className="text-center mt-3 text-[10px]"
            style={{ color: 'rgba(248, 250, 252, 0.32)' }}
          >
            Depuis l'app FOREAS Driver
          </p>
        )}
      </main>
    </div>
  )
}

export default function SubscribePage() {
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
      <SubscribePageContent />
    </Suspense>
  )
}
