'use client'

/**
 * AppleNoirBackground — fond noir profond + halos diffus (WEB)
 *
 * Reproduit À L'IDENTIQUE le composant de l'app FOREAS-Clean
 * (src/components/concierge/AppleNoirBackground.tsx) pour la cohésion de marque :
 *   1. Fond noir Apple absolu #000000
 *   2. 3 halos radiaux diffus (TL couleur dominante, TR complémentaire, bas profondeur)
 *      — le halo TL respire 1.8s (autorisé sur AppleNoir, cf. MASTER R2)
 *   3. Le micro-grain est déjà géré globalement par <GrainOverlay/> (layout)
 *
 * Variants d'humeur identiques à l'app : violet (défaut) / cyan / duo / warm / pulse.
 * Usage : <AppleNoirBackground variant="violet" /> en 1er enfant d'un conteneur `relative`.
 */

export type AppleNoirVariant = 'violet' | 'cyan' | 'duo' | 'warm' | 'pulse'

type HaloCfg = { tl: string; tr: string; bottom: string; fast?: boolean }

const VARIANTS: Record<AppleNoirVariant, HaloCfg> = {
  violet: { tl: 'rgba(140,82,255,0.22)', tr: 'rgba(0,212,255,0.14)', bottom: 'rgba(140,82,255,0.10)' },
  cyan:   { tl: 'rgba(0,212,255,0.22)',  tr: 'rgba(140,82,255,0.12)', bottom: 'rgba(0,212,255,0.08)' },
  duo:    { tl: 'rgba(140,82,255,0.18)', tr: 'rgba(0,212,255,0.18)',  bottom: 'rgba(140,82,255,0.07)' },
  warm:   { tl: 'rgba(140,82,255,0.18)', tr: 'rgba(255,102,153,0.14)', bottom: 'rgba(140,82,255,0.10)' },
  pulse:  { tl: 'rgba(140,82,255,0.24)', tr: 'rgba(0,212,255,0.16)',  bottom: 'rgba(140,82,255,0.10)', fast: true },
}

export default function AppleNoirBackground({
  variant = 'violet',
  /** true = fond fixe plein écran (page immersive) ; false = absolu dans le parent relative */
  fixed = false,
}: {
  variant?: AppleNoirVariant
  fixed?: boolean
}) {
  const c = VARIANTS[variant]
  const pulse = c.fast ? 'animate-halo-pulse-fast' : 'animate-halo-pulse'
  return (
    <div
      aria-hidden="true"
      className={`${fixed ? 'fixed' : 'absolute'} inset-0 -z-10 overflow-hidden pointer-events-none`}
      style={{ backgroundColor: '#000000' }}
    >
      {/* Halo TOP-LEFT — couleur dominante, respire 1.8s (0.9s en variant pulse) */}
      <div
        className={`absolute rounded-full ${pulse}`}
        style={{
          top: '-28%', left: '-22%', width: '85vw', height: '85vw',
          background: `radial-gradient(circle at 50% 50%, ${c.tl} 0%, transparent 70%)`,
          filter: 'blur(44px)', willChange: 'opacity',
        }}
      />
      {/* Halo TOP-RIGHT — complémentaire, statique */}
      <div
        className="absolute rounded-full"
        style={{
          top: '-16%', right: '-26%', width: '72vw', height: '72vw',
          background: `radial-gradient(circle at 50% 50%, ${c.tr} 0%, transparent 70%)`,
          filter: 'blur(52px)',
        }}
      />
      {/* Halo BAS — rappel de profondeur, statique */}
      <div
        className="absolute rounded-full"
        style={{
          bottom: '-30%', left: '-12%', width: '95vw', height: '70vw',
          background: `radial-gradient(circle at 50% 50%, ${c.bottom} 0%, transparent 70%)`,
          filter: 'blur(60px)',
        }}
      />
    </div>
  )
}
