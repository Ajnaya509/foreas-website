/**
 * pricing.ts — SOURCE OF TRUTH unique pour les tiers FOREAS.
 *
 * Toute référence à un prix, un product ID ou un price ID PASSE PAR ICI.
 * Aucun prix hardcodé ailleurs dans le code.
 *
 * Architecture verrouillée 10/05/2026 12:30 (Chandler) :
 *  - 3 tiers : Free / Pro 19,97€/sem / Elite 44,97€/sem
 *  - Annuel = -20% (= prix hebdo × 52 × 0.8)
 *
 * Source de vérité : /Users/chandlermilien/FOREAS-SHARED/PRICING_FEATURES_MASTER.md
 *
 * IDs Stripe :
 *  - Products restent stables (Pro: prod_URYnOntehRDRsY, Elite: prod_URYnwjI3Ry5bND)
 *  - Prices : nouveaux IDs créés post-Phase A (anciens 14,97/34,97/12,97 archivés)
 *  - Les IDs sont injectés via env vars Vercel (jamais hardcodés ici → permet
 *    un swap test/live sans rebuild)
 */

// ─── Tier IDs (stables, jamais à changer) ─────────────────────────────────────
export type Tier = 'free' | 'pro' | 'elite'
export type Billing = 'weekly' | 'annual'

// ─── Stripe Product IDs (LIVE — verrouillés) ──────────────────────────────────
export const STRIPE_PRODUCTS = {
  pro:   'prod_URYnOntehRDRsY',  // FOREAS Driver Pro
  elite: 'prod_URYnwjI3Ry5bND',  // FOREAS Driver Elite
  // essentiel: prod_URYn12gZbTsQiM ← ARCHIVÉ 10/05/2026 (Phase A)
} as const

// ─── Stripe Price IDs (lus depuis env Vercel) ─────────────────────────────────
// Les nouveaux IDs sont créés par le script `scripts/stripe-phase-a.sh` puis
// injectés dans Vercel via `vercel env add`. Si une env var manque, le checkout
// retourne 500 explicit "Price ID missing for tier X billing Y".
export function getPriceId(tier: Exclude<Tier, 'free'>, billing: Billing): string | null {
  const key = `STRIPE_PRICE_ID_${tier.toUpperCase()}_${billing.toUpperCase()}`
  const value = process.env[key]
  return value && value.trim().length > 0 ? value.trim() : null
}

/**
 * Mapping clair pour debug / docs :
 *   STRIPE_PRICE_ID_PRO_WEEKLY     → Pro 19,97€/sem (à créer Phase A)
 *   STRIPE_PRICE_ID_PRO_ANNUAL     → Pro 830,75€/an (à créer Phase A)
 *   STRIPE_PRICE_ID_ELITE_WEEKLY   → Elite 44,97€/sem (à créer Phase A)
 *   STRIPE_PRICE_ID_ELITE_ANNUAL   → Elite 1 870,75€/an (à créer Phase A)
 */

// ─── Plans metadata (UI) ──────────────────────────────────────────────────────
export interface PlanMeta {
  tier: Tier
  /** Nom affiché */
  name: string
  /** Slogan court (≤ 5 mots) — Design System brièveté radicale */
  tagline: string
  /** Prix affiché en € — number, pas de string, pour formatage tabular-nums */
  weeklyPrice: number      // €/sem
  annualPrice: number      // €/an (= weekly × 52 × 0.8)
  /** Couleur badge (hex) — Design System §11 */
  badgeColor: string
  /** Forme du badge — Design System §11 */
  badgeStyle: 'flat' | 'halo' | 'pulse_radial'
  /** Liste features (ordonné — la 1ère = la plus impactante) */
  features: { label: string; included: boolean }[]
  /** Highlight (le tier "le plus populaire") */
  popular?: boolean
}

