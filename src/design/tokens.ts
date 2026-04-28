/**
 * FOREAS Design Tokens v2 — Site Vitrine
 *
 * Mirror EXACT du design system de l'app FOREAS Driver
 * (skill: ~/FOREAS-Clean/.claude/skills/foreas-mobile-design.md v1.0)
 *
 * Source de vérité unique : ces tokens DOIVENT être utilisés partout dans
 * le site. Tout hex/spacing hardcodé est interdit en code review.
 *
 * Cohérence cross-canal :
 *  - App mobile (FOREAS-Clean) : tokens.v2.ts
 *  - Site vitrine (foreas.xyz) : ce fichier
 *  - Widget Ajnaya : consomme via Tailwind classes
 *
 * Site2026v41 — Refonte design system unifié — 2026-04-28
 */

// ─── PALETTE ──────────────────────────────────────────────────────────────────
// Source : skill foreas-mobile-design.md §3
export const PALETTE = {
  // Obsidian — backgrounds multi-couches (NON-NÉGOCIABLE)
  obsidian: '#060610',           // profondeur max — body
  obsidianDeep: '#070A14',       // cards layer 1
  obsidianLight: '#111528',      // cards layer 2

  // Accents signature
  cyanElectric: '#00D4FF',       // primary action
  violetRoyal: '#8C52FF',        // brand Ajnaya
  goldSubtle: '#F5C842',         // success premium

  // États fonctionnels (web-only — pas dans skill app mais nécessaire pour forms)
  danger: '#EF4444',             // destructive only
  warning: '#F5A623',            // attention soft

  // Glass
  glassHigh: 'rgba(17, 21, 40, 0.88)',
  glassBorder: 'rgba(255, 255, 255, 0.08)',
  glassBorderHover: 'rgba(255, 255, 255, 0.16)',

  // Texte (opacités de blanc — WCAG AA validé sur obsidian)
  textPrimary: '#FFFFFF',                    // 20.7:1 contrast ✓
  textSecondary: 'rgba(255, 255, 255, 0.72)', // ~14:1 ✓
  textTertiary: 'rgba(255, 255, 255, 0.45)',  // ~9:1 ✓
  textMuted: 'rgba(255, 255, 255, 0.28)',     // ~5.6:1 — éviter pour labels critiques
} as const

// ─── TYPOGRAPHIE ─────────────────────────────────────────────────────────────
// 11 niveaux + eyebrow — mirror de l'app
// Note web : SF Pro/Inter sur app → Montserrat (body) + Genos (display) sur site
// Les niveaux et tailles sont identiques ; seules les familles diffèrent.
export const TYPO = {
  // Display — Genos
  displayXXL: { fontSize: 64, lineHeight: 68, letterSpacing: -1.5, fontWeight: 700 },
  displayXL: { fontSize: 56, lineHeight: 60, letterSpacing: -1.2, fontWeight: 700 },
  displayL: { fontSize: 48, lineHeight: 52, letterSpacing: -0.8, fontWeight: 700 },

  // Headings — Genos
  h1: { fontSize: 36, lineHeight: 44, letterSpacing: -0.4, fontWeight: 600 },
  h2: { fontSize: 28, lineHeight: 36, letterSpacing: -0.3, fontWeight: 600 },
  h3: { fontSize: 22, lineHeight: 28, letterSpacing: -0.2, fontWeight: 600 },

  // Body — Montserrat
  bodyLG: { fontSize: 18, lineHeight: 28, letterSpacing: 0, fontWeight: 400 },
  body: { fontSize: 16, lineHeight: 24, letterSpacing: 0, fontWeight: 400 },
  bodyBold: { fontSize: 16, lineHeight: 24, letterSpacing: 0, fontWeight: 600 },

  // Labels — Montserrat
  label: { fontSize: 14, lineHeight: 20, letterSpacing: 0.1, fontWeight: 500 },
  caption: { fontSize: 12, lineHeight: 16, letterSpacing: 0.2, fontWeight: 500 },
  micro: { fontSize: 10, lineHeight: 14, letterSpacing: 0.3, fontWeight: 600 },

  // Eyebrow — Montserrat uppercase
  eyebrow: { fontSize: 11, lineHeight: 14, letterSpacing: 1.5, fontWeight: 700, textTransform: 'uppercase' as const },
} as const

// ─── ESPACEMENT ──────────────────────────────────────────────────────────────
// Système 4pt (skill §3)
export const SPACE = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
  massive: 64,
} as const

