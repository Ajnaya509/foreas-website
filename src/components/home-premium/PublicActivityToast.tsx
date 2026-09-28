'use client'

import { ArrowRight, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import ActivityGlassReflection from './ActivityGlassReflection'
import { ACTIVITY_KINDS, activityPhrase, carnetEvents, previewEvents, type ActivityEvent, type ActivitySurface } from './activityCopy'
import s from './public-activity.module.css'

const FIRST_MS = 5000
const DISPLAY_MS = 7000
const FADE_MS = 700
const REST_MS = 2200
const DISMISSED_KEY = 'foreas_activity_dismissed'
type Phase = 'waiting' | 'show' | 'leave' | 'rest'

export default function PublicActivityToast({ surface = 'home' }: { surface?: ActivitySurface }) {
  const [events, setEvents] = useState<ActivityEvent[]>([])
  const [index, setIndex] = useState(0)
  const [phase, setPhase] = useState<Phase>('waiting')
  const [dismissed, setDismissed] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const [tabVisible, setTabVisible] = useState(true)
  const audio = useRef<AudioContext | null>(null)
  const preview = useRef(false)

  useEffect(() => {
    preview.current = /^(localhost|127\.0\.0\.1)$/.test(location.hostname)
      && new URLSearchParams(location.search).get('apercu-notifications') === '1'
    if (preview.current) { setEvents(previewEvents(surface)); return }
    try {
      if (sessionStorage.getItem(DISMISSED_KEY) === '1') { setDismissed(true); return }
    } catch { /* La navigation privée ne bloque pas l’affichage. */ }
    const controller = new AbortController()
    void fetch('/api/activite-publique', { signal: controller.signal, cache: 'no-store' })
      .then(response => response.ok ? response.json() : { events: [] })
      .then((payload: { events?: ActivityEvent[] }) => {
        if (controller.signal.aborted) return
        const verified = (payload.events ?? []).filter(event => !!event.id && ACTIVITY_KINDS.includes(event.kind)
          && (surface === 'home' || event.kind === 'app_page_opened'))
        setEvents(verified.length ? verified : carnetEvents(surface))
      })
      .catch(() => { if (!controller.signal.aborted) setEvents(carnetEvents(surface)) })
    return () => controller.abort()
  }, [surface])

  useEffect(() => {
    const update = () => {
      setTabVisible(!document.hidden)
      if (document.hidden) { setHovered(false); setFocused(false) }
    }
    update()
    document.addEventListener('visibilitychange', update)
    return () => document.removeEventListener('visibilitychange', update)
  }, [])

  useEffect(() => {
    if (!events.length || dismissed || !tabVisible || ((hovered || focused) && phase === 'show')) return
    const delay = phase === 'waiting' ? (preview.current ? 900 : FIRST_MS)
      : phase === 'show' ? DISPLAY_MS : phase === 'leave' ? FADE_MS : REST_MS
    const timer = window.setTimeout(() => {
      if (phase === 'waiting') setPhase('show')
      else if (phase === 'show') setPhase('leave')
      else if (phase === 'leave') setPhase('rest')
      else { setIndex(value => (value + 1) % events.length); setPhase('show') }
    }, delay)
    return () => window.clearTimeout(timer)
  }, [events.length, dismissed, tabVisible, hovered, focused, phase, index])

  useEffect(() => {
    // Le son est préparé au premier geste et joué uniquement avec une notification.
    const unlock = () => {
      try {
        if (localStorage.getItem('foreas_intro_sound') === 'off') return
        audio.current ??= new AudioContext()
        void audio.current.resume().catch(() => {})
      } catch { /* Le visuel reste autonome. */ }
    }
    window.addEventListener('pointerdown', unlock, { once: true, passive: true })
    window.addEventListener('keydown', unlock, { once: true })
    return () => {
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
      void audio.current?.close()
      audio.current = null
    }
  }, [])

  useEffect(() => {
    const context = audio.current
    if (phase !== 'show' || dismissed || document.hidden || !context || context.state !== 'running') return
    const note = context.createOscillator()
    const gain = context.createGain()
    const now = context.currentTime
    note.type = 'sine'
    note.frequency.setValueAtTime(880, now)
    note.frequency.exponentialRampToValueAtTime(1174, now + .15)
    gain.gain.setValueAtTime(.0001, now)
    gain.gain.exponentialRampToValueAtTime(.015, now + .025)
    gain.gain.exponentialRampToValueAtTime(.0001, now + .22)
    note.connect(gain).connect(context.destination)
    note.start(now)
    note.stop(now + .24)
    note.onended = () => { note.disconnect(); gain.disconnect() }
  }, [phase, index, dismissed])

  if (dismissed || !tabVisible || (phase !== 'show' && phase !== 'leave')) return null
  const event = events[index]
  if (!event) return null
  const phrase = activityPhrase(surface, event, index)
  const split = phrase.indexOf('. ')
  const heading = split < 0 ? phrase : phrase.slice(0, split)
  const benefit = split < 0 ? '' : phrase.slice(split + 2)
  const name = event.name || (event.kind === 'partner_account_activated' ? 'Un partenaire' : 'Un chauffeur')
  const action = heading.startsWith(name) ? heading.slice(name.length).trim() : heading
  const destination = surface === 'driver' ? '/tarifs3'
    : event.kind === 'partner_account_activated' ? '/partenaire'
    : event.kind === 'booking_site_published' ? '/chauffeur#vitrine' : '/chauffeur'
  const label = surface === 'driver' ? 'Découvrir les 3 jours Pro'
    : event.kind === 'partner_account_activated' ? 'Découvrir le programme'
    : event.kind === 'booking_site_published' ? 'Découvrir mon site' : 'Découvrir l’application'

  function dismiss() {
    setDismissed(true)
    if (!preview.current) {
      try { sessionStorage.setItem(DISMISSED_KEY, '1') } catch {}
    }
  }

  return <aside key={`${surface}-${index}`} data-foreas-notification="glass-v2" data-phase={phase}
    className={`${s.notification} ${phase === 'leave' ? s.leaving : ''}`} aria-label={phrase}
    onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
    onFocusCapture={() => setFocused(true)}
    onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false) }}>
    <ActivityGlassReflection durationMs={6000} intensity={.94}/>
    <span className={s.avatar} aria-hidden="true">{event.name?.slice(0, 1) || 'F'}</span>
    <a className={s.action} href={destination} aria-label={`${phrase} ${label}`}>
      <div className={s.copy}>
        <p className={s.heading}><strong>{name}</strong> {action}</p>
        {benefit && <p className={s.benefit}>{benefit}</p>}
      </div>
      <ArrowRight size={15} aria-hidden="true"/>
    </a>
    <button type="button" className={s.close} aria-label="Masquer ces notifications" onClick={dismiss}><X size={14} aria-hidden="true"/></button>
  </aside>
}
