'use client'

/**
 * /checkout — checkout sur-mesure FOREAS (Stripe Payment Element, 100% habillé maison).
 * Stratégie : paiement IMMÉDIAT + garantie 30j (brief réactivation). Rassurance MAX.
 * Design : design-system Dark Sovereign (#050508, violet/cyan, glass, 1 héros, quiet-tech).
 * Copy : copy-atomic (tutoiement Koraly, risk-reversal, WIIFM, zéro chiffre inventé).
 * Le checkout Stripe hébergé/embarqué existant reste en place — ceci est la version premium.
 */

import { useState, useEffect, useMemo, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { loadStripe, type Appearance } from '@stripe/stripe-js'
import { Elements, PaymentElement, LinkAuthenticationElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { ShieldCheck, Check, Lock, Loader2, ArrowRight } from 'lucide-react'
import CheckoutProofToasts from '@/components/checkout/CheckoutProofToasts'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '')

const C = {
  bg: '#050508', hero: '#F8FAFC', text: 'rgba(248,250,252,0.80)', muted: 'rgba(248,250,252,0.52)',
  violet: '#8C52FF', cyan: '#00D4FF', green: '#10B981',
  glass: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.09)',
}

const PLAN_LABEL: Record<string, { name: string; price: number; perDay: string }> = {
  pro_monthly:   { name: 'Pro', price: 97,  perDay: '3,23€/jour — le prix d’un péage' },
  pro_annual:    { name: 'Pro (annuel)', price: 970, perDay: '2 mois offerts' },
  elite_monthly: { name: 'Elite', price: 247, perDay: 'courses FOREAS prioritaires' },
  elite_annual:  { name: 'Elite (annuel)', price: 2470, perDay: '2 mois offerts' },
}

// Appearance API → Stripe Payment Element aux couleurs FOREAS (sinon = thème Stripe par défaut).
const APPEARANCE: Appearance = {
  theme: 'night',
  variables: {
    colorPrimary: C.violet,
    colorBackground: '#0B0B12',
    colorText: C.hero,
    colorTextSecondary: C.muted,
    colorDanger: '#F87171',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    borderRadius: '12px',
    spacingUnit: '4px',
  },
  rules: {
    '.Input': { backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)', boxShadow: 'none' },
    '.Input:focus': { border: '1px solid rgba(0,212,255,0.55)', boxShadow: '0 0 0 3px rgba(0,212,255,0.12)' },
    '.Label': { color: C.muted, fontWeight: '500' },
    '.Tab': { backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)' },
    '.Tab--selected': { borderColor: C.violet },
  },
}

// ─── Formulaire interne (a accès à stripe + elements) ─────────────────────────
function PaymentForm({ planKey }: { planKey: string }) {
  const stripe = useStripe()
  const elements = useElements()
  const [submitting, setSubmitting] = useState(false)
  const [err, setErr] = useState('')
  const plan = PLAN_LABEL[planKey] ?? PLAN_LABEL.pro_monthly

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements || submitting) return
    setErr(''); setSubmitting(true)
    try { window.fbq?.('trackCustom', 'CustomCheckoutPay', { plan: planKey }) } catch { /* noop */ }
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: `${window.location.origin}/checkout/merci` },
    })
    // Si on arrive ici, c'est qu'il y a eu une erreur (sinon Stripe a redirigé).
    setErr(error?.message || "Le paiement n'a pas pu aboutir. Vérifie ta carte et réessaie.")
    setSubmitting(false)
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <LinkAuthenticationElement />
      <PaymentElement options={{ layout: 'tabs' }} />

      <button
        type="submit"
        disabled={!stripe || submitting}
        className="mt-2 inline-flex items-center justify-center gap-2 w-full px-6 py-4 rounded-2xl font-extrabold text-[16px] text-white transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60"
        style={{ background: `linear-gradient(135deg, ${C.violet} 0%, #6C3CE0 100%)`, boxShadow: '0 10px 34px -8px rgba(140,82,255,0.5)' }}
      >
        {submitting ? <Loader2 size={18} className="animate-spin" /> : <Lock size={16} />}
        {submitting ? 'Paiement…' : `Payer ${plan.price}€ — démarrer maintenant`}
        {!submitting && <ArrowRight size={18} />}
      </button>

      {err && <p className="text-[13px] text-center" style={{ color: '#F87171' }}>{err}</p>}

      <div className="flex items-center justify-center gap-4 text-[11px] pt-1" style={{ color: C.muted }}>
        <span className="inline-flex items-center gap-1"><Lock size={12} /> Sécurisé par Stripe</span>
        <span>·</span>
        <span>Annulation en 1 clic</span>
      </div>
    </form>
  )
}

