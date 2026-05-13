/**
 * /success — Page de confirmation post-checkout (server component)
 *
 * Refactor Phase A 14/05/2026 : conversion client component → server component
 * pour (a) charger Stripe côté serveur (pas d'aller-retour browser→API),
 * (b) émettre du HTML SSR avec metadata custom (`<title>` branded), (c) afficher
 * du contenu pertinent dès la 1ère paint au lieu d'un spinner.
 *
 * Flow :
 *  1. Query `?session_id=cs_live_...` (CHECKOUT_SESSION_ID injecté par Stripe)
 *  2. `stripe.checkout.sessions.retrieve(id, {expand: ['subscription','customer','total_details.breakdown']})`
 *  3. Détection tier réel via `price.lookup_key` (foreas_pro_*_v2 / foreas_elite_*_v2)
 *  4. Détection coupon actif (BETA60 → "Aucun débit avant [date trial_end]")
 *  5. Message rétention chaleureux avec prénom + tier + date trial_end
 *  6. 3 cards prochaines étapes : Play Store / Profil chauffeur / Communauté zone
 *  7. CTA secondaire "Gérer mon abonnement" → /api/customer-portal
 *
 * Source de vérité tier : pricing.ts SSOT supprimé (Site2026v83), mapping inline ici.
 *
 * Design : DESIGN_SYSTEM_MASTER §13 variant pulse (Ajnaya réfléchit) cohérent /tarifs2 :
 *  fond noir Apple #000, halo violet+cyan animate-halo-pulse, micro-grain anti-banding,
 *  texte ivoire #F8FAFC, brièveté radicale (≤ 5 mots/phrase), Genos display pour H1.
 */

import type { Metadata } from 'next'
import Stripe from 'stripe'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import SuccessChecmark from './SuccessCheckmark'

export const dynamic = 'force-dynamic' // session unique → pas de cache CDN
export const runtime = 'nodejs'

// ─── Metadata branded (override layout title FOREAS générique) ────────────────
export const metadata: Metadata = {
  title: 'Bienvenue dans FOREAS · Essai activé',
  description: 'Votre essai FOREAS est activé. Prochaines étapes : télécharger l\'app, configurer votre profil chauffeur, rejoindre la communauté.',
  robots: { index: false, follow: false }, // page transactionnelle privée
}

// ─── Mapping lookup_key → tier ────────────────────────────────────────────────
function detectTier(lookupKey: string | null | undefined): 'pro' | 'elite' | 'unknown' {
  if (!lookupKey) return 'unknown'
  if (lookupKey.startsWith('foreas_pro_')) return 'pro'
  if (lookupKey.startsWith('foreas_elite_')) return 'elite'
  return 'unknown'
}

function tierLabel(tier: 'pro' | 'elite' | 'unknown'): string {
  if (tier === 'pro') return 'Pro'
  if (tier === 'elite') return 'Elite'
  return 'FOREAS'
}

