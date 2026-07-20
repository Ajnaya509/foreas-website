'use client'

/**
 * LivePhone — le "téléphone vivant" de la page /experience.
 * PAS un mockup vidéo : un vrai cadre iPhone avec le VRAI chat Ajnaya streamé dedans
 * (même contrat SSE que le widget flottant et l'app — AJNAYA_CONTRACTS.md §7).
 *
 * Comportement (revu suite retour Chandler) :
 *  1. Ajnaya OUVRE avec une vraie question (sa zone ce soir) + chips rapides — elle ne
 *     laisse jamais un silence passif. Cliquer un chip = répondre (aussi valide que taper).
 *  2. Le 1er échange va chercher la VRAIE donnée zone (/api/home/zone-stats, même source que
 *     le hero) et la transmet au cerveau streamé en `liveContext` → réponse ancrée sur de
 *     vrais chiffres, jamais une supposition du LLM (règle anti-invention de l'ADN Ajnaya).
 *  3. Après le 1er échange, bascule WhatsApp HONNÊTE : billet à usage unique
 *     (/api/app/issue-handoff, même mécanisme que le widget flottant et le brief
 *     AJNAYA_OMNICANAL_CONTINUITE.md) → Ajnaya REPREND la conversation sur WhatsApp, pas un
 *     "salut" générique. Repli sur un lien wa.me simple si l'identité n'est pas encore résolue.
 *
 * Réutilise l'infra déjà livrée + vérifiée Fable 5 :
 *  - streamAjnayaChat (src/lib/ajnayaStream.ts) → /api/ajnaya/chat/stream
 *  - getSessionId (src/lib/ajnaya-analytics.ts) → MÊME session que le widget flottant
 *  - /api/app/issue-handoff (déjà utilisé par AjnayaWidget) → billet identity_id + contexte
 *  - buildWAUrl en repli seulement (pas d'identity_id résolue)
 *
 * Design : tokens réels (tailwind.config.ts). Verrou anti-envoi-concurrent dès le départ
 * (leçon Fable 5 sur AjnayaWidget).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { MessageCircle, Send } from 'lucide-react'
import posthog from 'posthog-js'
import { streamAjnayaChat, StreamUnavailableError } from '@/lib/ajnayaStream'
import { getSessionId, getDevice } from '@/lib/ajnaya-analytics'
import { buildWAUrl } from '@/lib/whatsappLink'
import { getVisitorId } from '@/lib/zoneFingerprint'
import { readVisitState, recordSearch } from '@/lib/sarcasticVisits'
import { useTypewriter } from '@/hooks/useTypewriter'
import { hasTrackingConsent } from '@/lib/consent'
import PhoneFrame from './PhoneFrame'

interface Msg { role: 'user' | 'ajnaya'; text: string }
interface LivePhoneProps { geoCity?: string | null }

const WELCOME_BASE = "Salut, moi c'est Ajnaya."
// Fallback SSR (bucket réel appliqué après montage, cf. useEffect ci-dessous — calculer la
// valeur au rendu serveur ferait diverger HTML serveur/client à chaque frontière d'heure,
// donc un mismatch d'hydratation aléatoire sur la toute première bulle).
const WELCOME = `${WELCOME_BASE} Ta zone ce soir — je te dis ce qui s'y passe, en vrai.`
const WELCOME_MOMENT: Record<string, string> = { matin: 'ce matin', midi: 'ce midi', 'après-midi': 'cet après-midi', soir: 'ce soir', nuit: 'cette nuit' }
const FLUSH_MS = 40

// Zones réelles (RPC get_zone_stats couvre ~51 zones) — ordre par défaut Paris-centré,
// reordonné en tête si on détecte la ville du visiteur (voir orderZonesByCity).
// Message d'intention forte : un chauffeur qui tape sur ce chip n'explore plus, il veut
// démarrer. Envoyé tel quel à Ajnaya (backend Pieuvre) qui qualifie et close derrière — la
// même string exacte est utilisée côté mobile (LivePhone) et desktop (DesktopZoneSearch),
// cf. brief FOREAS-SHARED/briefs/AJNAYA_ACCUEIL_SELON_ENTREE.
export const TRIAL_INTENT_MESSAGE = 'Je veux essayer gratuitement Foreas Driver'

export const NATIONAL_ZONES = ['Aéroport CDG', 'La Défense', 'Bercy', 'Lyon Part-Dieu', 'Lille', 'Marseille', 'Toulouse', 'Nantes', 'Strasbourg', 'Bordeaux Saint-Jean']
const CITY_TO_ZONE: Record<string, string> = {
  paris: 'Aéroport CDG', lyon: 'Lyon Part-Dieu', marseille: 'Marseille', lille: 'Lille',
  bordeaux: 'Bordeaux Saint-Jean', toulouse: 'Toulouse', nantes: 'Nantes', strasbourg: 'Strasbourg',
}

export function orderZonesByCity(city: string | null | undefined): string[] {
  if (!city) return NATIONAL_ZONES
  const normalized = city.trim().toLowerCase()
  const matchKey = Object.keys(CITY_TO_ZONE).find((k) => normalized.includes(k))
  if (!matchKey) return NATIONAL_ZONES
  const preferred = CITY_TO_ZONE[matchKey]
  return [preferred, ...NATIONAL_ZONES.filter((z) => z !== preferred)]
}

const TIME_BUCKET_LABELS: Array<[number, string]> = [[5, 'nuit'], [11, 'matin'], [14, 'midi'], [18, 'après-midi'], [23, 'soir']]
function getTimeBucket(hour: number): string {
  for (const [max, label] of TIME_BUCKET_LABELS) { if (hour < max) return label }
  return 'nuit'
}

// Moment réel Europe/Paris — anti-incohérence ("vendredi soir" un lundi).
function buildNowContext() {
  const now = new Date()
  const parts = new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', weekday: 'long', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(now)
  const day = parts.find((p) => p.type === 'weekday')?.value ?? ''
  const hourStr = parts.find((p) => p.type === 'hour')?.value ?? '00'
  const minuteStr = parts.find((p) => p.type === 'minute')?.value ?? '00'
  return { day, time: `${hourStr}:${minuteStr}`, bucket: getTimeBucket(parseInt(hourStr, 10)), iso: now.toISOString() }
}

async function lookupZone(zone: string) {
  try {
    const res = await fetch(`/api/home/zone-stats?zone=${encodeURIComponent(zone)}`)
    if (!res.ok) return null
    return await res.json()
  } catch { return null }
}

export default function LivePhone({ geoCity }: LivePhoneProps) {
  const [messages, setMessages] = useState<Msg[]>([{ role: 'ajnaya', text: WELCOME }])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const [exchanges, setExchanges] = useState(0)
  const [identityId, setIdentityId] = useState<string | null>(null)
  const [visitorId, setVisitorId] = useState<string | null>(null)
  const [waOpened, setWaOpened] = useState(false)
  const [waHref, setWaHref] = useState<string | null>(null) // billet réel une fois résolu

  const chatRef = useRef<HTMLDivElement>(null)
  const sendingRef = useRef(false)
  const abortRef = useRef<AbortController | null>(null)
  const sessionId = getSessionId()

  // Zones réordonnées si on connaît la ville du visiteur (header Vercel x-vercel-ip-city,
  // silencieux — pas de prompt de permission) — même précédent que ZoneSearchBarHero.tsx.
  const orderedZones = useMemo(() => orderZonesByCity(geoCity), [geoCity])
  const zoneChips = useMemo(() => orderedZones.slice(0, 4), [orderedZones])
  const placeholderTexts = useMemo(() => ['Écris ta zone…', ...orderedZones.map((z) => `${z}…`)], [orderedZones])
  const animatedPlaceholder = useTypewriter({ texts: placeholderTexts, typeSpeedMs: 75, pauseMs: 1300, eraseSpeedMs: 32, startDelayMs: 900 })

  // Nouvelle bulle (message user, ou bulle Ajnaya qui vient d'apparaître) → défilement smooth ;
  // remplissage de la bulle existante par les flushes de streaming → 'auto' (suivi instantané,
  // sans quoi une animation smooth est relancée toutes les 40ms et saccade la scène).
  const prevMsgCount = useRef(messages.length)
  useEffect(() => {
    const el = chatRef.current
    if (!el) return
    const grew = messages.length !== prevMsgCount.current
    prevMsgCount.current = messages.length
    el.scrollTo({ top: el.scrollHeight, behavior: grew ? 'smooth' : 'auto' })
  }, [messages, typing])

  useEffect(() => () => { abortRef.current?.abort() }, []) // anti-fuite : coupe le stream si le composant démonte

  // Message d'accueil daté au vrai moment Europe/Paris — calculé uniquement après montage
  // (jamais au rendu serveur : à une frontière de bucket, HTML serveur et client divergeraient
  // et casseraient l'hydratation de la toute première bulle). Garde sur prev.length === 1 pour
  // ne jamais écraser un échange déjà commencé si l'effet re-tire.
  useEffect(() => {
    const m = WELCOME_MOMENT[buildNowContext().bucket] ?? 'ce soir'
    setMessages((prev) =>
      prev.length === 1 && prev[0].role === 'ajnaya'
        ? [{ role: 'ajnaya', text: `${WELCOME_BASE} Ta zone ${m} — je te dis ce qui s'y passe, en vrai.` }]
        : prev)
  }, [])

  // Fingerprint (FingerprintJS, même précédent que la home) — reconnaissance cross-canal via
  // visitor_id, résolu côté backend (resolve_identity), jamais de 2e store d'identité.
  // Gaté sur le consentement déjà en place (cookie foreas_consent) : un fingerprint est un
  // traçage, l'art. 82 exige un consentement PRÉALABLE — pas question de le déclencher au
  // montage sans lui. Écoute aussi l'événement de consentement pour résoudre dès qu'il arrive,
  // pas seulement au premier rendu.
  useEffect(() => {
    let cancelled = false
    const tryResolve = () => {
      if (!hasTrackingConsent()) return
      getVisitorId().then((r) => { if (!cancelled) setVisitorId(r.visitorId) })
    }
    tryResolve()
    window.addEventListener('foreas_consent_accepted', tryResolve)
    return () => { cancelled = true; window.removeEventListener('foreas_consent_accepted', tryResolve) }
  }, [])

  const handleSend = useCallback(async (overrideText?: string) => {
    const text = (overrideText ?? input).trim()
    if (!text) return
    if (sendingRef.current) return // verrou anti-envoi-concurrent (leçon Fable 5)
    sendingRef.current = true

    const isFirstTurn = exchanges === 0
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', text }])
    try { posthog.capture('experience_phone_message_sent', { turn: exchanges + 1, device: getDevice(), first_turn: isFirstTurn }) } catch { /* noop */ }
    setTyping(true)

    // 1er échange = la question forcée sur la zone → on va chercher la VRAIE donnée avant de répondre.
    const zoneData = isFirstTurn ? await lookupZone(text) : null

    // Mémoire de visite (localStorage, partagée avec la home) — lue AVANT recordSearch pour que
    // "returning" reflète les visites précédentes, pas celle-ci. Pas de phrase scriptée côté client :
    // c'est à Ajnaya (le LLM) de faire la pirouette elle-même à partir de ces données.
    let visitorContext: { returning: boolean; visit_count: number; zones_seen_before: string[] } | null = null
    if (isFirstTurn) {
      const prior = readVisitState()
      visitorContext = { returning: prior.count > 0, visit_count: prior.count, zones_seen_before: prior.zones.slice(-5) }
      recordSearch(text)
    }

    const history = messages.slice(-8).map((m) => ({ role: m.role, text: m.text }))
    const body = {
      message: text,
      sessionId,
      identityId,
      visitor_id: visitorId,
      pageSource: '/experience',
      scrollSection: 'live_phone',
      heatScore: 20, // quelqu'un qui teste le vrai chat = intention forte
      messageCount: exchanges + 1,
      conversationHistory: history,
      device: getDevice(),
      liveContext: {
        now: buildNowContext(),
        ...(zoneData ? { zone: zoneData } : {}),
        ...(visitorContext ? { visitor: visitorContext } : {}),
      },
    }

    let bubbleCreated = false
    let pending = ''
    let flushTimer: ReturnType<typeof setTimeout> | null = null
    const ensureBubble = () => {
      if (bubbleCreated) return
      bubbleCreated = true
      setTyping(false)
      setMessages((prev) => [...prev, { role: 'ajnaya', text: '' }])
    }
    const flush = () => {
      flushTimer = null
      if (!pending) return
      const chunk = pending
      pending = ''
      ensureBubble()
      setMessages((prev) => {
        const u = [...prev]
        const last = u[u.length - 1]
        if (last && last.role === 'ajnaya') u[u.length - 1] = { ...last, text: (last.text || '') + chunk }
        return u
      })
    }
    const scheduleFlush = () => { if (!flushTimer) flushTimer = setTimeout(flush, FLUSH_MS) }
    const setFinalText = (t: string) => {
      ensureBubble()
      setMessages((prev) => {
        const u = [...prev]
        const last = u[u.length - 1]
        if (last && last.role === 'ajnaya') u[u.length - 1] = { ...last, text: t }
        return u
      })
    }

    try {
      abortRef.current?.abort()
      const ac = new AbortController()
      abortRef.current = ac
      await streamAjnayaChat(body, {
        onMeta: (m) => { if (m.identity_id && !identityId) setIdentityId(m.identity_id) },
        onDelta: (t) => { pending += t; scheduleFlush() },
        onDone: (d) => {
          if (flushTimer) { clearTimeout(flushTimer); flushTimer = null }
          setFinalText(d.full_text.replace(/\[[\w\s]+\]\s*/g, ''))
        },
        onError: (_msg, streamed) => {
          if (flushTimer) { clearTimeout(flushTimer); flushTimer = null }
          if (streamed.trim()) setFinalText(streamed)
          else setFinalText("Petit souci de connexion — écris-moi directement sur WhatsApp, je réponds là-bas.")
        },
      }, ac.signal)
    } catch (err) {
      if (!(err instanceof StreamUnavailableError)) throw err
      setFinalText("Petit souci de connexion — écris-moi directement sur WhatsApp, je réponds là-bas.")
    } finally {
      setTyping(false)
      setExchanges((n) => n + 1)
      sendingRef.current = false
    }
  }, [input, messages, exchanges, identityId, sessionId, visitorId])

  // ─── Bascule WhatsApp — billet réel (identity + contexte), pas un lien générique ────────
  const showWa = exchanges >= 1
  useEffect(() => {
    if (!showWa || waHref) return // déjà résolu ou pas encore le moment
    if (!identityId) return // billet exige un identity_id valide (issue-handoff) → attend sa résolution
    let cancelled = false
    ;(async () => {
      try {
        const lastAjnaya = [...messages].reverse().find((m) => m.role === 'ajnaya')?.text || ''
        const res = await fetch('/api/app/issue-handoff', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            identity_id: identityId,
            source_canal: 'widget',
            target_canal: 'whatsapp',
            state: {
              last_messages: messages.slice(-6).map((m) => ({ role: m.role, text: m.text })),
              intent: 'experience_phone_continue',
              heat_score: 20,
              url_pre_landing: '/experience',
              prompt_for_next_canal: `Salut ! Tu testais Ajnaya en direct sur foreas.xyz/experience. Je reprends pile où on en était.${lastAjnaya ? ` On parlait de : "${lastAjnaya.slice(0, 80)}"` : ''}`,
            },
          }),
        })
        if (!res.ok) return
        const data = await res.json()
        if (!cancelled && data.ok && data.deeplink) setWaHref(data.deeplink)
      } catch { /* silencieux — repli déjà affiché */ }
    })()
    return () => { cancelled = true }
  }, [showWa, identityId, waHref, messages])

  // Repli honnête tant que le billet n'est pas résolu (identity pas encore connue) — jamais d'écran figé.
  const waUrl = waHref || buildWAUrl({ section: 'experience_phone', ref: sessionId })

  return (
    // Même cadre que les scènes cinéma et les 4 features (PhoneFrame, aspect-[430/902]) — avant
    // ce composant portait un cadre construit à la main (ratio ≈0.587, format vieil iPhone) qui
    // ne correspondait à aucun autre téléphone de la page. Largeur compensée pour garder le même
    // budget vertical qu'avant (~461px mobile / ~562px md), pas la même largeur.
    <div className="relative mx-auto">
      <PhoneFrame widthClassName="w-[228px] md:w-[276px]">
        <div className="flex h-full flex-col px-3 pb-3 pt-9">
          {/* header */}
          <div className="flex items-center gap-2 border-b border-white/[0.08] pb-2.5">
            <span className="h-[26px] w-[26px] flex-none rounded-full bg-gradient-to-br from-accent-purple to-accent-cyan" aria-hidden />
            <b className="text-[13px] text-[#F8FAFC]">Ajnaya</b>
            <span className="flex items-center gap-1 text-[10px] font-medium text-success">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" aria-hidden />
              en direct
            </span>
          </div>

          {/* messages */}
          <div ref={chatRef} role="log" aria-live="polite" className="flex-1 space-y-2 overflow-y-auto py-3 pr-0.5 text-[13px] leading-relaxed">
            {messages.map((m, i) => (
              <div
                key={i}
                className={
                  m.role === 'user'
                    ? 'ml-auto max-w-[86%] rounded-2xl rounded-br-md bg-gradient-to-br from-accent-purple to-accent-purple-deep px-3 py-2 text-white'
                    : 'max-w-[86%] rounded-2xl rounded-bl-md border border-white/[0.08] bg-white/[0.055] px-3 py-2 text-[#F8FAFC]'
                }
              >
                {m.text || <span className="inline-flex gap-1 py-0.5">{[0, 1, 2].map((d) => (
                  <span key={d} className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/40" style={{ animationDelay: `${d * 0.12}s` }} />
                ))}</span>}
              </div>
            ))}
            {typing && (
              <div className="max-w-[60%] rounded-2xl rounded-bl-md border border-white/[0.08] bg-white/[0.055] px-3 py-2">
                <span className="inline-flex gap-1">{[0, 1, 2].map((d) => (
                  <span key={d} className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/40" style={{ animationDelay: `${d * 0.12}s` }} />
                ))}</span>
              </div>
            )}
            {/* chips rapides — répondre à la question forcée en 1 tap, tant qu'on n'a pas encore répondu */}
            {exchanges === 0 && !typing && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {zoneChips.map((z) => (
                  <button
                    key={z}
                    type="button"
                    onClick={() => handleSend(z)}
                    className="rounded-full border border-white/[0.12] bg-white/[0.04] px-2.5 py-1.5 text-[11.5px] text-white/80 active:scale-[0.97]"
                  >
                    {z}
                  </button>
                ))}
                {/* Distinct des chips zone (explorer) : intention d'achat déjà exprimée, pas une
                    zone — accent visuel différent pour ne pas le noyer dans la liste. */}
                <button
                  type="button"
                  onClick={() => handleSend(TRIAL_INTENT_MESSAGE)}
                  className="rounded-full border border-accent-cyan/30 bg-accent-cyan/10 px-2.5 py-1.5 text-[11.5px] font-semibold text-accent-cyan active:scale-[0.97]"
                >
                  🚀 Essayer gratuitement
                </button>
              </div>
            )}
          </div>

          {/* input — anneau dégradé permanent (@keyframes foreas-border-comet, globals.css), même
              mécanique que la home (HomeHeroCream.tsx), violet royal→cyan→violet royal. Le fond du
              form est quasi-opaque (rgba(10,11,20,.94)) — c'est ce qui masque le cône tournant pour
              ne laisser voir qu'un fin anneau nu (sinon la lumière traverse et fait une tache). */}
          <div className="relative">
            <div className="pointer-events-none absolute -inset-[1.5px] overflow-hidden rounded-2xl" aria-hidden="true">
              <div
                className="absolute left-1/2 top-1/2 aspect-square w-[150%]"
                style={{
                  background: 'conic-gradient(from 0deg, transparent 0deg 296deg, rgba(140,82,255,0.95) 318deg, rgba(0,212,255,1) 338deg, rgba(140,82,255,0.95) 358deg, transparent 360deg)',
                  animation: 'foreas-border-comet 3.6s ease-in-out infinite alternate',
                  willChange: 'transform',
                }}
              />
            </div>
            <form
              onSubmit={(e) => { e.preventDefault(); handleSend() }}
              className="relative z-10 flex items-center gap-1.5 rounded-2xl border border-white/[0.10] p-1.5"
              style={{ backgroundColor: 'rgba(10,11,20,.94)' }}
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={exchanges === 0 ? (input ? 'Ta zone…' : animatedPlaceholder) : 'Écris ici…'}
                aria-label="Écrire à Ajnaya"
                className="min-w-0 flex-1 bg-transparent px-2 text-[13px] text-[#F8FAFC] placeholder:text-text-tertiary outline-none"
              />
              <button
                type="submit"
                disabled={!input.trim()}
                aria-label="Envoyer"
                className="flex h-8 w-8 flex-none items-center justify-center rounded-xl bg-gradient-to-br from-[#00D4FF] via-[#00BCE5] to-[#0096B8] text-foreas-obsidian disabled:opacity-40"
              >
                <Send size={14} strokeWidth={2.5} />
              </button>
            </form>
          </div>

          {/* bascule WhatsApp — honnête, apparaît après un vrai échange, billet réel dès que possible */}
          {showWa && (
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => { if (!waOpened) { setWaOpened(true); try { posthog.capture('experience_phone_wa_clicked', { exchanges, has_handoff_token: !!waHref }) } catch { /* noop */ } } }}
              className="mt-2 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-success to-[#34D399] py-3 text-[13.5px] font-extrabold text-white"
              style={{ boxShadow: '0 10px 30px -10px rgba(16,185,129,.5)' }}
            >
              <MessageCircle size={16} />
              Continuer sur WhatsApp
            </a>
          )}
          {showWa && (
            <p className="mt-1.5 text-center text-[10.5px] font-medium text-text-tertiary">
              Elle reprend là où tu t&apos;es arrêté. Tu écris « stop », elle arrête.
            </p>
          )}
        </div>
      </PhoneFrame>
      <p className="mt-2.5 text-center text-[10.5px] font-medium text-text-tertiary">
        Ajnaya répond en direct, gratuitement — sans te demander ton numéro.
      </p>
    </div>
  )
}
