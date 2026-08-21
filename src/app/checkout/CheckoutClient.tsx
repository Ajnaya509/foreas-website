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
// CheckoutProofToasts RETIRÉ le 14/08/2026 — voir le commentaire au point de montage.
import ExitIntentOffer from '@/components/checkout/ExitIntentOffer'
import { FORMULES } from '@/lib/offre'

import { garantieAffichable } from '@/lib/verite-commerciale'
/**
 * Montant à la française : 29.99 → « 29,99 ». Sans ça, un prix décimal s'affichait
 * « 29.99 € » avec un point — repéré en navigateur le 14/08/2026, l'ancien prix
 * (97) étant un entier, le défaut n'existait pas avant le passage à 29,99 €.
 */
const eur = (n: number) => n.toFixed(2).replace('.', ',')

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '')

/**
 * Prix affichés — dérivés de la source unique `src/lib/offre.ts`.
 *
 * AVANT le 14/08/2026, cette table écrivait en dur « Pro 97 € » et « Elite 247 € »
 * alors que le serveur facturait 29,99 €. Un prix affiché qui ne correspond pas au
 * prix réellement débité n'est pas un détail d'affichage : c'est un prix trompeur.
 * Les formules Elite ont disparu d'ici — elles ne sont plus au catalogue, et le
 * serveur les refuse désormais (`resoudreFormule` → null → 400).
 */