function formatDateFR(date: Date): string {
  return date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

// ─── Server component principal ───────────────────────────────────────────────

interface PageProps {
  searchParams: Promise<{ session_id?: string }>
}

export default async function SuccessPage({ searchParams }: PageProps) {
  const { session_id: sessionId } = await searchParams

  // Pas de session_id → état "no session"
  if (!sessionId) {
    return <NoSessionState />
  }

  // Pas de clé Stripe configurée → état dégradé
  const stripeKey = (process.env.STRIPE_SECRET_KEY ?? '').replace(/\s/g, '')
  if (!stripeKey) {
    return <ErrorState reason="Configuration Stripe manquante" />
  }

  // Retrieve la session Stripe côté serveur
  let session: Stripe.Checkout.Session
  try {
    const stripe = new Stripe(stripeKey, { apiVersion: '2025-02-24.acacia' })
    session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'customer', 'total_details.breakdown.discounts'],
    })
  } catch (err) {
    console.error('[success] Stripe retrieve failed:', (err as Error).message)
    return <ErrorState reason="Session introuvable ou invalide" />
  }

  // Garde : session non complétée
  if (session.status !== 'complete' && session.payment_status !== 'paid' && session.status !== 'open') {
    return <ErrorState reason="Paiement non finalisé" />
  }

  // Extraction données
  const subscription = session.subscription as Stripe.Subscription | null
  const customer = session.customer as Stripe.Customer | null
  const customerEmail =
    session.customer_details?.email ?? customer?.email ?? ''
  const customerName =
    session.customer_details?.name ?? customer?.name ?? ''
  const firstName = customerName.split(' ')[0] || 'chauffeur'

  // Tier réel via price.lookup_key (préférable au metadata.plan qui peut diverger)
  const firstItem = subscription?.items?.data?.[0]
  const lookupKey = firstItem?.price?.lookup_key
  const interval = firstItem?.price?.recurring?.interval // 'week' | 'year'
  const tier = detectTier(lookupKey)
  const tierName = tierLabel(tier)
  const billingLabel = interval === 'year' ? 'annuel' : 'hebdomadaire'

  // Trial end (Stripe trial_period_days ou trial_end natif)
  const trialEndUnix = subscription?.trial_end
  const trialEndDate = trialEndUnix ? new Date(trialEndUnix * 1000) : null
  const trialEndFormatted = trialEndDate ? formatDateFR(trialEndDate) : null

  // Détection coupon actif (BETA60 / WELCOME20 / MLM25)
  const discounts =
    session.total_details?.breakdown?.discounts ?? []
  const activeDiscount = discounts[0]?.discount
  const promoCode =
    activeDiscount?.promotion_code && typeof activeDiscount.promotion_code === 'string'
      ? activeDiscount.promotion_code
      : null
  const couponName = activeDiscount?.coupon?.name ?? null
  const hasBeta60 = couponName?.includes('BETA60') || promoCode?.toUpperCase() === 'BETA60'

  // Customer ID pour Customer Portal
  const customerId =
    typeof session.customer === 'string'
      ? session.customer
      : session.customer?.id ?? null

  // Zone (city_slug) pour suggestion groupe communauté
  const customFields = session.custom_fields ?? []
  const cityField = customFields.find((f) => f.key === 'city')
  const city = cityField?.text?.value?.trim() ?? null
  const communityGroup = inferCommunityGroup(city)

  return (
    <main
      className="min-h-screen relative overflow-x-hidden"
      style={{ backgroundColor: '#000' }}
    >
      {/* Halo couche 2 — variant pulse §13 (Ajnaya réfléchit, 0.9s) */}
      <div
        aria-hidden
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 55% 45% at 50% 15%, rgba(16, 185, 129, 0.18) 0%, transparent 70%),' +
            'radial-gradient(ellipse 50% 40% at 25% 70%, rgba(140, 82, 255, 0.22) 0%, transparent 70%),' +
            'radial-gradient(ellipse 45% 35% at 80% 80%, rgba(0, 212, 255, 0.14) 0%, transparent 70%)',
          filter: 'blur(80px)',
        }}
      />
      {/* Micro-grain anti-banding §17 */}
      <div
        aria-hidden
        className="fixed inset-0 pointer-events-none"
        style={{ backgroundColor: 'rgba(255, 255, 255, 0.012)' }}
      />

      <Header />

      <section className="relative max-w-2xl mx-auto px-5 sm:px-8 pt-24 pb-20 sm:pt-32">
        {/* ─── Animated check (client wrapper pour Framer Motion) ───────────── */}
        <SuccessChecmark />

        {/* Eyebrow */}
        <p
          className="text-[10px] font-extrabold uppercase text-center mb-4 tabular-nums"
          style={{ color: '#10B981', letterSpacing: '0.25em' }}
        >
          FOREAS · ESSAI ACTIVÉ
        </p>

        {/* H1 brièveté radicale (≤ 5 mots/phrase) — Genos display */}
        <h1
          className="text-4xl sm:text-5xl font-black text-center leading-[0.92] mb-3"
          style={{
            color: '#F8FAFC',
            letterSpacing: '-0.04em',
            fontFamily: 'var(--font-genos), system-ui, sans-serif',
          }}
        >
          Bienvenue,{' '}
          <span
            style={{
              backgroundImage:
                'linear-gradient(135deg, #6C3CE0 0%, #8C52FF 50%, #00D4FF 100%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {firstName}.
          </span>
        </h1>

        <p
          className="text-center text-base mb-8"
          style={{ color: 'rgba(248, 250, 252, 0.78)' }}
        >
          Votre tier <strong style={{ color: '#F8FAFC' }}>{tierName}</strong> est actif.{' '}
          {trialEndFormatted ? (
            <>
              <br className="hidden sm:block" />
              {hasBeta60 ? (
                <>
                  Aucun débit avant le{' '}
                  <strong style={{ color: '#10B981' }}>{trialEndFormatted}</strong> · code{' '}
                  <span
                    className="font-mono font-bold tabular-nums px-1.5 py-0.5 rounded"
                    style={{
                      backgroundColor: 'rgba(16, 185, 129, 0.12)',
                      color: '#10B981',
                    }}
                  >
                    BETA60
                  </span>
                </>
              ) : (
                <>
                  Aucun débit avant{' '}
                  <strong style={{ color: '#F8FAFC' }}>{trialEndFormatted}</strong>
                </>
              )}
            </>
          ) : (
            <>Premier débit selon votre cycle {billingLabel}.</>
          )}
        </p>

        {/* Trust micros (brièveté radicale) */}
        <div
          className="flex items-center justify-center gap-4 mb-10 text-[10px] tabular-nums"
          style={{ color: 'rgba(248, 250, 252, 0.32)', letterSpacing: '0.04em' }}
        >
          <span>🔒 Stripe sécurisé</span>
          <span>·</span>
          <span>Annulation 1 clic</span>
          <span>·</span>
          <span>Sans engagement</span>
        </div>

        {/* ─── 3 cards prochaines étapes ───────────────────────────────────── */}
        <h2
          className="text-[10px] font-extrabold uppercase mb-5 tabular-nums"
          style={{ color: '#00D4FF', letterSpacing: '0.25em' }}
        >
          Vos 3 prochaines étapes
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-10">
          <NextStepCard
            number={1}
            title="Téléchargez l'app"
            description="Android — disponible Play Store. iOS bientôt."
            ctaLabel="Play Store →"
            ctaHref="https://play.google.com/store/apps/details?id=com.foreas.driver"
            external
            accent="violet"
          />
          <NextStepCard
            number={2}
            title="Configurez votre profil"
            description="Zone, véhicule, plateformes actives. 2 minutes."
            ctaLabel="Mon profil →"
            ctaHref="https://partners.foreas.xyz/driver"
            external
            accent="cyan"
          />
          <NextStepCard
            number={3}
            title="Rejoignez votre communauté"
            description={communityGroup ? `Groupe ${communityGroup}. Chat live chauffeurs.` : 'Chat live chauffeurs par zone.'}
            ctaLabel="Communauté →"
            ctaHref="https://partners.foreas.xyz/driver?tab=community"
            external
            accent="rose"
          />
        </div>

        {/* ─── CTA secondaire : gérer abonnement ──────────────────────────── */}
        {customerId && (
          <div className="text-center">
            <a
              href={`/api/customer-portal?customer_id=${customerId}`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-[13px] font-medium transition-all hover:bg-white/[0.06]"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.10)',
                color: 'rgba(248, 250, 252, 0.78)',
              }}
            >
              Gérer mon abonnement →
            </a>
          </div>
        )}

        {/* Confirmation email — micro */}
        {customerEmail && (
          <p
            className="text-center mt-6 text-[11px]"
            style={{ color: 'rgba(248, 250, 252, 0.32)' }}
          >
            Email de confirmation envoyé à{' '}
            <strong style={{ color: 'rgba(248, 250, 252, 0.52)' }}>{customerEmail}</strong>
          </p>
        )}
      </section>

      <Footer />
    </main>
  )
}

