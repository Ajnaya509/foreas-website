'use client'

/**
 * /checkout — checkout sur-mesure FOREAS (Stripe Payment Element, 100% habillé maison).
 * Langage visuel ALIGNÉ sur le site (tarifs2) : logo wordmark Genos (font-title),
 * titres Inter extrabold + letter-spacing négatif (Apple-grade), halo + micro-grain,
 * glass empilable, InkGradientButton signature, hiérarchie eyebrow→display→body, tabular-nums.
 * Mobile-first (1 colonne) → desktop (2 colonnes). Paiement immédiat + garantie 30j.
 */

import { useState, useEffect, useMemo, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { loadStripe, type Appearance } from '@stripe/stripe-js'
import { Elements, PaymentElement, LinkAuthenticationElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { ShieldCheck, Check, Lock, Loader2 } from 'lucide-react'
import { InkGradientButton } from '@/components/ui'
import CheckoutProofToasts from '@/components/checkout/CheckoutProofToasts'
import ExitIntentOffer from '@/components/checkout/ExitIntentOffer'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '')

const PLANS: Record<string, { name: string; price: number; perDay: string }> = {
  pro_monthly:   { name: 'Pro', price: 97,  perDay: '3,23 €/jour — le prix d’un péage' },
  pro_annual:    { name: 'Pro · annuel', price: 970, perDay: '2 mois offerts' },
  elite_monthly: { name: 'Elite', price: 247, perDay: 'courses FOREAS prioritaires' },
  elite_annual:  { name: 'Elite · annuel', price: 2470, perDay: '2 mois offerts' },
}

// Appearance API → Payment Element aux couleurs FOREAS (fond obsidian, accent violet/cyan).
const APPEARANCE: Appearance = {
  theme: 'night',
  variables: {
    colorPrimary: '#8C52FF',
    colorBackground: '#0B0E1A',
    colorText: '#F8FAFC',
    colorTextSecondary: 'rgba(248,250,252,0.55)',
    colorTextPlaceholder: 'rgba(248,250,252,0.32)',
    colorDanger: '#F87171',
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    fontSizeBase: '15px',
    borderRadius: '14px',
    spacingUnit: '4px',
  },
  rules: {
    '.Input': { backgroundColor: 'rgba(255,255,255,0.035)', border: '1px solid rgba(255,255,255,0.10)', boxShadow: 'none', padding: '12px 14px' },
    '.Input:focus': { border: '1px solid rgba(0,212,255,0.55)', boxShadow: '0 0 0 3px rgba(0,212,255,0.12)' },
    '.Input::placeholder': { color: 'rgba(248,250,252,0.32)' },
    '.Label': { color: 'rgba(248,250,252,0.55)', fontWeight: '500', fontSize: '12px', marginBottom: '6px' },
    '.Tab': { backgroundColor: 'rgba(255,255,255,0.035)', border: '1px solid rgba(255,255,255,0.10)' },
    '.Tab:hover': { borderColor: 'rgba(255,255,255,0.20)' },
    '.Tab--selected': { borderColor: '#8C52FF', boxShadow: '0 0 0 1px #8C52FF' },
  },
}

// ─── Formulaire (accès stripe + elements) ─────────────────────────────────────
function PaymentForm({ planKey }: { planKey: string }) {
  const stripe = useStripe()
  const elements = useElements()
  const [submitting, setSubmitting] = useState(false)
  const [err, setErr] = useState('')
  const plan = PLANS[planKey] ?? PLANS.pro_monthly

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements || submitting) return
    setErr(''); setSubmitting(true)
    try { window.fbq?.('trackCustom', 'CustomCheckoutPay', { plan: planKey }) } catch { /* noop */ }
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: `${window.location.origin}/checkout/merci` },
    })
    setErr(error?.message || "Le paiement n'a pas pu aboutir. Vérifie ta carte et réessaie.")
    setSubmitting(false)
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <LinkAuthenticationElement />
      <PaymentElement options={{ layout: 'tabs' }} />

      <InkGradientButton as="button" type="submit" variant="violet" size="lg" disabled={!stripe || submitting} className="w-full">
        <span className="inline-flex items-center justify-center gap-2">
          {submitting ? <Loader2 size={18} className="animate-spin" /> : <Lock size={16} />}
          {submitting ? 'Paiement en cours…' : `Payer ${plan.price} € · démarrer maintenant`}
        </span>
      </InkGradientButton>

      {err && <p className="text-center text-[13px]" style={{ color: '#F87171' }}>{err}</p>}

      <div className="flex items-center justify-center gap-3 text-[11px] text-white/45">
        <span className="inline-flex items-center gap-1.5"><Lock size={11} className="text-[#10B981]" /> Sécurisé par Stripe</span>
        <span className="text-white/20">·</span>
        <span>Annulation 1 clic</span>
        <span className="text-white/20">·</span>
        <span>SSL chiffré</span>
      </div>
    </form>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
