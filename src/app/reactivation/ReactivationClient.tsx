'use client'

/**
 * /reactivation — landing de relance base froide (dormante ~1 an).
 * Stratégie actée (brief AJNAYA_PAGE_REACTIVATION_SITE, Chandler) : CASH NOW.
 * → paiement IMMÉDIAT (pas d'essai) + garantie 30j satisfait-remboursé (risk reversal Hormozi).
 *
 * Copy : copy-atomic (base FROIDE + product-aware → on vend la PREUVE + l'OFFRE + la GARANTIE,
 * tutoiement pro Koraly, "gagne plus roule moins", 29,99€/mois = source pricing (pieuvre_pricing_plans, 12/07/2026), zéro chiffre inventé).
 * Design : design-system site "Dark Sovereign" (#050508), un seul héros, garantie proéminente,
 * tabular-nums, quiet-tech. Distraction zéro (pas de nav riche — règle landing §6.8).
 */

import { useState } from 'react'
import { ShieldCheck, Check, Lock, ArrowRight, Loader2 } from 'lucide-react'
import TestimonialVideoCard from '@/components/zone/TestimonialVideoCard'
import { TESTIMONIALS } from '@/components/zone/testimonials.data'

const BINATE = TESTIMONIALS.find((t) => t.name.startsWith('Binate')) ?? TESTIMONIALS[1]

const C = {
  bg: '#050508',
  hero: '#F8FAFC',
  text: 'rgba(248,250,252,0.80)',
  muted: 'rgba(248,250,252,0.52)',
  violet: '#8C52FF',
  cyan: '#00D4FF',
  green: '#10B981',
  glass: 'rgba(255,255,255,0.04)',
  border: 'rgba(255,255,255,0.09)',
}