// ─── Page (fetch du clientSecret + layout + résumé) ───────────────────────────
function CheckoutInner() {
  const params = useSearchParams()
  const planKey = params.get('plan') || 'pro_monthly'
  const ref = params.get('ref')
  const plan = PLAN_LABEL[planKey] ?? PLAN_LABEL.pro_monthly

  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [loadErr, setLoadErr] = useState('')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/subscription/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ plan: planKey, ...(ref ? { referral_code: ref } : {}) }),
        })
        const data = await res.json()
        if (cancelled) return
        if (data.clientSecret) setClientSecret(data.clientSecret)
        else setLoadErr(data.error || 'Initialisation du paiement impossible.')
      } catch {
        if (!cancelled) setLoadErr('Erreur réseau. Recharge la page.')
      }
    })()
    return () => { cancelled = true }
  }, [planKey, ref])

  const options = useMemo(() => (clientSecret ? { clientSecret, appearance: APPEARANCE } : undefined), [clientSecret])

  return (
    <main style={{ background: C.bg, color: C.text }} className="min-h-screen w-full">
      <div aria-hidden className="pointer-events-none fixed inset-0" style={{ background: 'radial-gradient(60% 40% at 50% 0%, rgba(140,82,255,0.14), transparent 70%)' }} />

      <div className="relative z-10 mx-auto w-full max-w-4xl px-5 py-10 sm:py-14">
        {/* Logo minimal */}
        <div className="mb-8 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg text-white font-extrabold" style={{ background: `linear-gradient(135deg, ${C.violet}, ${C.cyan})` }}>F</div>
          <span className="text-[14px] font-bold tracking-tight" style={{ color: C.hero }}>FOREAS</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-8">
          {/* ── Colonne paiement ── */}
          <section>
            <h1 className="text-[26px] sm:text-[30px] font-extrabold tracking-tight" style={{ color: C.hero }}>
              Plus qu&apos;une étape.
            </h1>
            <p className="mt-2 text-[15px]" style={{ color: C.text }}>
              Paiement aujourd&apos;hui, et tu es couvert : <strong style={{ color: C.green }}>30 jours satisfait ou remboursé</strong>, sans discuter.
            </p>

            <div className="mt-6 rounded-2xl p-5 sm:p-6" style={{ background: C.glass, border: `1px solid ${C.border}` }}>
              {options ? (
                <Elements stripe={stripePromise} options={options}>
                  <PaymentForm planKey={planKey} />
                </Elements>
              ) : loadErr ? (
                <div className="py-10 text-center">
                  <p className="text-[14px]" style={{ color: '#F87171' }}>{loadErr}</p>
                  <button onClick={() => window.location.reload()} className="mt-3 text-[13px] underline" style={{ color: C.cyan }}>Recharger</button>
                </div>
              ) : (
                <div className="py-14 flex items-center justify-center">
                  <Loader2 className="animate-spin" style={{ color: C.violet }} size={26} />
                </div>
              )}
            </div>
          </section>

          {/* ── Colonne résumé (rassurance) ── */}
          <aside className="lg:pt-12">
            <div className="rounded-2xl p-6" style={{ background: C.glass, border: `1px solid ${C.border}` }}>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: C.violet }}>Ton abonnement</p>
              <div className="mt-2 flex items-end gap-2">
                <span className="text-[32px] font-extrabold tabular-nums leading-none" style={{ color: C.hero }}>{plan.price}€</span>
                <span className="text-[14px] mb-0.5" style={{ color: C.muted }}>/mois · FOREAS {plan.name}</span>
              </div>
              <p className="mt-1 text-[12px]" style={{ color: C.cyan }}>soit {plan.perDay}</p>

              <div className="my-5 h-px" style={{ background: C.border }} />

              <ul className="space-y-2.5">
                {['Ajnaya IA illimitée + voix Koraly', 'Où ça paie, en temps réel', 'Coach courses : accepter/refuser en 0,3s', 'Compta IA + Tirelire URSSAF'].map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-[13px]" style={{ color: C.text }}>
                    <Check size={16} style={{ color: C.green }} className="mt-0.5 shrink-0" />{f}
                  </li>
                ))}
              </ul>

              <div className="mt-5 flex items-center gap-2 rounded-xl px-3 py-2.5" style={{ background: 'rgba(16,185,129,0.10)', border: '1px solid rgba(16,185,129,0.28)' }}>
                <ShieldCheck size={16} style={{ color: C.green }} className="shrink-0" />
                <span className="text-[12px] font-semibold" style={{ color: C.green }}>Garanti 30 jours — remboursé, sans question</span>
              </div>

              <p className="mt-4 text-[11px] leading-relaxed" style={{ color: C.muted }}>
                Une seule course récupérée dans la semaine, et c&apos;est remboursé. Tu testes en vrai, tu risques zéro.
              </p>
            </div>
          </aside>
        </div>
      </div>

      {/* Bulles "vient de s'abonner" — rassurance max */}
      <CheckoutProofToasts />
    </main>
  )
}

export default function CheckoutClient() {
  return (
    <Suspense fallback={<div style={{ background: C.bg, minHeight: '100vh' }} />}>
      <CheckoutInner />
    </Suspense>
  )
}
