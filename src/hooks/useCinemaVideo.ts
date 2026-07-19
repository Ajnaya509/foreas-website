'use client'

/**
 * Les deux moteurs vidéo des séquences cinéma de /experience.
 * UN SEUL chemin de code pour mobile ET desktop (exigence Chandler : « tout doit fonctionner
 * selon le scroll, que ce soit en desktop ou en mobile »).
 *
 * ⚠️ Les clips « scrub » DOIVENT être ré-encodés GOP 6 + CFR et auto-hébergés dans
 * /public/videos/experience/ — un MP4 normal (1 keyframe, ou GOP 2s comme les rendus Mux)
 * est physiquement inscrubbable : le navigateur ne peut pas décoder une frame arbitraire
 * sans point d'ancrage proche. C'était la vraie cause du « la vidéo ne bouge pas ».
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { useAnimationFrame, type MotionValue } from 'framer-motion'

/* ─── Déverrouillage audio global (un seul geste pour toute la page) ───────────────────────── */
let audioUnlocked = false
const audioListeners = new Set<(v: boolean) => void>()

export function isAudioUnlocked() {
  return audioUnlocked
}

/** Déverrouille le son. À appeler DANS le handler du geste utilisateur (tap sur la pastille). */
export function unlockAudio(el?: HTMLVideoElement | null) {
  audioUnlocked = true
  audioListeners.forEach((fn) => fn(true))
  // « Bénédiction » : une lecture démarrée dans le geste marque l'élément comme autorisé.
  // volume=0 est en LECTURE SEULE sur iOS → on passe par muted/play/pause (< 50ms, inaudible).
  if (el) {
    el.muted = false
    el.play().then(() => { el.pause(); el.currentTime = 0 }).catch(() => { el.muted = true })
  }
}

export function useAudioUnlocked() {
  const [unlocked, setUnlocked] = useState(false)
  useEffect(() => {
    setUnlocked(audioUnlocked)
    audioListeners.add(setUnlocked)
    return () => { audioListeners.delete(setUnlocked) }
  }, [])
  return unlocked
}

/* ─── Callback ref stable qui force `muted` de façon impérative ────────────────────────────── */
/**
 * React ne fiabilise pas l'attribut `muted` à l'hydratation (bug connu react-dom) → Safari iOS
 * voit une vidéo NON muette et bloque tout. On le force sur le nœud réel.
 * `useCallback` OBLIGATOIRE : un callback ref inline se détache/rattache à chaque render,
 * ce qui met `ref.current` à null une frame sur deux (frames de scrub perdues).
 */
export function useMutedVideoRef() {
  const ref = useRef<HTMLVideoElement | null>(null)
  const setRef = useCallback((el: HTMLVideoElement | null) => {
    ref.current = el
    if (el) el.muted = true
  }, [])
  return [ref, setRef] as const
}

/* ─── 1. VIDÉO PILOTÉE PAR LE SCROLL (le doigt est le projecteur) ──────────────────────────── */
interface ScrubOptions {
  /** Fenêtre de progression [début, fin] pendant laquelle le clip se déroule. */
  from: number
  to: number
  /** Images/seconde du clip ré-encodé (pour ne jamais atteindre la durée exacte). */
  fps?: number
  /** Actif seulement quand la section est à l'écran (évite tout travail hors écran). */
  activeRef: React.MutableRefObject<boolean>
}

export function useScrubbedVideo(
  videoRef: React.MutableRefObject<HTMLVideoElement | null>,
  progress: MotionValue<number>,
  { from, to, fps = 30, activeRef }: ScrubOptions,
) {
  useAnimationFrame(() => {
    if (!activeRef.current) return
    const v = videoRef.current
    if (!v) return
    // readyState < 2 : aucune frame décodable. seeking : un seek est déjà en vol — écrire
    // currentTime pendant un seek fait s'effondrer le décodeur (saccades / gel).
    if (v.readyState < 2 || v.seeking) return
    const dur = v.duration
    if (!Number.isFinite(dur) || dur <= 0) return

    const p = progress.get()
    const ratio = Math.min(1, Math.max(0, (p - from) / (to - from)))
    // Jamais la durée exacte : `ended` peut afficher une frame noire sur Safari.
    const target = ratio * Math.max(0, dur - 1 / fps)
    // Zone morte d'une frame : évite un seek à chaque pixel de scroll.
    if (Math.abs(v.currentTime - target) > 1 / fps) v.currentTime = target
  })
}

