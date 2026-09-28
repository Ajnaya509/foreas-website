'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import { ArrowUpRight, Play, X } from 'lucide-react'
import ForeasLogo from '@/components/experience/ForeasLogo'
import { ESSAI_JOURS } from '@/lib/offre'
import { mesurer } from '@/lib/mesure'
import { useAnyOverlayOpen, useOverlayLock } from '@/lib/overlayStore'
import s from './exit-invitation.module.css'

const SEEN_KEY = 'foreas_exit_invitation_seen'
export const COURSE_DEMO_SEEN_KEY = 'foreas_course_demo_seen'
export const OPEN_COURSE_DEMO = 'foreas:open-course-demo'
type Surface = 'home' | 'driver'
type Trigger = 'desktop_exit' | 'mobile_return' | 'preview'

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
    let pointerDown = false
    let idleTimer: ReturnType<typeof setTimeout> | undefined
    let previewTimer: ReturnType<typeof setInterval> | undefined

    const visibleMilliseconds = () => visibleTime + (visibleSince ? Date.now() - visibleSince : 0)
    const canOpen = () => {
      if (used || engaged || document.hidden || blocked.current) return false
      if (!preview.current && (hasSeen(SEEN_KEY) || (surface === 'home' && hasSeen(COURSE_DEMO_SEEN_KEY)))) return false
      if (document.querySelector('dialog[open], [aria-modal="true"], .voile-de-marque')) return false
      if (document.activeElement?.closest('input, textarea, select, [contenteditable="true"]')) return false
      const banner = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--consent-banner-h')) || 0
      if (banner > 0) return false
      return !Array.from(document.querySelectorAll<HTMLMediaElement>('video, audio')).some(media => !media.paused && !media.ended)
    }
    const show = (source: Trigger) => {
      if (!canOpen()) return
      used = true
      clearInterval(previewTimer)
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
      clearTimeout(idleTimer)
    }
    const onPointerMove = (event: PointerEvent) => { if (event.clientY > 80) movedInside = true }
    const onMouseLeave = (event: MouseEvent) => {
      if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return
      if (event.clientY <= 8 && movedInside && visibleMilliseconds() >= 25000) show('desktop_exit')
    }
    const scheduleMobile = () => {
      clearTimeout(idleTimer)
      if (!mobileCandidate || pointerDown) return
      idleTimer = setTimeout(() => {
        if (!pointerDown && mobileCandidate && visibleMilliseconds() >= 45000) show('mobile_return')
      }, 1800)
    }
    const onScroll = () => {
      if (!matchMedia('(pointer: coarse)').matches || used) return
      const y = Math.max(0, window.scrollY)
      maxScroll = Math.max(maxScroll, y)
      upwardDistance = y < lastScroll ? upwardDistance + lastScroll - y : 0
      if (y > lastScroll) mobileCandidate = false
      // Mobile : retour vers le haut après lecture, puis arrêt du geste.
      if (maxScroll >= innerHeight && upwardDistance >= 160 && y < innerHeight * .65) mobileCandidate = true
      lastScroll = y
      scheduleMobile()
    }
    const onPointerDown = () => { pointerDown = true; clearTimeout(idleTimer) }
    const onPointerUp = () => { pointerDown = false; scheduleMobile() }
    const onNavigate = (event: MouseEvent) => {
      const link = (event.target as Element | null)?.closest('a[href]')
      if (link && !link.getAttribute('href')?.startsWith('#')) {
        engaged = true
        clearTimeout(idleTimer)
      }
    }
    const onMediaPlay = (event: Event) => {
      if (event.target instanceof HTMLVideoElement) { engaged = true; clearTimeout(idleTimer) }
    }

    // Accès direct pour montrer le résultat, sans consommation de la session ni mesure.
    previewTimer = preview.current ? setInterval(() => show('preview'), 700) : undefined
    document.addEventListener('visibilitychange', onVisibility)
    document.addEventListener('pointermove', onPointerMove, { passive: true })
    document.documentElement.addEventListener('mouseleave', onMouseLeave)
    window.addEventListener('scroll', onScroll, { passive: true })
    document.addEventListener('pointerdown', onPointerDown, { passive: true })
    document.addEventListener('pointerup', onPointerUp, { passive: true })
    document.addEventListener('pointercancel', onPointerUp, { passive: true })
    document.addEventListener('click', onNavigate, true)
    document.addEventListener('play', onMediaPlay, true)
    return () => {
      clearInterval(previewTimer)
      clearTimeout(idleTimer)
      document.removeEventListener('visibilitychange', onVisibility)
      document.removeEventListener('pointermove', onPointerMove)
      document.documentElement.removeEventListener('mouseleave', onMouseLeave)
      window.removeEventListener('scroll', onScroll)
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('pointerup', onPointerUp)
      document.removeEventListener('pointercancel', onPointerUp)
      document.removeEventListener('click', onNavigate, true)
      document.removeEventListener('play', onMediaPlay, true)
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
    data-exit-invitation={surface} aria-labelledby="exit-invitation-title" aria-describedby="exit-invitation-description"
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
        {isDriver ? <a className={s.primary} data-invitation-primary href={href} onClick={() => track('discover_trial')}>Commencer mes {ESSAI_JOURS} jours Pro gratuits <ArrowUpRight size={20} aria-hidden="true"/></a>
          : <button className={s.primary} data-invitation-primary type="button" onClick={watchDemo}><Play size={17} fill="currentColor" aria-hidden="true"/>Voir ce que le prix cache</button>}
        <p className={s.note}>{isDriver ? 'Conditions et tarif présentés avant de commencer.' : 'La démonstration, ici. Sans inscription.'}</p>
        <button className={s.later} type="button" onClick={dismiss}>Continuer ma visite</button>
      </div>
    </div>}
  </dialog>, document.body)
}