// ─── RADIUS ──────────────────────────────────────────────────────────────────
export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  round: 9999,
} as const

// ─── MOTION ──────────────────────────────────────────────────────────────────
// Skill §8 — durées monolithiques + easings
export const MOTION = {
  duration: {
    instant: 0.12,    // 120ms — micro-feedback
    fast: 0.22,       // 220ms — tap → state change
    base: 0.32,       // 320ms — card entrance
    slow: 0.48,       // 480ms — celebration
    cinematic: 0.72,  // 720ms — onboarding reveal
  },
  easing: {
    standard: [0.4, 0, 0.2, 1] as const,       // material standard
    decelerate: [0, 0, 0.2, 1] as const,       // entering
    accelerate: [0.4, 0, 1, 1] as const,       // exiting
    bouncy: [0.34, 1.56, 0.64, 1] as const,    // overshoot subtil (Apple)
  },
  spring: {
    snappy: { type: 'spring' as const, stiffness: 380, damping: 30 },
    bouncy: { type: 'spring' as const, stiffness: 260, damping: 18 },
    soft: { type: 'spring' as const, stiffness: 180, damping: 22 },
  },
} as const

// ─── ELEVATION (shadows tier-aware web) ──────────────────────────────────────
// Sur web, on utilise les valeurs BALANCED par défaut (équivalent desktop confort)
// Le hook useDeviceTier() web peut réduire à EFFICIENT si prefers-reduced-motion
export const ELEVATION = {
  // Card shadows
  card: {
    sm: '0 2px 8px rgba(0, 0, 0, 0.20)',
    md: '0 4px 16px rgba(0, 0, 0, 0.30)',
    lg: '0 8px 24px rgba(0, 0, 0, 0.40)',
  },
  // Glow effects (signature FOREAS)
  glow: {
    cyan: '0 0 16px rgba(0, 212, 255, 0.40)',
    cyanStrong: '0 0 24px rgba(0, 212, 255, 0.55)',
    violet: '0 0 16px rgba(140, 82, 255, 0.40)',
    violetStrong: '0 0 24px rgba(140, 82, 255, 0.55)',
    gold: '0 0 16px rgba(245, 200, 66, 0.30)',
  },
} as const

// ─── BREAKPOINTS (web-only) ──────────────────────────────────────────────────
export const BREAKPOINTS = {
  mobile: 0,        // < 640px
  tablet: 640,      // 640-1023px
  desktop: 1024,    // 1024-1439px
  wide: 1440,       // ≥ 1440px
} as const

// ─── GLOSSAIRE FOREAS CANONIQUE (skill §7) ───────────────────────────────────
// Mots à utiliser exactement comme ça partout sur le site et l'app
export const GLOSSAIRE = {
  ajnaya: 'Ajnaya',                    // nom propre — JAMAIS traduire
  coursesReflex: 'Courses Réflex',     // coach temps réel
  laConcierge: 'La Concierge',         // dashboard prospection
  laConciergerie: 'La Conciergerie',   // liste prospects
  laVoix: 'La Voix',                   // clone vocal
  lesMessages: 'Les Messages',         // inbox WhatsApp
  tonSite: 'Ton Site',                 // foreas.xyz/prenom
  laCompta: 'La Compta',               // compta + e-invoice
  leGroupe: 'Le Groupe',               // community
  lesChiffres: 'Les Chiffres',         // analytics
} as const

// ─── MOTS BANNIS (skill §7) ──────────────────────────────────────────────────
// Liste à filtrer dans l'audit copywriting
export const MOTS_BANNIS = [
  'IA',                  // → "elle" ou "Ajnaya"
  'Assistant',           // → "Ajnaya" ou action
  'Smart',               // → action/bénéfice
  'Intelligent',         // → action/bénéfice
  'Révolutionnaire',     // creux
  'Innovant',            // creux
  'Innovation',          // creux
  'Optimisé',            // jargon tech
  'Optimisation',        // jargon tech
  'Dashboard',           // → "Tableau de bord" ou "Accueil"
  'Features',            // → "outils" ou "usages"
  'Synergies',           // bullshit corporate
  'Synergie',            // bullshit corporate
] as const

// ─── EXPORTS HELPERS ──────────────────────────────────────────────────────────
export type PaletteKey = keyof typeof PALETTE
export type TypoKey = keyof typeof TYPO
export type SpaceKey = keyof typeof SPACE
export type RadiusKey = keyof typeof RADIUS
export type DurationKey = keyof typeof MOTION.duration
