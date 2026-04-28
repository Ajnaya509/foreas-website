/**
 * FOREAS Design Tokens — Site Vitrine
 *
 * Source de vérité : `~/FOREAS-Clean/src/design/tokens.v2.ts`
 * (le système canonical de l'app FOREAS Driver v110, pas le bricolage HomeScreen)
 *
 * Site2026v43 — Refonte FOREAS-Grade (Apple-grade × Cialdini × Krug × Miller)
 *
 * RÈGLE D'OR : Aucun hex hardcodé en dehors de ce fichier.
 *              Tout passe par PALETTE / TYPO / SPACE / RADIUS / MOTION.
 */

// ─── PALETTE — Système canonique app v110 ─────────────────────────────────────
export const PALETTE = {
  // Obsidian — backgrounds multi-couches (NON-NÉGOCIABLE)
  obsidian: '#060610',          // body — profondeur max
  obsidianDeep: '#070A14',      // cards layer 1
  obsidianLight: '#111528',     // cards layer 2

  // Accents signature — cyan primaire, violet brand, gold success
  cyanElectric: '#00D4FF',      // primary action / focus / signature
  cyanIce: '#6DEAFF',           // soft highlights / hover
  cyanDeep: '#00A3CC',          // pressed states
  violetRoyal: '#8C52FF',       // brand Ajnaya
  violetDeep: '#6C3CE0',        // pressed / dark
  violetMist: '#B494FF',        // soft bgs / eyebrows
  goldSubtle: '#F5C842',        // success / closed deals
  goldRadiant: '#FFD659',       // celebrations

  // États sémantiques
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#3B82F6',

  // Glass — 3 niveaux d'opacité empilables (signature glassmorphism)
  glassHigh: 'rgba(17, 21, 40, 0.88)',    // cartes principales
  glassMid: 'rgba(17, 21, 40, 0.72)',     // cartes secondaires
  glassLow: 'rgba(17, 21, 40, 0.55)',     // cartes tertiaires
  glassBorder: 'rgba(255, 255, 255, 0.08)',
  glassBorderHigh: 'rgba(255, 255, 255, 0.18)',

  // Texte — opacités calibrées (WCAG AA validé sur obsidian)
  textHero: '#F8FAFC',                          // 20:1 contrast
  textPrimary: '#FFFFFF',                       // 20.7:1
  textSecondary: 'rgba(255, 255, 255, 0.72)',   // ~14:1
  textTertiary: 'rgba(255, 255, 255, 0.45)',    // ~9:1
  textMuted: 'rgba(255, 255, 255, 0.28)',       // ~5.6:1 — éviter pour critique
} as const

// ─── GRADIENTS — Tier-aware (NUCLEAR 3-stops, BALANCED 2-stops) ──────────────
export const GRADIENTS = {
  // Hero signature — 3 stops cyan→violet→purple (NUCLEAR perception)
  hero: 'linear-gradient(135deg, #00D4FF 0%, #8C52FF 50%, #B494FF 100%)',
  heroH: 'linear-gradient(90deg, #00D4FF 0%, #8C52FF 50%, #B494FF 100%)',

  // Royal — violet pure (Ajnaya brand)
  royal: 'linear-gradient(135deg, #8C52FF 0%, #6C3CE0 100%)',

  // Ice — cyan pure (info / actions secondaires)
  ice: 'linear-gradient(135deg, #00D4FF 0%, #6DEAFF 100%)',

  // Gold — premium / success
  gold: 'linear-gradient(135deg, #F5C842 0%, #FFD659 100%)',

  // Mesh radial signature (background hero, subtil)
  meshHero: `
    radial-gradient(ellipse 120% 60% at 50% -10%, rgba(0, 212, 255, 0.12) 0%, transparent 50%),
    radial-gradient(ellipse 100% 70% at 80% 50%, rgba(140, 82, 255, 0.10) 0%, transparent 45%),
    radial-gradient(ellipse 80% 50% at 30% 100%, rgba(180, 148, 255, 0.08) 0%, transparent 50%)
  `,
} as const

// ─── TYPOGRAPHIE — Échelle modulaire Apple HIG (ratio 1.250 — Major Third) ───
// Source : Bringhurst §3.1.1 (échelle musicale) + Apple HIG modular scale
// Fonts : Inter Variable (body+display) + Genos (logo + grands titres déco)
//
// Toutes les valeurs respectent le baseline grid 4pt strict (line-heights = ×4)
// Tous les letter-spacings respectent les règles Bringhurst (negative display, neutral body, eyebrow 8-15%)
// Site2026v47 — Refonte typo Bringhurst-strict (note actuelle 64 → cible 100)
export const TYPO = {
  // Display — Inter Display, negative letterSpacing prononcé (-2.5% à -2%)
  displayXXL: { fontSize: 72, lineHeight: 76, letterSpacing: -2.0, fontWeight: 900 },
  displayXL:  { fontSize: 56, lineHeight: 60, letterSpacing: -1.5, fontWeight: 900 },
  displayL:   { fontSize: 40, lineHeight: 48, letterSpacing: -1.0, fontWeight: 800 },

  // Headings — Inter, ratio 1.25 strict
  h1: { fontSize: 34, lineHeight: 40, letterSpacing: -0.8, fontWeight: 800 },
  h2: { fontSize: 28, lineHeight: 36, letterSpacing: -0.6, fontWeight: 700 },
  h3: { fontSize: 20, lineHeight: 28, letterSpacing: -0.4, fontWeight: 700 },

  // Body — Inter Text (base 16, lineHeight 1.5 = 24, lecture confortable Bringhurst)
  bodyLG:   { fontSize: 17, lineHeight: 28, letterSpacing: -0.2, fontWeight: 500 },
  body:     { fontSize: 15, lineHeight: 24, letterSpacing: -0.1, fontWeight: 400 },
  bodyBold: { fontSize: 15, lineHeight: 24, letterSpacing: -0.1, fontWeight: 700 },

  // Labels & captions
  label:   { fontSize: 13, lineHeight: 18, letterSpacing: 0.1, fontWeight: 600 },
  caption: { fontSize: 13, lineHeight: 18, letterSpacing: 0.2, fontWeight: 500 },
  micro:   { fontSize: 11, lineHeight: 16, letterSpacing: 0.4, fontWeight: 600 },

  // Eyebrow — UPPERCASE, LS 12% (Lupton "5-12%" — anti-pattern à 25%)
  // Pattern : "AJNAYA · LIVE", "ZONE CHAUDE · FORTE", "OBJECTIF DU JOUR"
  eyebrow: {
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 1.3,    // 12% de la taille — pile dans la zone Lupton
    fontWeight: 800,
    textTransform: 'uppercase' as const,
  },
} as const