function CheckoutInner() {
  const params = useSearchParams()
  const planKey = params.get('plan') || 'pro_monthly'
  const ref = params.get('ref')
  const plan = PLANS[planKey] ?? PLANS.pro_monthly

  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [loadErr, setLoadErr] = useState('')
  const [exitOffer, setExitOffer] = useState(false)

  useEffect(() => {
    let cancelled = false
    setClientSecret(null) // re-affiche le skeleton si on re-crée l'abo (offre de sortie acceptée)
    ;(async () => {
      try {
        const res = await fetch('/api/subscription/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ plan: planKey, ...(ref ? { referral_code: ref } : {}), ...(exitOffer ? { exit_offer: true } : {}) }),
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
  }, [planKey, ref, exitOffer])

  const options = useMemo(() => (clientSecret ? { clientSecret, appearance: APPEARANCE } : undefined), [clientSecret])

  return (
    <div className="relative min-h-screen bg-foreas-obsidian text-[#F8FAFC] overflow-x-hidden">
      {/* Halo signature + micro-grain (nano-detail anti-banding) — comme tarifs2 */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute inset-0 animate-halo-pulse"
          style={{
            background:
              'radial-gradient(ellipse 55% 45% at 22% 12%, rgba(140,82,255,0.20) 0%, transparent 70%),' +
              'radial-gradient(ellipse 45% 40% at 82% 18%, rgba(0,212,255,0.12) 0%, transparent 70%),' +
              'radial-gradient(ellipse 65% 55% at 55% 95%, rgba(140,82,255,0.07) 0%, transparent 75%)',
          }}
        />
        <div className="absolute inset-0" style={{ backgroundColor: 'rgba(255,255,255,0.012)' }} />
      </div>

      {/* Barre de marque minimale (focus checkout : pas de nav) — wordmark Genos */}
      <header className="relative z-10 mx-auto max-w-5xl px-5 sm:px-8 pt-7 flex items-center justify-between">
        <Link href="/" aria-label="FOREAS — Accueil" className="font-title text-2xl font-semibold tracking-wider text-[#F8FAFC]">
          FOREAS
        </Link>
        <span className="inline-flex items-center gap-1.5 text-[11px] text-white/45">
          <Lock size={11} className="text-[#10B981]" /> Paiement sécurisé
        </span>
      </header>

      <main className="relative z-10 mx-auto max-w-5xl px-5 sm:px-8 py-9 sm:py-12">
        {/* En-tête éditorial — hiérarchie eyebrow → display → sub */}
        <div className="max-w-2xl">
          <p className="text-[#00D4FF] text-[10px] font-extrabold uppercase mb-4" style={{ letterSpacing: '0.25em' }}>
            FOREAS · Finalise ton abonnement
          </p>
          <h1 className="text-3xl sm:text-[42px] font-extrabold leading-[1.04] text-[#F8FAFC]" style={{ letterSpacing: '-0.035em' }}>
            Plus qu&apos;une étape.
          </h1>
          <p className="mt-3 text-white/70 text-[15px] sm:text-base leading-relaxed">
            Paiement aujourd&apos;hui — et tu es couvert&nbsp;: <span className="text-[#10B981] font-semibold">30 jours satisfait ou remboursé</span>, sans discuter.
          </p>
        </div>

        {/* Grille mobile-first (1 col) → desktop (2 cols) */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-6 lg:gap-8 items-start">
          {/* ── Paiement ── */}
          <section
            className="rounded-3xl p-5 sm:p-7 backdrop-blur-sm"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', boxShadow: '0 24px 60px -28px rgba(0,0,0,0.7)' }}
          >
            {options ? (
              <Elements key={clientSecret} stripe={stripePromise} options={options}>
                <PaymentForm planKey={planKey} />
              </Elements>
            ) : loadErr ? (
              <div className="py-12 text-center">
                <p className="text-[14px]" style={{ color: '#F87171' }}>{loadErr}</p>
                <button onClick={() => window.location.reload()} className="mt-3 text-[13px] underline text-[#00D4FF]">Recharger</button>
              </div>
            ) : (
              // Skeleton premium (pas de spinner sec — design-system #8)
              <div className="space-y-4 animate-pulse">
                <div className="h-11 rounded-xl bg-white/[0.05]" />
                <div className="h-11 rounded-xl bg-white/[0.05]" />
                <div className="grid grid-cols-2 gap-3"><div className="h-11 rounded-xl bg-white/[0.05]" /><div className="h-11 rounded-xl bg-white/[0.05]" /></div>
                <div className="h-14 rounded-2xl bg-white/[0.06]" />
                <div className="flex justify-center"><Loader2 className="animate-spin text-[#8C52FF] mt-1" size={20} /></div>
              </div>
            )}
          </section>

          {/* ── Résumé (rassurance) ── */}
          <aside
            className="rounded-3xl p-6 backdrop-blur-sm relative overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            {/* liseré accent haut (composant graphique gradient) */}
            <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(140,82,255,0.6), rgba(0,212,255,0.6), transparent)' }} />

            <p className="text-[10px] font-extrabold uppercase text-white/40" style={{ letterSpacing: '0.2em' }}>Ton abonnement</p>
            <div className="mt-2.5 flex items-baseline gap-2">
              {exitOffer && <span className="text-[20px] font-bold tabular-nums text-white/35 line-through">{plan.price}&nbsp;€</span>}
              <span className="text-[40px] font-extrabold tabular-nums leading-none text-[#F8FAFC]" style={{ letterSpacing: '-0.04em' }}>
                {exitOffer ? (plan.price * 0.8).toFixed(2).replace('.', ',') : plan.price}&nbsp;€
              </span>
              <span className="text-[13px] text-white/45">{exitOffer ? '1er mois' : '/mois'} · FOREAS {plan.name}</span>
            </div>
            <p className="mt-1.5 text-[12px] text-[#00D4FF]/90 tabular-nums">
              {exitOffer ? `−20% ce mois-ci · puis ${plan.price}€/mois` : `soit ${plan.perDay}`}
            </p>

            <div className="my-5 h-px bg-white/[0.07]" />

            <ul className="space-y-3">
              {[
                ['Ajnaya IA illimitée', '+ voix Koraly'],
                ['Où ça paie, en temps réel', 'la bonne course, au bon moment'],
                ['Coach courses', 'accepter / refuser en 0,3s'],
                ['Compta IA + Tirelire URSSAF', 'mise de côté automatique'],
              ].map(([t, sub]) => (
                <li key={t} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#8C52FF]/20 ring-1 ring-[#8C52FF]/30">
                    <Check size={12} className="text-[#A78BFF]" strokeWidth={3} />
                  </span>
                  <span className="text-[13.5px] leading-tight text-white/85 font-medium">
                    {t}<span className="block text-[11.5px] text-white/45 font-normal mt-0.5">{sub}</span>
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-6 flex items-center gap-2.5 rounded-2xl px-3.5 py-3" style={{ background: 'rgba(16,185,129,0.10)', border: '1px solid rgba(16,185,129,0.26)' }}>
              <ShieldCheck size={17} className="text-[#10B981] shrink-0" />
              <span className="text-[12.5px] font-semibold text-[#10B981] leading-tight">Garanti 30 jours — remboursé, sans question</span>
            </div>
            <p className="mt-3 text-[11.5px] leading-relaxed text-white/45">
              Une seule course récupérée dans la semaine, et c&apos;est remboursé. Tu testes en vrai, tu risques zéro.
            </p>
          </aside>
        </div>
      </main>

      {/* Bulles "vient de s'abonner" — preuve sociale, comme la home */}
      <CheckoutProofToasts />
      <ExitIntentOffer onAccept={() => setExitOffer(true)} />
    </div>
  )
}

export default function CheckoutClient() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-foreas-obsidian" />}>
      <CheckoutInner />
    </Suspense>
  )
}
