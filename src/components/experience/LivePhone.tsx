'use client'

/**
 * LivePhone — le "téléphone vivant" de la page /experience.
 * PAS un mockup vidéo : un vrai cadre iPhone avec le VRAI chat Ajnaya streamé dedans
 * (même contrat SSE que le widget flottant et l'app — AJNAYA_CONTRACTS.md §7).
 * Après quelques échanges, invite honnêtement à continuer sur WhatsApp (contexte transmis en réf).
 *
 * Réutilise l'infra déjà livrée + vérifiée Fable 5 (2 passes, v130-134) :
 *  - streamAjnayaChat (src/lib/ajnayaStream.ts) → /api/ajnaya/chat/stream
 *  - getSessionId (src/lib/ajnaya-analytics.ts) → MÊME session que le widget flottant
 *  - buildWAUrl (src/lib/whatsappLink.ts) section 'experience_phone'
 *
 * Design : tokens réels (tailwind.config.ts) — foreas-obsidian, accent-cyan/purple, glass.
 * Anti-pattern évité dès le départ (leçon Fable 5 sur AjnayaWidget) : verrou anti-envoi-concurrent.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { MessageCircle, Send } from 'lucide-react'
import posthog from 'posthog-js'
import { streamAjnayaChat, StreamUnavailableError } from '@/lib/ajnayaStream'
import { getSessionId, getDevice } from '@/lib/ajnaya-analytics'
import { buildWAUrl } from '@/lib/whatsappLink'

interface Msg { role: 'user' | 'ajnaya'; text: string }

const WELCOME = "Salut, moi c'est Ajnaya. Écris ta zone, ou pose-moi n'importe quelle question — c'est moi qui réponds, pas un script."
const FLUSH_MS = 40

export default function LivePhone() {
  const [messages, setMessages] = useState<Msg[]>([{ role: 'ajnaya', text: WELCOME }])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const [exchanges, setExchanges] = useState(0)
  const [identityId, setIdentityId] = useState<string | null>(null)
  const [waOpened, setWaOpened] = useState(false)

  const chatRef = useRef<HTMLDivElement>(null)
  const sendingRef = useRef(false)
  const abortRef = useRef<AbortController | null>(null)
  const sessionId = getSessionId()

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, typing])

  useEffect(() => () => { abortRef.current?.abort() }, []) // anti-fuite : coupe le stream si le composant démonte

  const handleSend = useCallback(async (overrideText?: string) => {
    const text = (overrideText ?? input).trim()
    if (!text) return
    if (sendingRef.current) return // verrou anti-envoi-concurrent (leçon Fable 5)
    sendingRef.current = true

    setInput('')
    setMessages((prev) => [...prev, { role: 'user', text }])
    try { posthog.capture('experience_phone_message_sent', { turn: exchanges + 1, device: getDevice() }) } catch { /* noop */ }
    setTyping(true)

    const history = messages.slice(-8).map((m) => ({ role: m.role, text: m.text }))
    const body = {
      message: text,
      sessionId,
      identityId,
      pageSource: '/experience',
      scrollSection: 'live_phone',
      heatScore: 20, // quelqu'un qui teste le vrai chat = intention forte
      messageCount: exchanges + 1,
      conversationHistory: history,
      device: getDevice(),
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
  }, [input, messages, exchanges, identityId, sessionId])

  const waUrl = buildWAUrl({ section: 'experience_phone', ref: sessionId })
  const showWa = exchanges >= 1 // dès le 1er échange réel — l'invitation est honnête, pas un piège à clics

  return (
    <div className="mx-auto w-[262px]">
      <div
        className="rounded-[34px] bg-black p-[7px]"
        style={{ boxShadow: '0 0 0 1px rgba(255,255,255,.14), 0 24px 60px -20px rgba(0,0,0,.85), 0 0 60px -22px rgba(140,82,255,.4)' }}
      >
        <div className="flex h-[352px] flex-col rounded-[28px] bg-[#07080F] px-3 pb-3 pt-3.5">
          {/* header */}
          <div className="flex items-center gap-2 border-b border-white/[0.08] pb-2.5">
            <span className="h-[26px] w-[26px] flex-none rounded-full bg-gradient-to-br from-accent-purple to-accent-cyan" aria-hidden />
            <b className="text-[13px] text-[#F8FAFC]">Ajnaya</b>
            <span className="flex items-center gap-1 text-[10px] font-medium text-success">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" aria-hidden />
              en ligne
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
          </div>

          {/* input */}
          <form
            onSubmit={(e) => { e.preventDefault(); handleSend() }}
            className="flex items-center gap-1.5 rounded-2xl border border-white/[0.10] bg-white/[0.04] p-1.5"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Écris ici…"
              aria-label="Écrire à Ajnaya"
              className="min-w-0 flex-1 bg-transparent px-2 text-[13px] text-[#F8FAFC] placeholder:text-text-tertiary focus:outline-none"
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

          {/* bascule WhatsApp — honnête, apparaît après un vrai échange */}
          {showWa && (
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => { if (!waOpened) { setWaOpened(true); try { posthog.capture('experience_phone_wa_clicked', { exchanges }) } catch { /* noop */ } } }}
              className="mt-2 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-success to-[#34D399] py-3 text-[13.5px] font-extrabold text-white"
              style={{ boxShadow: '0 10px 30px -10px rgba(16,185,129,.5)' }}
            >
              <MessageCircle size={16} />
              Continuer sur WhatsApp
            </a>
          )}
        </div>
      </div>
      <p className="mt-2.5 text-center text-[10.5px] text-text-tertiary">Réponse en moins d&apos;1 min · gratuit</p>
    </div>
  )
}
