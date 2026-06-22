'use client'

/**
 * AjnayaMascot — emplacement de la mascotte animée Ajnaya (MascotBot / Rive).
 *
 * ÉTAT : INERTE par défaut (build-safe). Rend `null` tant que :
 *   - le SDK privé MascotBot n'est pas installé (registre privé, après abonnement), et
 *   - `NEXT_PUBLIC_MASCOTBOT_ENABLED !== '1'`.
 *
 * → Aucune dépendance importée ici pour l'instant : le `next build` / typecheck restent verts,
 *   l'orbe actuelle continue de servir de fallback dans AjnayaWidget.
 *
 * Pour ACTIVER : voir docs/MASCOTBOT_AJNAYA_INTEGRATION.md (install .tgz, env, /ajnaya-mascot.riv),
 * puis décommenter le bloc template ci-dessous et retirer le `return null`.
 *
 * Voix : on NE met PAS de clé ElevenLabs côté client. Le lip-sync est nourri par l'audio Koraly
 * déjà joué par le widget (prop `speaking` = isAudioPlaying), via useProcessAudio en audio manuel.
 */

export interface AjnayaMascotProps {
  /** Ouvre le chat au clic sur la mascotte. */
  onOpen: () => void
  /** true quand la voix Koraly parle → pilote l'input Rive `is_speaking` (lip-sync). */
  speaking?: boolean
}

const ENABLED = process.env.NEXT_PUBLIC_MASCOTBOT_ENABLED === '1'

export default function AjnayaMascot(_props: AjnayaMascotProps) {
  // Tant que le SDK privé n'est pas installé + activé, on ne rend rien (fallback orbe assuré côté widget).
  if (!ENABLED) return null

  // ─── TEMPLATE À ACTIVER (décommenter après `npm i` du SDK MascotBot) ──────────────
  //
  // import { MascotProvider, useProcessAudio, useMascotInputs } from '@mascotbot/react'
  // import { Mascot, Fit, Alignment } from '@mascotbot/react/rive'
  //
  // const { setBoolean, fireTrigger } = useMascotInputs()       // pilote la state machine
  // useEffect(() => { setBoolean('is_speaking', !!_props.speaking) }, [_props.speaking])
  // // coucou au montage (scroll-into-view géré par AjnayaWidget) :
  // useEffect(() => { const t = setTimeout(() => fireTrigger('emerge'), 1200); return () => clearTimeout(t) }, [])
  //
  // // lip-sync : récupérer le blob audio Koraly (lib/tts.ts) et le pousser en audio manuel
  // // useProcessAudio(koralyAudioStream, { naturalLipSync: true })
  //
  // return (
  //   <button onClick={_props.onOpen} aria-label="Parler à Ajnaya" className="w-[120px] h-[120px]">
  //     <MascotProvider apiKey={process.env.NEXT_PUBLIC_MASCOTBOT_API_KEY!}>
  //       <Mascot src="/ajnaya-mascot.riv" stateMachine="Ajnaya" fit={Fit.Contain} alignment={Alignment.BottomCenter} />
  //     </MascotProvider>
  //   </button>
  // )

  return null
}