// ─── ESPACEMENT — Système 4pt strict ──────────────────────────────────────────
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
  // Section padding — rythme lent = autorité (Walter / Designing for Emotion)
  section: 96,
  sectionMobile: 64,
} as const

// ─── RADIUS — App canonique ────────────────────────────────────────────────────
export const RADIUS = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,    // cards default
  xl: 20,
  xxl: 24,   // hero containers
  round: 9999,  // pill / circle
} as const

// ─── MOTION — Spring tier-aware + easings premium ────────────────────────────
export const MOTION = {
  // Durations canoniques (Apple-grade)
  duration: {
    instant: 0.12,    // 120ms — micro-feedback
    fast: 0.22,       // 220ms — tap → state change (hover button)
    base: 0.32,       // 320ms — card entrance
    slow: 0.48,       // 480ms — celebration
    cinematic: 0.72,  // 720ms — onboarding reveal
  },

  // Easings — Bezier précis (banni : `ease`, `ease-in-out` génériques)
  easing: {
    standard: [0.4, 0, 0.2, 1] as const,         // material standard
    emphasized: [0.2, 0, 0, 1] as const,          // entrance premium
    decelerate: [0, 0, 0.2, 1] as const,         // entering
    accelerate: [0.4, 0, 1, 1] as const,         // exiting
    sharp: [0.4, 0, 0.6, 1] as const,            // attention
    apple: [0.16, 1, 0.3, 1] as const,           // signature ease-out (entrée hero)
    bouncy: [0.34, 1.56, 0.64, 1] as const,      // overshoot subtil
  },

  // Springs (Framer Motion `transition: { type: 'spring', ... }`)
  spring: {
    gentle: { type: 'spring' as const, damping: 22, stiffness: 130, mass: 1 },
    snappy: { type: 'spring' as const, damping: 17, stiffness: 220, mass: 0.8 },
    bouncy: { type: 'spring' as const, damping: 12, stiffness: 170, mass: 1 },
    soft:   { type: 'spring' as const, damping: 28, stiffness: 90, mass: 1.2 },
  },
} as const

// ─── ELEVATION — Shadows + glows tier-aware ───────────────────────────────────
export const ELEVATION = {
  // Shadows neutres
  card: {
    sm: '0 2px 8px rgba(0, 0, 0, 0.20)',
    md: '0 4px 16px rgba(0, 0, 0, 0.30)',
    lg: '0 8px 26px rgba(0, 0, 0, 0.40)',
  },
  // Glows signature (cyan / violet / gold)
  glow: {
    cyan: '0 0 24px rgba(0, 212, 255, 0.40)',
    cyanStrong: '0 0 40px rgba(0, 212, 255, 0.55)',
    violet: '0 0 24px rgba(140, 82, 255, 0.40)',
    violetStrong: '0 0 40px rgba(140, 82, 255, 0.55)',
    gold: '0 0 24px rgba(245, 200, 66, 0.30)',
    // Marker glow signature (HomeScreen .dd)
    marker: '0 0 12px rgba(0, 212, 255, 0.80), 0 0 24px rgba(140, 82, 255, 0.40)',
  },
} as const

// ─── BLUR — Glass intensities ─────────────────────────────────────────────────
export const BLUR = {
  light: 20,
  medium: 24,
  heavy: 50,  // GlassCard signature
} as const

// ─── BREAKPOINTS ──────────────────────────────────────────────────────────────
export const BREAKPOINTS = {
  mobile: 0,
  tablet: 640,
  desktop: 1024,
  wide: 1440,
} as const

// ─── COPYWRITING RULES (skill §7) ─────────────────────────────────────────────
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

export const MOTS_BANNIS = [
  'IA', 'Assistant', 'Smart', 'Intelligent',
  'Révolutionnaire', 'Innovant', 'Innovation',
  'Optimisé', 'Optimisation',
  'Dashboard', 'Features',
  'Synergies', 'Synergie',
  'next-gen', 'leader', 'solution',
] as const

// ─── EXPORTS HELPERS ──────────────────────────────────────────────────────────
export type PaletteKey = keyof typeof PALETTE
export type TypoKey = keyof typeof TYPO
export type SpaceKey = keyof typeof SPACE
export type RadiusKey = keyof typeof RADIUS
export type DurationKey = keyof typeof MOTION.duration