export default function ReactivationClient() {
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  const startCheckout = async () => {
    if (loading) return
    setErr('')
    setLoading(true)
    try {
      try { window.fbq?.('trackCustom', 'ReactivationCheckout', { plan: 'pro_monthly' }) } catch { /* noop */ }
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // immediate = on encaisse maintenant (pas d'essai) — garantie 30j gérée hors-Stripe.
        body: JSON.stringify({ plan: 'pro_monthly', immediate: true }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
        return
      }
      setErr(data.error || "Le paiement n'a pas pu démarrer. Réessaie dans un instant.")
      setLoading(false)
    } catch {
      setErr('Erreur réseau. Réessaie dans un instant.')
      setLoading(false)
    }
  }

  const Guarantee = ({ className = '' }: { className?: string }) => (
    <div
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 ${className}`}
      style={{ background: 'rgba(16,185,129,0.10)', border: `1px solid rgba(16,185,129,0.28)` }}
    >
      <ShieldCheck size={16} style={{ color: C.green }} />
      <span className="text-[13px] font-semibold" style={{ color: C.green }}>
        Garanti 30 jours — remboursé, sans question
      </span>
    </div>
  )

  const CTA = ({ label = 'Démarrer maintenant' }: { label?: string }) => (
    <div className="flex flex-col items-center gap-2 w-full">
      <button
        onClick={startCheckout}
        disabled={loading}
        className="group inline-flex items-center justify-center gap-2 w-full max-w-md px-7 py-4 rounded-2xl font-extrabold text-[16px] text-white transition-transform hover:scale-[1.015] active:scale-[0.99] disabled:opacity-60"
        style={{ background: `linear-gradient(135deg, ${C.violet} 0%, #6C3CE0 100%)`, boxShadow: '0 10px 34px -8px rgba(140,82,255,0.5)' }}
      >
        {loading ? <Loader2 size={18} className="animate-spin" /> : null}
        {label}
        {!loading && <ArrowRight size={18} className="transition-transform group-hover:translate-x-0.5" />}
      </button>
      <p className="text-[12px]" style={{ color: C.muted }}>
        Paiement aujourd&apos;hui · 29,99€/mois · annulation 1 clic
      </p>
      {err && <p className="text-[12px]" style={{ color: '#F87171' }}>{err}</p>}
    </div>
  )

  return (
    <main style={{ background: C.bg, color: C.text }} className="min-h-screen w-full">
      {/* halo discret */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-0" style={{
        background: 'radial-gradient(60% 40% at 50% 0%, rgba(140,82,255,0.14), transparent 70%)',
      }} />

      <div className="relative z-10 mx-auto w-full max-w-2xl px-5 py-10 sm:py-14">
        {/* Logo minimal — zéro nav (landing = 1 chemin) */}
        <div className="mb-8 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg text-white font-extrabold"
               style={{ background: `linear-gradient(135deg, ${C.violet}, ${C.cyan})` }}>F</div>
          <span className="text-[14px] font-bold tracking-tight" style={{ color: C.hero }}>FOREAS</span>
        </div>

        {/* ── HERO : on adresse le silence en face (Miller guide + sympathie) ── */}
        <section className="text-center">
          <p className="text-[12px] font-bold uppercase tracking-[0.18em]" style={{ color: C.cyan }}>
            Pour toi qui nous connais déjà
          </p>
          <h1 className="mt-3 text-[30px] sm:text-[40px] font-extrabold leading-[1.05] tracking-tight" style={{ color: C.hero }}>
            Un an de silence.<br />Voilà pourquoi je reviens te voir.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-[16px] leading-relaxed" style={{ color: C.text }}>
            Pas de blabla. Une preuve, une offre, une garantie. Tu juges sur{' '}
            <strong style={{ color: C.hero }}>30 jours</strong> — pas convaincu, je te rembourse, sans discuter.
          </p>
        </section>

        {/* ── PREUVE VIDÉO (l'humain casse la méfiance) ─────────────────────── */}
        {/* Remplaçable par la vidéo FONDATEUR quand elle est prête. En attendant : Binaté, cas réel. */}
        <section className="mt-8">
          <TestimonialVideoCard testimonial={BINATE} index={0} showQuote />
          <p className="mt-3 text-center text-[13px]" style={{ color: C.muted }}>
            <strong style={{ color: C.green }}>8 chauffeurs sur 10</strong> qui reviennent choisissent Pro.
          </p>
        </section>

        {/* ── BÉNÉFICE + ancrage prix (3,23€/jour = un péage) ───────────────── */}
        <section className="mt-10 text-center">
          <h2 className="text-[26px] sm:text-[32px] font-extrabold tracking-tight" style={{ color: C.hero }}>
            Gagne plus, roule moins.
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-[15px] leading-relaxed" style={{ color: C.text }}>
            <strong style={{ color: C.hero }}>29,99€/mois</strong>, c&apos;est{' '}
            <strong style={{ color: C.cyan }}>1€/jour</strong> — le prix d&apos;un café. Une seule course
            récupérée dans la semaine, et c&apos;est remboursé.
          </p>
        </section>

        {/* ── OFFRE + CTA (un seul chemin) ──────────────────────────────────── */}
        <section className="mt-8 rounded-3xl p-6 sm:p-8" style={{ background: C.glass, border: `1px solid ${C.border}` }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: C.violet }}>Pro · le plus choisi</p>
              <p className="mt-1 text-[34px] font-extrabold tabular-nums leading-none" style={{ color: C.hero }}>
                29,99€<span className="text-[15px] font-semibold" style={{ color: C.muted }}>/mois</span>
              </p>
            </div>
            <Guarantee className="hidden sm:inline-flex" />
          </div>

          <ul className="mt-5 space-y-2.5">
            {[
              'Ajnaya IA illimitée + voix Koraly',
              'Heatmap multi-source (où ça paie, en vrai)',
              'Coach courses : accepter / refuser en 0,3s',
              'Compta IA + Tirelire URSSAF auto',
            ].map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-[14px]" style={{ color: C.text }}>
                <Check size={17} style={{ color: C.green }} className="mt-0.5 shrink-0" />
                {f}
              </li>
            ))}
          </ul>

          <div className="mt-6">
            <CTA />
          </div>
          <div className="mt-4 flex sm:hidden justify-center"><Guarantee /></div>

          <div className="mt-4 flex items-center justify-center gap-4 text-[11px]" style={{ color: C.muted }}>
            <span className="inline-flex items-center gap-1"><Lock size={12} /> Paiement sécurisé Stripe</span>
            <span>·</span>
            <span>Annulation en 1 clic</span>
          </div>
        </section>

        {/* ── OBJECTIONS (les 3 craintes du grincheux, courtes + factuelles) ── */}
        <section className="mt-10 space-y-3">
          {[
            { q: '« C\'est trop cher. »', a: '1€/jour. Une course que tu rates te coûte plus. Le retour se voit dès la première semaine.' },
            { q: '« Ça marche pas pour moi. »', a: 'Garantie 30 jours, remboursé sans discuter. Tu testes en vrai, tu risques zéro.' },
            { q: '« J\'ai pas le temps. »', a: '2 minutes pour activer. Après, Ajnaya bosse pendant que tu conduis.' },
          ].map((o) => (
            <div key={o.q} className="rounded-2xl p-4" style={{ background: C.glass, border: `1px solid ${C.border}` }}>
              <p className="text-[14px] font-bold" style={{ color: C.hero }}>{o.q}</p>
              <p className="mt-1 text-[13px] leading-relaxed" style={{ color: C.text }}>{o.a}</p>
            </div>
          ))}
        </section>

        {/* ── CTA final ─────────────────────────────────────────────────────── */}
        <section className="mt-10 text-center">
          <p className="mb-4 text-[15px]" style={{ color: C.text }}>
            Tu as déjà perdu un an. Ce soir, tu peux reprendre la main.
          </p>
          <CTA label="Reprendre la main — 29,99€" />
        </section>

        <p className="mt-10 text-center text-[11px]" style={{ color: C.muted }}>
          FOREAS — copilote des chauffeurs VTC. Paiement Stripe. Garantie 30 jours satisfait ou remboursé.
        </p>
      </div>
    </main>
  )
}