/* ─── 2. CLIP DÉCLENCHÉ PAR LE SCROLL (joue une fois, gèle sur sa dernière image) ───────────── */
interface TriggerOptions {
  /** Progression à laquelle le clip se déclenche. */
  at: number
  /** En remontant sous ce seuil, le clip se réarme (hystérésis anti-clignotement). */
  rearmAt: number
  activeRef: React.MutableRefObject<boolean>
}

export function useScrollTriggeredClip(
  videoRef: React.MutableRefObject<HTMLVideoElement | null>,
  progress: MotionValue<number>,
  { at, rearmAt, activeRef }: TriggerOptions,
) {
  const fired = useRef(false)
  const retryRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    // Gel sur la dernière image plutôt qu'un retour à l'image 0 (ou une frame noire iOS).
    const onEnded = () => {
      v.currentTime = Math.max(0, v.duration - 0.05)
      v.pause()
    }
    v.addEventListener('ended', onEnded)
    return () => {
      v.removeEventListener('ended', onEnded)
      if (retryRef.current) {
        window.removeEventListener('touchstart', retryRef.current)
        window.removeEventListener('pointerdown', retryRef.current)
      }
    }
  }, [videoRef])

  useAnimationFrame(() => {
    if (!activeRef.current) return
    const v = videoRef.current
    if (!v) return
    const p = progress.get()

    if (!fired.current && p >= at) {
      fired.current = true
      v.muted = !isAudioUnlocked()
      v.currentTime = 0
      v.play().catch(() => {
        // Mode économie d'énergie iOS / Data Saver : on retente au premier geste réel.
        const retry = () => { v.play().catch(() => {}) }
        retryRef.current = retry
        window.addEventListener('touchstart', retry, { once: true })
        window.addEventListener('pointerdown', retry, { once: true })
      })
    } else if (fired.current && p < rearmAt) {
      fired.current = false
      v.pause()
      v.muted = true
      v.currentTime = 0
    }
  })

  /** Coupe le clip (utilisé quand le clip suivant prend la scène : jamais deux sons). */
  const silence = useCallback(() => {
    const v = videoRef.current
    if (!v) return
    v.pause()
    v.muted = true
  }, [videoRef])

  return { silence }
}

/* ─── 3. Section active + reprise après retour d'app ───────────────────────────────────────── */
/**
 * `activeRef` coupe tout travail par frame hors écran. La branche `visible` est OBLIGATOIRE :
 * sans elle, un simple appel entrant met la vidéo en pause… définitivement (l'observer ne
 * re-déclenche pas, l'intersection n'ayant pas changé). Cas très fréquent chez un chauffeur.
 */
export function useSectionActive(
  sectionRef: React.RefObject<HTMLElement | null>,
  onVisibleAgain?: () => void,
) {
  const activeRef = useRef(false)
  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        // Dernière entrée = état réel après un défilement rapide (les entrées sont groupées).
        const e = entries[entries.length - 1]
        activeRef.current = e.isIntersecting
      },
      { rootMargin: '200px 0px' },
    )
    io.observe(el)
    const onVis = () => {
      if (document.visibilityState === 'visible' && activeRef.current) onVisibleAgain?.()
    }
    document.addEventListener('visibilitychange', onVis)
    return () => { io.disconnect(); document.removeEventListener('visibilitychange', onVis) }
  }, [sectionRef, onVisibleAgain])
  return activeRef
}

/* ─── 4. Préchargement à l'approche (jamais au chargement de la page) ──────────────────────── */
export function useNearbyPreload(
  sectionRef: React.RefObject<HTMLElement | null>,
  videoRefs: React.MutableRefObject<HTMLVideoElement | null>[],
) {
  const loaded = useRef(false)
  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        const e = entries[entries.length - 1]
        if (e.isIntersecting && !loaded.current) {
          loaded.current = true
          videoRefs.forEach((r) => {
            const v = r.current
            if (v && v.preload !== 'auto') { v.preload = 'auto'; v.load() }
          })
        }
      },
      { rootMargin: '900px 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionRef])
}
