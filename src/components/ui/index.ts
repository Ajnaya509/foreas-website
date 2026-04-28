/**
 * FOREAS UI v43 — Barrel exports
 *
 * Source de vérité : `src/design/tokens.ts` (mirror app v110 tokens.v2.ts)
 * Skill : `~/FOREAS-Clean/.claude/skills/foreas-mobile-design.md` v1.0
 *
 * Pattern d'import (toujours) :
 *   import { HeroNarrative, GlassCard, InkGradientButton, EyebrowLabel } from '@/components/ui'
 *   import { PALETTE, TYPO, SPACE, RADIUS, MOTION } from '@/design/tokens'
 */

// Typography
export { EyebrowLabel, type EyebrowColor, type EyebrowLabelProps } from './EyebrowLabel'
export { GradientText, type GradientVariant, type GradientTextProps } from './GradientText'

// Layout / Narrative
export { HeroNarrative, type HeroNarrativeProps } from './HeroNarrative'
export { SectionHeader, type SectionHeaderProps } from './SectionHeader'

// Cards
export { GlassCard, type GlassLevel, type GlassGlow, type GlassRadius, type GlassCardProps } from './GlassCard'

// Buttons
export { InkGradientButton, type InkVariant, type InkSize } from './InkGradientButton'
export { Button, type ButtonVariant, type ButtonSize } from './Button'

// Animations
export { AnimatedCounter, type AnimatedCounterProps } from './AnimatedCounter'
export { MarkerPulse, type MarkerPulseProps } from './MarkerPulse'

// ─── v51 Apple-grade depth system ────────────────────────────────────────────
export { DepthBackground, type DepthVariant } from './DepthBackground'
export { GlassPanel, type GlassLevel as GlassPanelLevel, type GlassGlow as GlassPanelGlow } from './GlassPanel'
export { AppleCTA, type AppleCTAVariant, type AppleCTASize } from './AppleCTA'
export { SpotlightCard, type SpotlightColor } from './SpotlightCard'
