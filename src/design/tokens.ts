/**
 * FOREAS Design Tokens — Site Vitrine ALIGNÉ APP ACTUELLE
 *
 * Source de vérité : palette LIVE de l'app FOREAS Driver v110
 *  - HomeScreen.tsx (`const COLORS = {...}`)
 *  - GlassCard.tsx + theme/tokens.ts
 *
 * Site2026v42 — Refonte visuelle = même langage que l'app
 *
 * Cohérence cross-canal :
 *  - App mobile (FOREAS-Clean v110) : tokens.ts (legacy compat)
 *  - Site vitrine (foreas.xyz) : ce fichier
 *  - Widget Ajnaya : Tailwind classes alignées
 */

// ─── PALETTE — VRAIE PALETTE APP ACTUELLE ────────────────────────────────────
export const PALETTE = {
  // Background — Navy (même hex que HomeScreen.tsx ligne 79)
  navy: '#080C18',           // body background
  navyDeep: '#060A14',       // deeper layer (WebView fallback)
  navyCard: '#0D1526',       // card background solid
  navyMid: '#0B0F1A',        // intermediate (legacy theme/tokens.ts)

  // Accents — gradient cyan → violet → purple (signature app)
  cyanElectric: '#00C9FF',   // primary action
  violetRoyal: '#6C3CE0',    // brand violet
  purpleDeep: '#A855F7',     // secondary brand

  // États fonctionnels
  success: '#4ADE80',        // positive feedback
  danger: '#FF6B6B',         // errors
  warning: '#FFA500',        // attention
  goldGradient: '#FFD700',   // admin gradient start

  // Glass effects (multi-couches signature app)
  glassBg: 'rgba(11, 17, 32, 0.88)',        // HomeScreen.tsx — heavy glass
  glassBgLight: 'rgba(12, 18, 34, 0.58)',   // GlassCard.tsx — medium glass
  glassBgUltra: 'rgba(255, 255, 255, 0.03)', // ultra-light overlay
  glassBorder: '#1A2540',                    // solid border
  glassBorderSoft: 'rgba(255, 255, 255, 0.08)', // soft border (most cards)
  glassBorderHover: 'rgba(255, 255, 255, 0.16)',

  // Texte (opacités blanc — WCAG AA validé sur navy)
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.72)', // body secondary
  textTertiary: 'rgba(255, 255, 255, 0.55)',  // labels
  textMuted: 'rgba(255, 255, 255, 0.35)',     // captions/disabled

  // Glow signature (ombres lumineuses cyan/violet)
  glowPrimary: '#6EA8FE',    // cyan glow color
  glowSecondary: '#8C52FF',  // legacy violet glow
} as const

// ─── GRADIENT SIGNATURE — cyan → violet → purple (HomeScreen marker style) ───
export const GRADIENT = {
  signature: 'linear-gradient(135deg, #00C9FF 0%, #6C3CE0 50%, #A855F7 100%)',
  signatureH: 'linear-gradient(90deg, #00C9FF 0%, #6C3CE0 50%, #A855F7 100%)',
  cyanViolet: 'linear-gradient(135deg, #00C9FF 0%, #6C3CE0 100%)',
  violetPurple: 'linear-gradient(135deg, #6C3CE0 0%, #A855F7 100%)',
  // Mesh radial signature (HomeScreen marker pulse)
  meshHero: `
    radial-gradient(circle at 25% 30%, rgba(0, 201, 255, 0.18) 0%, transparent 45%),
    radial-gradient(circle at 75% 70%, rgba(108, 60, 224, 0.15) 0%, transparent 50%),
    radial-gradient(circle at 50% 100%, rgba(168, 85, 247, 0.10) 0%, transparent 60%)
  `,
} as const

// ─── TYPOGRAPHIE — Genos (heading) + Montserrat (body) ───────────────────────
// Source : theme/tokens.ts — "Genos" / "Montserrat"
export const TYPO = {
  // Display — Genos (signature)
  displayXXL: { fontSize: 64, lineHeight: 68, letterSpacing: -1.5, fontWeight: 700 },
  displayXL: { fontSize: 56, lineHeight: 60, letterSpacing: -1.2, fontWeight: 700 },
  displayL: { fontSize: 48, lineHeight: 52, letterSpacing: -0.8, fontWeight: 700 },

  // Headings — Genos (app: h1=32, h2=24)
  h1: { fontSize: 32, lineHeight: 36, letterSpacing: -0.4, fontWeight: 700 },
  h2: { fontSize: 24, lineHeight: 28, letterSpacing: -0.3, fontWeight: 600 },
  h3: { fontSize: 20, lineHeight: 26, letterSpacing: -0.2, fontWeight: 600 },

  // Body — Montserrat (app: body=16, caption=13, small=11)
  bodyLG: { fontSize: 18, lineHeight: 28, letterSpacing: 0, fontWeight: 400 },
  body: { fontSize: 16, lineHeight: 24, letterSpacing: 0, fontWeight: 400 },
  bodyBold: { fontSize: 16, lineHeight: 24, letterSpacing: 0, fontWeight: 600 },

  // Labels — Montserrat
  label: { fontSize: 14, lineHeight: 20, letterSpacing: 0.1, fontWeight: 500 },
  caption: { fontSize: 13, lineHeight: 18, letterSpacing: 0.2, fontWeight: 500 },
  micro: { fontSize: 11, lineHeight: 14, letterSpacing: 0.3, fontWeight: 600 },

  // Eyebrow — Montserrat uppercase
  eyebrow: { fontSize: 11, lineHeight: 14, letterSpacing: 1.5, fontWeight: 700, textTransform: 'uppercase' as const },
} as const