// ─── Card prochaine étape ─────────────────────────────────────────────────────
function NextStepCard({
  number,
  title,
  description,
  ctaLabel,
  ctaHref,
  external,
  accent,
}: {
  number: number
  title: string
  description: string
  ctaLabel: string
  ctaHref: string
  external?: boolean
  accent: 'violet' | 'cyan' | 'rose'
}) {
  const accentColors = {
    violet: { ring: 'rgba(140, 82, 255, 0.28)', text: '#8C52FF' },
    cyan: { ring: 'rgba(0, 212, 255, 0.28)', text: '#00D4FF' },
    rose: { ring: 'rgba(255, 102, 153, 0.28)', text: '#FF6699' },
  }
  const accentColor = accentColors[accent]
  return (
    <div
      className="relative rounded-3xl p-5 flex flex-col"
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
        border: `1px solid rgba(255, 255, 255, 0.06)`,
        boxShadow: `0 0 0 1px ${accentColor.ring}, 0 12px 32px -16px rgba(0, 0, 0, 0.40)`,
      }}
    >
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center mb-3 font-extrabold text-[12px] tabular-nums"
        style={{
          backgroundColor: accentColor.ring,
          color: accentColor.text,
        }}
      >
        {number}
      </div>
      <h3
        className="text-[15px] font-bold leading-tight mb-1"
        style={{ color: '#F8FAFC', letterSpacing: '-0.01em' }}
      >
        {title}
      </h3>
      <p
        className="text-[12px] mb-4 flex-1"
        style={{ color: 'rgba(248, 250, 252, 0.52)' }}
      >
        {description}
      </p>
      <a
        href={ctaHref}
        {...(external
          ? { target: '_blank', rel: 'noopener noreferrer' }
          : {})}
        className="text-[13px] font-bold transition-colors hover:underline"
        style={{ color: accentColor.text }}
      >
        {ctaLabel}
      </a>
    </div>
  )
}