const PLANS: Record<string, { name: string; price: number; perDay: string }> = {
  pro_monthly: {
    name: 'mensuel',
    price: FORMULES.mensuel.centimes / 100,
    perDay: FORMULES.mensuel.sousTitre,
  },
  pro_annual: {
    name: 'annuel',
    price: FORMULES.annuel.centimes / 100,
    perDay: FORMULES.annuel.sousTitre,
  },
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
function PaymentForm({ planKey, isTest, subscriptionId }: { planKey: string; isTest?: boolean; subscriptionId?: string | null }) {
  const stripe = useStripe()
  const elements = useElements()
  const [submitting, setSubmitting] = useState(false)
  const [err, setErr] = useState('')
  const [phone, setPhone] = useState('')
  const plan = PLANS[planKey] ?? PLANS.pro_monthly

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements || submitting) return
    const tel = phone.replace(/[\s.\-()]/g, '')
    if (!/^(\+33|0)\d{9}$/.test(tel) && !/^\+\d{8,15}$/.test(tel)) {
      setErr('Ton numéro de mobile, pour activer ton compte FOREAS.'); return
    }
    setErr(''); setSubmitting(true)
    try { window.fbq?.('trackCustom', 'CustomCheckoutPay', { plan: planKey }) } catch { /* noop */ }
    // Téléphone = point d'ancrage du compte chauffeur (le webhook Railway crée le compte dessus). Non-bloquant.
    if (subscriptionId) {
      try {
        await fetch('/api/subscription/contact', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscription_id: subscriptionId, phone }),
        })
      } catch { /* non-bloquant : le paiement passe quand même */ }
    }
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
      {/* Téléphone — ancre le compte chauffeur (l'app se connecte dessus au 1er lancement) */}
      <div>
        <label htmlFor="foreas-phone" className="block text-[12px] font-medium text-white/55 mb-1.5">Ton mobile</label>
        <input
          id="foreas-phone" type="tel" inputMode="tel" autoComplete="tel" required
          value={phone} onChange={(e) => setPhone(e.target.value)}
          placeholder="06 12 34 56 78"
          className="w-full rounded-[14px] px-3.5 py-3 text-[15px] text-[#F8FAFC] outline-none transition-colors focus:border-[#00D4FF]/55"
          style={{ background: 'rgba(255,255,255,0.035)', border: '1px solid rgba(255,255,255,0.10)' }}
        />
        <p className="mt-1.5 text-[11px] text-white/40">Pour activer ton accès dans l’app. Jamais de spam.</p>
      </div>
      <PaymentElement options={{ layout: 'tabs' }} />

      <InkGradientButton as="button" type="submit" variant="violet" size="lg" disabled={!stripe || submitting} className="w-full">
        <span className="inline-flex items-center justify-center gap-2">
          {submitting ? <Loader2 size={18} className="animate-spin" /> : <Lock size={16} />}
          {submitting ? 'Paiement en cours…' : isTest ? 'Payer 0,50 € · test' : `Payer ${eur(plan.price)} € · démarrer maintenant`}
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
  const testToken = params.get('t') // lien secret de test → 1re facture à 0,50€
  const plan = PLANS[planKey] ?? PLANS.pro_monthly
  // La période affichée doit suivre la formule choisie, pas être écrite en dur.
  const annuel = planKey === 'pro_annual' || planKey === 'annuel' || planKey === 'annual'

  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [subId, setSubId] = useState<string | null>(null)
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
          body: JSON.stringify({ plan: planKey, ...(ref ? { referral_code: ref } : {}), ...(exitOffer ? { exit_offer: true } : {}), ...(testToken ? { test_token: testToken } : {}) }),
        })
        const data = await res.json()
        if (cancelled) return
        if (data.clientSecret) { setClientSecret(data.clientSecret); setSubId(data.subscriptionId ?? null) }
        else setLoadErr(data.error || 'Initialisation du paiement impossible.')
      } catch {
        if (!cancelled) setLoadErr('Erreur réseau. Recharge la page.')
      }
    })()
    return () => { cancelled = true }
  }, [planKey, ref, exitOffer, testToken])

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
            {/* ⚠️ 21/08/2026 — la garantie n'est plus annoncée : le droit existe au contrat (/cgu), le mécanisme n'est pas prouvé. Voir GARANTIE_30J. */}
            {garantieAffichable()
              ? <>Paiement aujourd&apos;hui — et tu es couvert&nbsp;: <span className="text-[#10B981] font-semibold">30 jours satisfait ou remboursé</span>, sans discuter.</>
              : <>Paiement aujourd&apos;hui — et tu <span className="text-[#10B981] font-semibold">résilies quand tu veux</span>, depuis ton espace.</>}
          </p>
          {testToken && (
            <div className="mt-4 inline-flex items-center gap-2 rounded-full px-3.5 py-1.5" style={{ background: 'rgba(245,200,66,0.10)', border: '1px solid rgba(245,200,66,0.35)' }}>
              <span className="text-[11px] font-extrabold uppercase text-[#F5C842]" style={{ letterSpacing: '0.12em' }}>Mode test</span>
              <span className="text-[12px] text-white/70">tu seras débité <strong className="text-[#F8FAFC]">0,50 €</strong> (remboursable)</span>
            </div>
          )}
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
                <PaymentForm planKey={planKey} isTest={!!testToken} subscriptionId={subId} />
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
              {exitOffer && <span className="text-[20px] font-bold tabular-nums text-white/35 line-through">{eur(plan.price)}&nbsp;€</span>}
              <span className="text-[40px] font-extrabold tabular-nums leading-none text-[#F8FAFC]" style={{ letterSpacing: '-0.04em' }}>
                {exitOffer ? eur(plan.price * 0.8) : eur(plan.price)}&nbsp;€
              </span>
              {/* 14/08/2026 — ce récapitulatif écrivait « /mois » et « ce mois-ci » QUEL QUE SOIT
                  le plan : un chauffeur arrivé par ?plan=pro_annual lisait « 249,99 € /mois » et
                  « −20% ce mois-ci · puis 249,99€/mois ». Le montant était juste, la période
                  fausse — sur la page où il sort sa carte. La période suit maintenant la formule. */}
              <span className="text-[13px] text-white/45">
                {exitOffer ? (annuel ? '1re année' : '1er mois') : (annuel ? '/an' : '/mois')} · FOREAS {plan.name}
              </span>
            </div>
            <p className="mt-1.5 text-[12px] text-[#00D4FF]/90 tabular-nums">
              {exitOffer
                ? `−20% ${annuel ? 'la 1re année' : 'ce mois-ci'} · puis ${eur(plan.price)} €${annuel ? '/an' : '/mois'}`
                : `soit ${plan.perDay}`}
            </p>

            <div className="my-5 h-px bg-white/[0.07]" />

            <ul className="space-y-3">
              {[
                // « IA » banni du site : on dit Ajnaya, c'est son nom (règle cross-fil).
                ['Ajnaya, sans limite', 'et sa voix, Koraly'],
                ['Où ça paie, zone par zone', 'la bonne course, au bon moment'],
                ['Coach courses', 'accepter / refuser en 0,3s'],
                // ⚠️ Garde-fou légal M18 : FOREAS est un COPILOTE de gestion, jamais un
                // expert-comptable (Ordonnance du 19 sept. 1945, art. 20). Et l'URSSAF
                // SE CALCULE — elle ne « se met pas de côté automatiquement » : promettre
                // une mise de côté, c'est promettre un service financier qu'on ne rend pas.
                ['Copilote compta + URSSAF', 'ce que tu devras, calculé au fil des courses'],
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
              <span className="text-[12.5px] font-semibold text-[#10B981] leading-tight">{garantieAffichable() ? 'Garanti 30 jours — remboursé, sans question' : 'Résiliable à tout moment, depuis ton espace'}</span>
            </div>
            <p className="mt-3 text-[11.5px] leading-relaxed text-white/45">
              Une seule course récupérée dans la semaine, et c&apos;est remboursé. Tu testes en vrai, tu risques zéro.
            </p>
          </aside>
        </div>
      </main>

      {/* Bulles "vient de s'abonner" — preuve sociale, comme la home */}
      {/*
        ⛔ RETIRÉ LE 14/08/2026 — FAUSSE PREUVE SOCIALE SUR LA PAGE QUI ENCAISSE.

        Le composant affichait, en boucle, dix chauffeurs INVENTÉS annonçant
        « X vient de s'abonner à FOREAS Pro · il y a 3 min » : Bakary S. (Nantes),
        Driss T. (Lyon), Karim B. (CDG), Soufiane M. (Paris 11ᵉ), Pavel N. (Lille),
        Ahmed F. (Orly), Théodore R. (Marseille)… avec un horodatage tiré au sort.

        Mesure qui tranche :
          select count(*) from drivers where stripe_subscription_id is not null;  -- 0
          select count(*) from subscribers;                                       -- 0
        **Personne ne s'est jamais abonné.** Ce n'était pas une exagération, c'était
        une invention intégrale, affichée à l'endroit exact où le chauffeur sort sa
        carte. C'est le cas d'école de la pratique commerciale trompeuse
        (art. L.121-1 du code de la consommation), et « FOREAS Pro » désigne en plus
        une offre qui n'existe plus.

        Il n'existe aucune version honnête de « vient de s'abonner » quand le compteur
        est à zéro : le composant est retiré, pas réécrit. On le rebranchera le jour
        où de vrais abonnements existeront, alimenté par la base et non par une liste.

        Socle : FOREAS-SHARED/VERITE_COMMERCIALE_2026-08-14.md
      */}
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