// ─── ESPACEMENT (system app — theme/tokens.ts) ──────────────────────────────
export const SPACE = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
  huge: 64,
  massive: 96,
  container: 24,
} as const

// ─── RADIUS (system app — theme/tokens.ts) ──────────────────────────────────
export const RADIUS = {
  xs: 2,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 28,
  pill: 999,
} as const

// ─── EFFECTS — Blur intensity (app GlassCard heavy = 50) ────────────────────
export const BLUR = {
  light: 20,
  medium: 24,
  heavy: 50,
} as const

// ─── MOTION — Animations app (fast/normal/slow) ─────────────────────────────
export const MOTION = {
  duration: {
    instant: 0.12,
    fast: 0.18,       // 180ms — app `fast`
    base: 0.30,       // 300ms — app `normal`
    slow: 0.50,       // 500ms — app `slow`
    cinematic: 0.72,
  },
  easing: {
    standard: [0.4, 0, 0.2, 1] as const,
    decelerate: [0, 0, 0.2, 1] as const,
    accelerate: [0.4, 0, 1, 1] as const,
    bouncy: [0.34, 1.56, 0.64, 1] as const,
    apple: [0.16, 1, 0.3, 1] as const,  // signature ease-out app
  },
  spring: {
    snappy: { type: 'spring' as const, stiffness: 380, damping: 30 },
    bouncy: { type: 'spring' as const, stiffness: 260, damping: 18 },
    soft: { type: 'spring' as const, stiffness: 180, damping: 22 },
  },
} as const

// ─── ELEVATION (shadows + glows app) ────────────────────────────────────────
export const ELEVATION = {
  // Shadows
  card: {
    sm: '0 2px 8px rgba(0, 0, 0, 0.20)',
    md: '0 4px 16px rgba(0, 0, 0, 0.30)',
    lg: '0 8px 24px rgba(0, 0, 0, 0.40)',
  },
  // Glow effects (signature app HomeScreen marker)
  glow: {
    cyan: '0 0 12px rgba(0, 201, 255, 0.40), 0 0 24px rgba(0, 201, 255, 0.20)',
    cyanStrong: '0 0 20px rgba(0, 201, 255, 0.60), 0 0 40px rgba(0, 201, 255, 0.30)',
    violet: '0 0 12px rgba(108, 60, 224, 0.40), 0 0 24px rgba(108, 60, 224, 0.20)',
    violetStrong: '0 0 20px rgba(108, 60, 224, 0.60), 0 0 40px rgba(108, 60, 224, 0.30)',
    purple: '0 0 12px rgba(168, 85, 247, 0.40), 0 0 24px rgba(168, 85, 247, 0.20)',
    // Marker glow signature (HomeScreen .dd)
    marker: '0 0 12px rgba(0, 201, 255, 0.80), 0 0 24px rgba(108, 60, 224, 0.40)',
  },
} as const

// ─── BREAKPOINTS (web-only) ──────────────────────────────────────────────────
export const BREAKPOINTS = {
  mobile: 0,
  tablet: 640,
  desktop: 1024,
  wide: 1440,
} as const

// ─── GLOSSAIRE FOREAS CANONIQUE (skill §7) ───────────────────────────────────
export const GLOSSAIRE = {
  ajnaya: 'Ajnaya',
  coursesReflex: 'Courses Réflex',
  laConcierge: 'La Concierge',
  laConciergerie: 'La Conciergerie',
  laVoix: 'La Voix',
  lesMessages: 'Les Messages',
  tonSite: 'Ton Site',
  laCompta: 'La Compta',
  leGroupe: 'Le Groupe',
  lesChiffres: 'Les Chiffres',
} as const

// ─── MOTS BANNIS (skill §7) ──────────────────────────────────────────────────
export const MOTS_BANNIS = [
  'IA', 'Assistant', 'Smart', 'Intelligent',
  'Révolutionnaire', 'Innovant', 'Innovation',
  'Optimisé', 'Optimisation',
  'Dashboard', 'Features',
  'Synergies', 'Synergie',
] as const

// ─── EXPORTS HELPERS ──────────────────────────────────────────────────────────
export type PaletteKey = keyof typeof PALETTE
export type TypoKey = keyof typeof TYPO
export type SpaceKey = keyof typeof SPACE
export type RadiusKey = keyof typeof RADIUS
export type DurationKey = keyof typeof MOTION.duration
