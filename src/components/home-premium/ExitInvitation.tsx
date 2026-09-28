'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import { ArrowUpRight, Play, X } from 'lucide-react'
import ForeasLogo from '@/components/experience/ForeasLogo'
import ActivityGlassReflection from './ActivityGlassReflection'
import { ESSAI_JOURS } from '@/lib/offre'
import { mesurer } from '@/lib/mesure'
import { useAnyOverlayOpen, useOverlayLock } from '@/lib/overlayStore'
import s from './exit-invitation.module.css'

const SEEN_KEY = 'foreas_exit_invitation_seen'
export const COURSE_DEMO_SEEN_KEY = 'foreas_course_demo_seen'
export const OPEN_COURSE_DEMO = 'foreas:open-course-demo'
type Surface = 'home' | 'driver'
type Trigger = 'desktop_exit' | 'mobile_return' | 'mobile_pause' | 'preview'

function hasSeen(key: string) {
  try { return sessionStorage.getItem(key) === '1' } catch { return false }
}

/** Une aide contextuelle. Aucun ajout à l'historique, aucun blocage du départ. */
export default function ExitInvitation({ surface = 'home' }: { surface?: Surface }) {
  const [mounted, setMounted] = useState(false)
  const [open, setOpen] = useState(false)
  const [closing, setClosing] = useState(false)
  const [href, setHref] = useState('/tarifs3')
  const dialog = useRef<HTMLDialogElement>(null)
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const preview = useRef(false)
  const trigger = useRef<Trigger>('desktop_exit')
  const otherOverlay = useAnyOverlayOpen()
  const blocked = useRef(otherOverlay)
  blocked.current = otherOverlay
  useOverlayLock(open)

  const track = useCallback((action: string) => {
    if (preview.current) return
    mesurer(action === 'open' ? 'IntentSelected' : 'PrimaryCTAClick', {
      page: surface === 'home' ? '/' : '/chauffeur',
      intention: 'rentabilite', audience: 'chauffeur', variante: 'invitation-sortie',
      detail: { action, surface, trigger: trigger.current },
    }, { essentiel: false })
  }, [surface])

  useEffect(() => {
    setMounted(true)
    const search = new URLSearchParams(location.search)
    preview.current = search.get('apercu-sortie') === '1'
    const destination = new URL('/tarifs3', location.origin)
    for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'ref', 'partner']) {
      const value = search.get(key)
      if (value) destination.searchParams.set(key, value.slice(0, 120))
    }
    setHref(destination.pathname + destination.search)
    if (!preview.current && hasSeen(SEEN_KEY)) return

    let used = false
    let engaged = false
    let movedInside = false
    let visibleSince = document.hidden ? 0 : Date.now()
    let visibleTime = 0
    let maxScroll = window.scrollY
    let lastScroll = window.scrollY
    let upwardDistance = 0
    let mobileCandidate = false
    let touchInput = false
    let pointerDown = false
    let lastInteractionAt = Date.now()
    let mobileTimer: ReturnType<typeof setInterval> | undefined
    let previewTimer: ReturnType<typeof setInterval> | undefined

    const visibleMilliseconds = () => visibleTime + (visibleSince ? Date.now() - visibleSince : 0)
    const canOpen = () => {
      if (used || engaged || document.hidden || blocked.current) return false
      if (!preview.current && (hasSeen(SEEN_KEY) || (surface === 'home' && hasSeen(COURSE_DEMO_SEEN_KEY)))) return false
      if (document.querySelector('dialog[open], [aria-modal="true"], .voile-de-marque')) return false
      if (document.activeElement?.closest('input, textarea, select, [contenteditable="true"]')) return false
      const banner = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--consent-banner-h')) || 0
      if (banner > 0) return false
      // Les animations muettes sans commandes font partie du décor.
      // Une vraie vidéo ou un son en lecture garde la priorité sur l'invitation.
      return !Array.from(document.querySelectorAll<HTMLMediaElement>('video, audio'))
        .some(media => !media.paused && !media.ended && (!media.muted || media.controls))
    }
    const show = (source: Trigger) => {
      if (!canOpen()) return
      used = true
      clearInterval(previewTimer)
      clearInterval(mobileTimer)
      trigger.current = source
      if (!preview.current) {
        try { sessionStorage.setItem(SEEN_KEY, '1') } catch { /* Session privée. */ }
      }
      setOpen(true)
      track('open')
    }
    const onVisibility = () => {
      if (document.hidden) {
        visibleTime += visibleSince ? Date.now() - visibleSince : 0
        visibleSince = 0
      } else visibleSince = Date.now()
      mobileCandidate = false
      lastInteractionAt = Date.now()
    }
    const onPointerMove = (event: PointerEvent) => { if (event.clientY > 80) movedInside = true }
    const onMouseLeave = (event: MouseEvent) => {
      if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return
      if (event.clientY <= 8 && movedInside && visibleMilliseconds() >= 25000) show('desktop_exit')
    }
    const isTouchVisit = () => touchInput || matchMedia('(any-pointer: coarse)').matches
    const checkMobile = () => {
      if (used || engaged || hasSeen(SEEN_KEY) || (surface === 'home' && hasSeen(COURSE_DEMO_SEEN_KEY))) {
        clearInterval(mobileTimer)
        return
      }
      if (!isTouchVisit() || document.hidden || pointerDown || maxScroll < innerHeight) return
      if (visibleMilliseconds() < 45000) return
      // Réévaluation après le délai, la fin d'une vidéo ou la fermeture d'un
      // autre panneau : une occasion momentanément bloquée n'est plus perdue.
      const pauseMs = mobileCandidate ? 1800 : 3500
      if (Date.now() - lastInteractionAt >= pauseMs) show(mobileCandidate ? 'mobile_return' : 'mobile_pause')
    }
    const onScroll = () => {
      if (used) return
      const y = Math.max(0, window.scrollY)
      maxScroll = Math.max(maxScroll, y)
      upwardDistance = y < lastScroll ? upwardDistance + lastScroll - y : 0
      if (y > lastScroll) mobileCandidate = false
      // Une remontée n'a pas besoin d'atteindre le haut d'une longue page.
      if (upwardDistance >= 160) mobileCandidate = true
      lastScroll = y
      lastInteractionAt = Date.now()
    }
    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType === 'touch') touchInput = true
      pointerDown = true
      lastInteractionAt = Date.now()
    }
    const onPointerUp = () => { pointerDown = false; lastInteractionAt = Date.now() }
    const onInteraction = () => { lastInteractionAt = Date.now() }
    const onNavigate = (event: MouseEvent) => {
      const link = (event.target as Element | null)?.closest('a[href]')
      if (link && !link.getAttribute('href')?.startsWith('#')) {
        engaged = true
        clearInterval(mobileTimer)
      }
    }

    // Accès direct pour montrer le résultat, sans consommation de la session ni mesure.
    previewTimer = preview.current ? setInterval(() => show('preview'), 700) : undefined
    mobileTimer = preview.current ? undefined : setInterval(checkMobile, 500)
    document.addEventListener('visibilitychange', onVisibility)
    document.addEventListener('pointermove', onPointerMove, { passive: true })
    document.documentElement.addEventListener('mouseleave', onMouseLeave)
    window.addEventListener('scroll', onScroll, { passive: true })
    document.addEventListener('pointerdown', onPointerDown, { passive: true })
    document.addEventListener('pointerup', onPointerUp, { passive: true })
    document.addEventListener('pointercancel', onPointerUp, { passive: true })
    document.addEventListener('click', onNavigate, true)
    document.addEventListener('play', onInteraction, true)
    document.addEventListener('pause', onInteraction, true)
    document.addEventListener('ended', onInteraction, true)
    document.addEventListener('input', onInteraction, true)
    document.addEventListener('focusout', onInteraction, true)
    return () => {
      clearInterval(previewTimer)
      clearInterval(mobileTimer)
      document.removeEventListener('visibilitychange', onVisibility)
      document.removeEventListener('pointermove', onPointerMove)
      document.documentElement.removeEventListener('mouseleave', onMouseLeave)
      window.removeEventListener('scroll', onScroll)
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('pointerup', onPointerUp)
      document.removeEventListener('pointercancel', onPointerUp)
      document.removeEventListener('click', onNavigate, true)
      document.removeEventListener('play', onInteraction, true)
      document.removeEventListener('pause', onInteraction, true)
      document.removeEventListener('ended', onInteraction, true)
      document.removeEventListener('input', onInteraction, true)
      document.removeEventListener('focusout', onInteraction, true)
    }
  }, [surface, track])

  useEffect(() => {
    if (!open || !dialog.current) return
    const element = dialog.current
    const previousFocus = document.activeElement as HTMLElement | null
    const previousOverflow = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'
    element.showModal()
    element.querySelector<HTMLElement>('[data-invitation-primary]')?.focus({ preventScroll: true })
    return () => {
      element.close()
      document.documentElement.style.overflow = previousOverflow
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true })
    }
  }, [open])

  useEffect(() => () => { if (timeout.current) clearTimeout(timeout.current) }, [])

  function dismiss() {
    if (closing) return
    setClosing(true)
    timeout.current = setTimeout(() => {
      setOpen(false)
      setClosing(false)
    }, matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 240)
  }
  function watchDemo() {
    track('watch_demo')
    // Fermer d'abord restitue immédiatement l'interaction à la vidéo dans la page.
    dialog.current?.close()
    setOpen(false)
    window.dispatchEvent(new Event(OPEN_COURSE_DEMO))
  }

  if (!mounted) return null
  const isDriver = surface === 'driver'
  return createPortal(<dialog ref={dialog} className={`${s.dialog} ${closing ? s.closing : ''}`}
    data-exit-invitation={surface} data-invitation-trigger={trigger.current} aria-labelledby="exit-invitation-title" aria-describedby="exit-invitation-description"
    onCancel={event => { event.preventDefault(); dismiss() }}
    onClick={event => {
      const rect = event.currentTarget.getBoundingClientRect()
      if (event.target === event.currentTarget && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) dismiss()
    }}>
    {open && <div className={s.layout}>
      <button className={s.close} type="button" aria-label="Fermer cette invitation" onClick={dismiss}><X size={20} aria-hidden="true"/></button>
      <div className={s.visual} aria-hidden="true">
        <ForeasLogo className={s.logo}/>
        <div className={s.halo}/>
        <div className={`${s.phone} ${isDriver ? s.rotato : ''}`}>
          <Image src={isDriver ? '/media/home/foreas-rotato.webp' : '/media/home/course-poster.webp'} alt="" width={isDriver ? 610 : 1600} height={isDriver ? 1195 : 1200} sizes="(max-width: 600px) 190px, 320px"/>
        </div>
        <span className={s.visualCaption}>{isDriver ? 'TON ACTIVITÉ. TES DÉCISIONS.' : 'VERDICT INSTANT · DÉMONSTRATION'}</span>
      </div>
      <div className={s.content}>
        <p className={s.eyebrow}>{isDriver ? `FOREAS PRO · ${ESSAI_JOURS} JOURS D’ESSAI` : 'FOREAS DRIVER, EN ACTION'}</p>
        <h2 id="exit-invitation-title">{isDriver ? <>Ton temps mérite<br/><span>les bonnes courses.</span></> : <>Avant d’accepter.<br/><span>Vois ce qu’il reste.</span></>}</h2>
        <p id="exit-invitation-description" className={s.description}>{isDriver
          ? 'Le temps. L’approche. Tes frais. Teste FOREAS Pro sur tes propres courses pour choisir avec tes chiffres.'
          : 'Le prix attire. Le temps et les frais font la différence. Vois comment FOREAS estime ce qu’une course te laisse.'}</p>
        {isDriver ? <a className={s.primary} data-invitation-primary href={href} onClick={() => track('discover_trial')}><ActivityGlassReflection borderRadius={14}/><span>Commencer mes {ESSAI_JOURS} jours Pro gratuits</span><ArrowUpRight size={20} aria-hidden="true"/></a>
          : <button className={s.primary} data-invitation-primary type="button" onClick={watchDemo}><ActivityGlassReflection borderRadius={14}/><Play size={17} fill="currentColor" aria-hidden="true"/><span>Voir ce que le prix cache</span></button>}
        <p className={s.note}>{isDriver ? 'Conditions et tarif présentés avant de commencer.' : 'La démonstration, ici. Sans inscription.'}</p>
        <button className={s.later} type="button" onClick={dismiss}>Continuer ma visite</button>
      </div>
    </div>}
  </dialog>, document.body)
}