// ─── Map ville → groupe communauté FOREAS (cohérent migration §8 master) ──────
function inferCommunityGroup(city: string | null): string | null {
  if (!city) return null
  const c = city.toLowerCase().trim()
  if (c.includes('paris')) return 'Paris Centre'
  if (
    c.includes('saint-denis') ||
    c.includes('bobigny') ||
    c.includes('saint-ouen') ||
    c.includes('aubervilliers') ||
    c.includes('argenteuil')
  ) {
    return 'Banlieue Nord'
  }
  if (
    c.includes('vitry') ||
    c.includes('créteil') ||
    c.includes('creteil') ||
    c.includes('orly') ||
    c.includes('villejuif')
  ) {
    return 'Banlieue Sud'
  }
  if (
    c.includes('boulogne') ||
    c.includes('nanterre') ||
    c.includes('défense') ||
    c.includes('defense') ||
    c.includes('versailles')
  ) {
    return 'Banlieue Ouest'
  }
  if (c.includes('marne') || c.includes('disney')) return 'Disneyland Paris'
  if (c.includes('cdg') || c.includes('roissy')) return 'CDG Aéroport'
  return null
}

// ─── États dégradés (server-rendered, pas de spinner) ─────────────────────────

function NoSessionState() {
  return (
    <main className="min-h-screen relative" style={{ backgroundColor: '#000' }}>
      <Header />
      <section className="max-w-xl mx-auto px-5 pt-32 pb-20 text-center">
        <h1
          className="text-3xl font-black mb-4"
          style={{
            color: '#F8FAFC',
            letterSpacing: '-0.03em',
            fontFamily: 'var(--font-genos), system-ui, sans-serif',
          }}
        >
          Aucune session.
        </h1>
        <p className="text-[14px] mb-6" style={{ color: 'rgba(248, 250, 252, 0.52)' }}>
          Cette page confirme une souscription Stripe. Lien direct invalide.
        </p>
        <a
          href="/tarifs2"
          className="inline-flex px-5 py-3 rounded-2xl font-bold text-[14px]"
          style={{
            background: 'linear-gradient(135deg, #8C52FF 0%, #6C3CE0 100%)',
            color: '#F8FAFC',
            boxShadow: '0 8px 24px -8px rgba(140, 82, 255, 0.55)',
          }}
        >
          Voir les tarifs
        </a>
      </section>
      <Footer />
    </main>
  )
}

function ErrorState({ reason }: { reason: string }) {
  return (
    <main className="min-h-screen relative" style={{ backgroundColor: '#000' }}>
      <Header />
      <section className="max-w-xl mx-auto px-5 pt-32 pb-20 text-center">
        <div
          className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center text-2xl"
          style={{
            backgroundColor: 'rgba(239, 68, 68, 0.10)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
          }}
        >
          ⚠️
        </div>
        <h1
          className="text-3xl font-black mb-3"
          style={{
            color: '#F8FAFC',
            letterSpacing: '-0.03em',
            fontFamily: 'var(--font-genos), system-ui, sans-serif',
          }}
        >
          Session introuvable.
        </h1>
        <p className="text-[14px] mb-6" style={{ color: 'rgba(248, 250, 252, 0.52)' }}>
          {reason}. Si vous venez de payer, vous recevrez un email de confirmation Stripe.
        </p>
        <a
          href="/contact"
          className="inline-flex px-5 py-3 rounded-2xl font-bold text-[14px]"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            color: '#F8FAFC',
          }}
        >
          Contacter le support
        </a>
      </section>
      <Footer />
    </main>
  )
}