export const PLANS: Record<Tier, PlanMeta> = {
  free: {
    tier: 'free',
    name: 'Free',
    tagline: 'Découverte',
    weeklyPrice: 0,
    annualPrice: 0,
    badgeColor: '#6B7280',
    badgeStyle: 'flat',
    features: [
      { label: 'Heatmap basique (3 zones)',           included: true  },
      { label: 'Chat communauté Telegram-like',        included: true  },
      { label: 'Compta IA basique (saisie manuelle)',  included: true  },
      { label: 'Ajnaya 3 messages/jour',               included: true  },
      { label: 'Coach courses (verdict 0.3s)',         included: false },
      { label: 'Concierge B2B (Témoin Vivant)',        included: false },
      { label: 'Site personnel chauffeur',             included: false },
      { label: 'Compta IA OCR',                        included: false },
      { label: 'Courses FOREAS prioritaires',          included: false },
    ],
  },
  pro: {
    tier: 'pro',
    name: 'Pro',
    tagline: 'Le bon choix',
    weeklyPrice: 19.97,
    annualPrice: 830.75,
    badgeColor: '#00D4FF',
    badgeStyle: 'halo',
    popular: true,
    features: [
      { label: 'Heatmap full multi-source',            included: true },
      { label: 'Ajnaya illimitée + voix Koraly',       included: true },
      { label: 'Coach courses (verdict 0.3s)',         included: true },
      { label: 'Concierge B2B Témoin Vivant',          included: true },
      { label: 'Site personnel foreas.xyz/c/[slug]',   included: true },
      { label: 'Compta IA OCR + URSSAF auto',          included: true },
      { label: 'Notifications Ajnaya avancées',        included: true },
      { label: 'Courses FOREAS prioritaires',          included: false },
    ],
  },
  elite: {
    tier: 'elite',
    name: 'Elite',
    tagline: 'Dispatch prioritaire',
    weeklyPrice: 44.97,
    annualPrice: 1870.75,
    badgeColor: '#FFD700',
    badgeStyle: 'pulse_radial',
    features: [
      { label: 'Tout le Pro inclus',                   included: true },
      { label: 'Courses FOREAS prioritaires (+200€/sem)', included: true },
      { label: 'Early access nouvelles features',      included: true },
      { label: 'Coaching Ajnaya privé (1-to-1)',       included: true },
      { label: 'Support 1ère ligne (<1h ouvré)',       included: true },
    ],
  },
}

// ─── Promo codes (créés Phase A côté Stripe) ──────────────────────────────────
export const PROMO_CODES = [
  { code: 'WELCOME20', label: '-20% le 1er mois',       duration: 'once'      as const },
  { code: 'MLM25',     label: '-25% le 1er mois',       duration: 'once'      as const },
  { code: 'BETA60',    label: '60 jours gratuits',      duration: 'repeating' as const },
] as const

// ─── Helpers ──────────────────────────────────────────────────────────────────
export function formatEuro(amount: number, opts: { decimals?: number } = {}): string {
  const { decimals = 2 } = opts
  return amount
    .toLocaleString('fr-FR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })
    .replace(/ | /g, ' ') // normalise les espaces insécables
}

/**
 * Calcule le prix mensuel apparent (pour comparer avec concurrents abonnement
 * mensuel type Uber Pro / Bolt Plus). Hebdo × 4.33 (= 52/12).
 */
export function monthlyEquivalent(weeklyPrice: number): number {
  return Math.round(weeklyPrice * 4.33 * 100) / 100
}

/**
 * Retourne l'économie annuelle en euros si le user prend l'annuel vs l'hebdo.
 * Annuel = weekly × 52 × 0.8 (-20%) → économie = weekly × 52 × 0.2
 */
export function annualSavingsEur(weeklyPrice: number): number {
  return Math.round(weeklyPrice * 52 * 0.2 * 100) / 100
}

// ─── Cascade MLM (statu quo confirmé Chandler 10/05/2026 13:35) ───────────────
// Note : la décision 12:30 ("20/8/4") a été annulée explicitement à 13:35 par
// Chandler — "la commission MLM doit rester pareille". Le fil Pieuvre a fait
// le rollback de la RPC trigger_mlm_commissions à 10/4/2.
// Source : AJNAYA_CHANGELOG.md entrée 2026-05-10 13:35.
export const MLM_CASCADE = {
  N1: 10, // €/mois par filleul direct qualifié
  N2: 4,  // €/mois (40% de N1)
  N3: 2,  // €/mois (20% de N1)
} as const
