'use client'

import { X } from 'lucide-react'
import { useEffect, useState } from 'react'
import ActivityGlassReflection from './ActivityGlassReflection'
import s from './home.module.css'

import { ACTIVITY_KINDS, activityPhrase, brandEvents, previewEvents, type ActivityEvent, type ActivitySurface } from './activityCopy'

function ring(audio: AudioContext) {
  const note = audio.createOscillator()
  const volume = audio.createGain()
  const now = audio.currentTime
  note.type = 'sine'
  note.frequency.setValueAtTime(740, now)
  note.frequency.exponentialRampToValueAtTime(990, now + .13)
  volume.gain.setValueAtTime(.0001, now)
  volume.gain.exponentialRampToValueAtTime(.05, now + .018)
  volume.gain.exponentialRampToValueAtTime(.0001, now + .18)
  note.connect(volume).connect(audio.destination)
  note.start(now)
  note.stop(now + .19)
}

let sharedAudio: AudioContext | null = null

function playChime() {
  try {
    if (localStorage.getItem('foreas_intro_sound') === 'off') return
    sharedAudio = sharedAudio ?? new AudioContext()
    const audio = sharedAudio
    if (audio.state === 'running') { ring(audio); return }
    // Le navigateur attend un premier geste : le son part dès ce geste.
    const unlock = () => {
      ['pointerdown', 'keydown', 'touchstart'].forEach(type => window.removeEventListener(type, unlock))
      void audio.resume().then(() => ring(audio)).catch(() => {})
    }
    ;['pointerdown', 'keydown', 'touchstart'].forEach(type => window.addEventListener(type, unlock, { once: true, passive: true }))
  } catch { /* Le son ne retarde jamais l’information. */ }
}

export default function PublicActivityToast({ surface = 'home' }: { surface?: ActivitySurface }) {
  const [events, setEvents] = useState<ActivityEvent[]>([])
  const [index, setIndex] = useState(0)
  const [visible, setVisible] = useState(false)
  const [preview, setPreview] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [typed, setTyped] = useState('')

  useEffect(() => {
    const preview = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) && new URLSearchParams(location.search).get('apercu-notifications') === '1'
    if (preview) {
      setPreview(true)
      setEvents(previewEvents(surface))
      return
    }
    try { if (sessionStorage.getItem('foreas_activity_dismissed') === '1') { setDismissed(true); return } } catch {}
    // En public, seuls les événements approuvés et prouvés sont affichés.
    const controller = new AbortController()
    void fetch('/api/activite-publique', { signal: controller.signal, cache: 'no-store' })
      .then(response => response.ok ? response.json() : { events: [] })
      .then((payload: { events?: ActivityEvent[] }) => {
        if (controller.signal.aborted) return
        const verified = (payload.events ?? []).filter(event => !!event.id && ACTIVITY_KINDS.includes(event.kind) && (surface === 'home' || event.kind === 'app_page_opened'))
        setEvents(verified.length ? verified : brandEvents(surface))
      })
      .catch(() => { if (!controller.signal.aborted) setEvents(brandEvents(surface)) })
    return () => controller.abort()
  }, [surface])

  useEffect(() => {
    if (!events.length || dismissed) return
    const show = window.setTimeout(() => setVisible(true), preview ? 900 : 5000)
    return () => window.clearTimeout(show)
  }, [events.length, dismissed, preview])

  useEffect(() => {
    if (!visible || events.length < 2) return
    let exitTimer: number | undefined
    const cycle = window.setInterval(() => {
      if (document.hidden) return
      setLeaving(true)
      exitTimer = window.setTimeout(() => {
        setTyped('')
        setIndex(value => (value + 1) % events.length)
        setLeaving(false)
      }, 380)
    }, 14000)
    return () => { window.clearInterval(cycle); if (exitTimer) window.clearTimeout(exitTimer) }
  }, [visible, events.length])

  useEffect(() => {
    if (visible && !leaving && !document.hidden) playChime()
  }, [visible, leaving, index])

  useEffect(() => {
    if (!visible || dismissed) return
    const event = events[index]
    if (!event) return
    const phrase = activityPhrase(surface, event, index)
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setTyped(phrase); return }
    const letters = Array.from(phrase)
    let position = 0
    setTyped('')
    const timer = window.setInterval(() => {
      position += 1
      setTyped(letters.slice(0, position).join(''))
      if (position >= letters.length) window.clearInterval(timer)
    }, 25)
    return () => window.clearInterval(timer)
  }, [visible, dismissed, events, index, surface])

  if (!visible || !events.length) return null
  const event = events[index]
  if (!event) return null
  const phrase = activityPhrase(surface, event, index)

  return <aside key={index} className={`${s.activityToast} ${surface === 'driver' ? s.driverActivity : ''} ${leaving ? s.activityLeaving : ''}`} aria-label={`${preview ? 'Aperçu : ' : ''}${phrase}`}>
    <ActivityGlassReflection />
    <div className={s.activityCopy}>
      <p className={s.activityMeasure} aria-hidden="true">{phrase}</p>
      <p aria-hidden="true">{typed}{typed.length < phrase.length && <span className={s.activityCaret} />}</p>
    </div>
    <button type="button" onClick={() => { setDismissed(true); setVisible(false); if (!preview) { try { sessionStorage.setItem('foreas_activity_dismissed', '1') } catch {} } }} aria-label="Masquer ces notifications"><X size={17} aria-hidden="true"/></button>
  </aside>
}
