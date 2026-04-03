'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePathname } from 'next/navigation'
import { X, Send, Mic, Volume2, VolumeX } from 'lucide-react'
import { sendWidgetAnalytics, getSessionId, getDevice, type WidgetMessage } from '@/lib/ajnaya-analytics'
import { speakText, stopSpeaking, unlockAudio, prefetchTTS, playBlob } from '@/lib/tts'

// ─── Contextual welcome messages ──────────────────────────────────────────────
const WELCOME_MESSAGES: Record<string, string> = {
  '/': "Bonjour ! Je suis Ajnaya, l'intelligence FOREAS. Vous gérez un hôtel, une conciergerie, ou des locations ? Je peux vous montrer comment FOREAS transforme le transport de vos clients.",
  '/chauffeurs': 'Salut ! Je suis Ajnaya. Tu veux savoir comment gagner plus en roulant moins ? Demande-moi.',
  '/partenaires': 'Bonjour ! Vous gérez une flotte VTC ? Je peux vous montrer comment FOREAS optimise chaque chauffeur.',
  '/tarifs2': "Tu hésites ? Normal. Demande-moi n'importe quoi sur l'essai, les fonctionnalités, le prix.",
}
const DEFAULT_WELCOME = "Salut ! Je suis Ajnaya, l'IA FOREAS. En quoi je peux t'aider ?"

// ─── Pre-scripted fallback responses ──────────────────────────────────────────
const RESPONSES: Array<{ pattern: RegExp; key: string; reply: string }> = [
  { pattern: /^(salut|bonjour|bonsoir|yo|hey|coucou|hello|allo|allô|slt|bjr|cc|bj|bsr|wesh|oui|ok|d'accord|parfait|super|top|merci|svp|stp)[\s!.,?]*$/i, key: 'greeting', reply: "Salut ! Moi c'est Ajnaya, l'IA FOREAS pour les chauffeurs VTC. T'es sur quelle zone en ce moment ?" },
  { pattern: /prix|tarif|co[uû]t|combien|cher/i, key: 'pricing', reply: "L'abonnement commence à 1,42€/jour avec essai gratuit, 0€ débité. Tous les détails sont sur /tarifs2." },
  { pattern: /essai|gratuit|tester|test/i, key: 'trial', reply: "L'essai est gratuit jusqu'au prochain lundi 18h. 0€ prélevé. Annulation en 1 clic." },
  { pattern: /comment ça marche|fonctionnement|comment|fonctionne/i, key: 'how', reply: 'Je croise trains, vols, événements, météo et habitudes locales en temps réel pour te dire où te positionner 15 min avant la demande.' },
  { pattern: /uber|bolt|heetch/i, key: 'platforms', reply: 'Compatible avec toutes les apps VTC. Je ne les remplace pas — je te dis où être pour avoir les meilleures courses.' },
  { pattern: /partenaire|flotte|entreprise|h[oô]tel|airbnb/i, key: 'b2b', reply: 'Pour les partenaires, on propose un accompagnement sur mesure avec dashboard dédié. Le mieux : prenez contact via /contact.' },
  { pattern: /zone|carte|map|o[uù]/i, key: 'coverage', reply: "Je couvre Paris et l'Île-de-France. Les zones chaudes changent en temps réel selon les événements, la météo et les transports." },
]
const DEFAULT_REPLY = "Je suis pas sûre de comprendre ta question — essaie de me demander par exemple : 'C'est quoi le prix ?' ou 'Comment ça marche ?'"

const LABEL_PHRASES = [
  'Demande à Ajnaya →',
  'Où me positionner ?',
  'Combien je peux gagner ?',
]

function matchResponse(text: string): { key: string; reply: string } {
  for (const r of RESPONSES) {
    if (r.pattern.test(text)) return { key: r.key, reply: r.reply }
  }
  return { key: 'default', reply: DEFAULT_REPLY }
}

// ─── Render message with clickable links ─────────────────────────────────────
function renderMessageWithLinks(text: string) {
  // Parse [text](url) markdown links
  const parts = text.split(/(\[[^\]]+\]\([^)]+\))/)
  return parts.map((part, i) => {
    const match = part.match(/\[([^\]]+)\]\(([^)]+)\)/)
    if (match) {
      return (
        <a
          key={i}
          href={match[2]}
          className="text-accent-cyan underline hover:text-white transition-colors"
          onClick={(e) => {
            // Track conversion if link is /tarifs2
            if (match[2].includes('/tarifs2')) {
              trackConversion()
            }
            // Navigate in same tab
            if (match[2].startsWith('/')) {
              e.preventDefault()
              window.location.href = match[2]
            }
          }}
        >
          {match[1]}
        </a>
      )
    }
    // Also detect bare /tarifs2 or /contact links
    return part.split(/(\/tarifs2|\/contact)/).map((seg, j) => {
      if (seg === '/tarifs2' || seg === '/contact') {
        return (
          <a
            key={`${i}-${j}`}
            href={seg}
            className="text-accent-cyan underline hover:text-white transition-colors"
            onClick={() => { if (seg === '/tarifs2') trackConversion() }}
          >
            {seg}
          </a>
        )
      }
      return seg
    })
  })
}

// ─── Conversion tracking (updates pieuvre_scripts stats) ─────────────────────
async function trackConversion() {
  try {
    // Fire and forget — update script conversion stats
    await fetch('/api/ajnaya/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: '__conversion_event__', sessionId: getSessionId(), pageSource: window.location.pathname }),
    }).catch(() => {})
  } catch { /* silent */ }
}

// ─── Phone number regex ──────────────────────────────────────────────────────
const PHONE_REGEX = /^(\+33|0)[0-9\s.\-]{8,}$/

// ─── Mini Hologram (header version) ───────────────────────────────────────────
function MiniHologram() {
  return (
    <div className="relative w-6 h-6 flex-shrink-0">
      <div className="absolute inset-0 rounded-full" style={{ background: 'radial-gradient(circle at 30% 30%, #8C52FF 0%, #00D4FF 50%, #8C52FF 100%)' }}>
        <span className="absolute inset-0 flex items-center justify-center font-title text-[9px] font-bold text-white" style={{ textShadow: '0 0 8px rgba(0,212,255,0.6)' }}>A</span>
      </div>
      <div className="absolute inset-[-4px] rounded-full border border-accent-cyan/20" style={{ animation: 'orbitalSpin 6s linear infinite' }} />
    </div>
  )
}

// ─── Audio Equalizer ─────────────────────────────────────────────────────────
function AudioEqualizer() {
  return (
    <div className="flex items-end gap-[2px] h-3 ml-2">
      {[0, 0.15, 0.3].map((delay, i) => (
        <div
          key={i}
          className="w-[3px] rounded-full bg-accent-cyan/60"
          style={{ animation: `equalizer 0.8s ease-in-out ${delay}s infinite` }}
        />
      ))}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// WIDGET COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function AjnayaWidget() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'ajnaya'; text: string; timestamp?: string }>>([])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const [hasStickyBelow, setHasStickyBelow] = useState(false)
  const [labelIndex, setLabelIndex] = useState(0)
  const [labelVisible, setLabelVisible] = useState(true)
  const [labelDismissed, setLabelDismissed] = useState(false)
  const [labelCycleCount, setLabelCycleCount] = useState(0)

  // New states for LLM integration
  const [prospectId, setProspectId] = useState<string | null>(null)
  const [voiceEnabled, setVoiceEnabled] = useState(true)
  const [isAudioPlaying, setIsAudioPlaying] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [scrollSection, setScrollSection] = useState('hero')
  const [heatScore, setHeatScore] = useState(0)
  const [messageCount, setMessageCount] = useState(0)
  const [hasAskedPhone, setHasAskedPhone] = useState(false)
  const [phonePromptPending, setPhonePromptPending] = useState(false)
  const [phoneCaptureDone, setPhoneCaptureDone] = useState(false)
  const [customLabel, setCustomLabel] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const openedAtRef = useRef<number>(0)
  const intentsRef = useRef<string[]>([])
  const analyticsMessages = useRef<WidgetMessage[]>([])
  const sentRef = useRef(false)
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const ctaTrackingTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const labelDismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reengageTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const customLabelTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const heatSectionTracked = useRef<Set<string>>(new Set())
  const openTimeRef = useRef<number>(0)
  const openTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null)
  const lastObjectionRef = useRef<string | null>(null)

  const isTuPage = pathname === '/chauffeurs' || pathname === '/tarifs2'
  const placeholder = isTuPage ? 'Écris un message...' : 'Écrivez un message...'
  const sessionId = getSessionId()

  // ─── Scroll section tracking ──────────────────────────────────────────────
  useEffect(() => {
    const sections = ['hero', 'duality', 'features', 'scenarios', 'testimonials', 'pricing', 'offer', 'problem', 'solution', 'partners']
    const handleScroll = () => {
      for (const section of [...sections].reverse()) {
        const el = document.querySelector(`[data-section="${section}"]`)
        if (el) {
          const rect = el.getBoundingClientRect()
          if (rect.top < window.innerHeight * 0.6) {
            setScrollSection(section)
            break
          }
        }
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // ─── Heat score from scroll section ───────────────────────────────────────
  useEffect(() => {
    if ((scrollSection === 'pricing' || scrollSection === 'offer') && !heatSectionTracked.current.has(scrollSection)) {
      heatSectionTracked.current.add(scrollSection)
      setHeatScore(s => s + 5)
    }
  }, [scrollSection])

  // ─── Heat score from time spent with widget open ──────────────────────────
  useEffect(() => {
    if (isOpen) {
      openTimeRef.current = 0
      openTimerRef.current = setInterval(() => {
        openTimeRef.current += 1
        if (openTimeRef.current === 60) {
          setHeatScore(s => s + 3)
        }
      }, 1000)
    } else {
      if (openTimerRef.current) clearInterval(openTimerRef.current)
    }
    return () => { if (openTimerRef.current) clearInterval(openTimerRef.current) }
  }, [isOpen])

  // ─── Label rotation ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (isOpen || labelDismissed) return
    const interval = setInterval(() => {
      setLabelIndex(prev => {
        const next = (prev + 1) % LABEL_PHRASES.length
        if (next === 0) {
          setLabelCycleCount(c => {
            if (c + 1 >= 3) { setLabelVisible(false); return c + 1 }
            return c + 1
          })
        }
        return next
      })
    }, 3500)
    return () => clearInterval(interval)
  }, [isOpen, labelDismissed])

  // ─── Label dismiss + reappear after 30s inactivity ──────────────────────────
  const dismissLabel = useCallback(() => {
    setLabelDismissed(true)
    setLabelVisible(false)
    if (labelDismissTimer.current) clearTimeout(labelDismissTimer.current)
    labelDismissTimer.current = setTimeout(() => {
      setLabelDismissed(false)
      setLabelVisible(true)
      setLabelCycleCount(0)
    }, 30000)
  }, [])

  // ─── Reappear label at page bottom ──────────────────────────────────────────
  useEffect(() => {
    const handleScroll = () => {
      const atBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 200
      if (atBottom && !isOpen && labelDismissed) {
        setLabelDismissed(false)
        setLabelVisible(true)
        setLabelCycleCount(0)
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [isOpen, labelDismissed])

  // ─── Auto-scroll messages ───────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typing])

  // ─── Welcome message on open ────────────────────────────────────────────────
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      openedAtRef.current = Date.now()
      sentRef.current = false
      const welcome = WELCOME_MESSAGES[pathname] || DEFAULT_WELCOME
      const ts = new Date().toISOString()
      setMessages([{ role: 'ajnaya', text: welcome, timestamp: ts }])
      analyticsMessages.current = [{ role: 'ajnaya', text: welcome, timestamp: ts }]
      setHeatScore(s => s + 3) // Widget opened
    }
  }, [isOpen, pathname, messages.length])

  // ─── Detect sticky CTA on /chauffeurs ───────────────────────────────────────
  useEffect(() => {
    if (pathname !== '/chauffeurs') { setHasStickyBelow(false); return }
    const handleScroll = () => setHasStickyBelow(window.scrollY > window.innerHeight * 0.6)
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [pathname])

  // ─── Analytics ──────────────────────────────────────────────────────────────
  const sendAnalytics = useCallback((ctaUrl: string | null = null) => {
    if (sentRef.current || analyticsMessages.current.length <= 1) return
    sentRef.current = true
    sendWidgetAnalytics({
      session_id: sessionId,
      page_source: pathname,
      device: getDevice(),
      messages: analyticsMessages.current,
      intents_detected: [...new Set(intentsRef.current)],
      cta_clicked_after: ctaUrl,
      conversation_duration_ms: Date.now() - openedAtRef.current,
    })
  }, [pathname, sessionId])

  useEffect(() => {
    if (!isOpen || messages.length <= 1) return
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current)
    inactivityTimer.current = setTimeout(() => sendAnalytics(), 60000)
    return () => { if (inactivityTimer.current) clearTimeout(inactivityTimer.current) }
  }, [isOpen, messages, sendAnalytics])

  useEffect(() => {
    const handler = () => sendAnalytics()
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [sendAnalytics])

  const startCtaTracking = useCallback(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const link = target.closest('a')
      if (link) {
        const href = link.getAttribute('href') || ''
        if (href.includes('/tarifs2') || href.includes('/contact')) {
          sendAnalytics(href)
          document.removeEventListener('click', handler)
        }
      }
    }
    document.addEventListener('click', handler)
    ctaTrackingTimer.current = setTimeout(() => document.removeEventListener('click', handler), 60000)
  }, [sendAnalytics])

  // ─── Handle close with re-engagement ──────────────────────────────────────
  const handleClose = useCallback(() => {
    setIsOpen(false)
    stopSpeaking()
    setIsAudioPlaying(false)
    sendAnalytics()
    startCtaTracking()

    // Re-engagement after 25s if conversation happened without conversion
    if (messageCount > 0) {
      if (reengageTimer.current) clearTimeout(reengageTimer.current)
      reengageTimer.current = setTimeout(() => {
        const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')?.text || ''
        let reLabel: string
        if (/prix|tarif|combien|co[uû]t/i.test(lastUserMsg)) {
          reLabel = 'Tu avais une question sur le prix…'
        } else if (lastObjectionRef.current) {
          reLabel = 'Je peux t\'aider à décider…'
        } else {
          reLabel = 'Tu veux que je te montre un exemple concret ?'
        }
        setCustomLabel(reLabel)
        setLabelDismissed(false)
        setLabelVisible(true)
        setLabelCycleCount(0)

        // Reset custom label after 10s
        if (customLabelTimer.current) clearTimeout(customLabelTimer.current)
        customLabelTimer.current = setTimeout(() => {
          setCustomLabel(null)
        }, 10000)
      }, 25000)
    }
  }, [messageCount, messages, sendAnalytics, startCtaTracking])

  // ─── Main send handler ────────────────────────────────────────────────────
  const handleSend = useCallback(async (overrideText?: string) => {
    unlockAudio()
    const startTime = Date.now()
    const text = (overrideText || input).trim()
    if (!text) return

    setInput('')
    const newMessageCount = messageCount + 1
    setMessageCount(newMessageCount)

    const ts = new Date().toISOString()
    const userMsg = { role: 'user' as const, text, timestamp: ts }
    setMessages(prev => [...prev, userMsg])
    analyticsMessages.current.push({ role: 'user', text, timestamp: ts })

    // Heat score
    if (/prix|tarif|coût|combien|essai|gratuit/i.test(text)) setHeatScore(s => s + 5)
    else setHeatScore(s => s + 2)

    // Phone number interception — capture + Identity Bridge hash server-side
    if (PHONE_REGEX.test(text.replace(/[\s.\-()]/g, '').trim()) && !phoneCaptureDone) {
      const cleaned = text.replace(/[\s.\-()]/g, '')
      setTyping(true)

      try {
        // Create/retrieve prospect first if needed
        if (!prospectId) {
          const res = await fetch('/api/ajnaya/prospect', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: cleaned, source: 'widget_site', pageSource: pathname }),
          })
          const data = await res.json()
          if (data.prospectId) setProspectId(data.prospectId)
        }

        // Identity Bridge — hash happens server-side only
        await fetch('/api/identity/capture', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone_raw: cleaned, prospect_id: prospectId, canal: 'widget' }),
        })
      } catch { /* silent */ }

      setTyping(false)
      setHasAskedPhone(true)
      setPhoneCaptureDone(true)
      setPhonePromptPending(false)
      const replyTs = new Date().toISOString()
      const phoneReply = { role: 'ajnaya' as const, text: "Parfait ! Je t'envoie un récap sur WhatsApp. En attendant, tu peux [commencer ton essai gratuit →](/tarifs2)", timestamp: replyTs }
      setMessages(prev => [...prev, phoneReply])
      analyticsMessages.current.push({ role: 'ajnaya', text: phoneReply.text, timestamp: replyTs })

      if (voiceEnabled) {
        setIsAudioPlaying(true)
        speakText("Parfait ! Je t'envoie un récap sur WhatsApp.").finally(() => setIsAudioPlaying(false))
      }
      return
    }

    // Typing indicator
    setTyping(true)

    // Helper: typewriter word-by-word rendering
    const typewriterRender = async (fullText: string) => {
      const replyTs = new Date().toISOString()
      const words = fullText.split(' ')
      // Add empty message placeholder
      setMessages(prev => [...prev, { role: 'ajnaya' as const, text: '', timestamp: replyTs }])
      for (let i = 0; i < words.length; i++) {
        const partial = words.slice(0, i + 1).join(' ')
        setMessages(prev => {
          const updated = [...prev]
          updated[updated.length - 1] = { role: 'ajnaya' as const, text: partial, timestamp: replyTs }
          return updated
        })
        await new Promise(r => setTimeout(r, 20 + Math.random() * 15))
      }
      analyticsMessages.current.push({ role: 'ajnaya', text: fullText, timestamp: replyTs })
    }

    try {
      const res = await fetch('/api/ajnaya/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          sessionId,
          prospectId,
          pageSource: pathname,
          scrollSection,
          heatScore,
          messageCount: newMessageCount,
          conversationHistory: messages.slice(-10).map(m => ({ role: m.role, text: m.text })),
          device: window.innerWidth < 768 ? 'mobile' : 'desktop',
        }),
      })

      if (!res.ok) throw new Error('API error')

      const data = await res.json()

      if (data.error) throw new Error(data.error)

      if (data.prospectId && !prospectId) setProspectId(data.prospectId)

      // Strip audio tags for display, keep for TTS
      const rawReply = data.reply
      const displayReply = rawReply.replace(/\[[\w\s]+\]\s*/g, '')

      // Fire TTS in background — NEVER block text display
      if (voiceEnabled && rawReply) {
        prefetchTTS(rawReply).then(blob => {
          if (blob) {
            setIsAudioPlaying(true)
            playBlob(blob).finally(() => setIsAudioPlaying(false))
          }
        })
      }

      setTyping(false)

      // Typewriter starts IMMEDIATELY — no waiting for TTS
      await typewriterRender(displayReply)

      // Identity Bridge — after 2nd message, ask for phone number
      if (newMessageCount === 2 && !phoneCaptureDone) {
        setPhonePromptPending(true)
        await new Promise(r => setTimeout(r, 600))
        const phoneAskTs = new Date().toISOString()
        const phoneAskMsg = "Pour aller plus loin, tu peux me laisser ton numéro ? Je t'envoie un récap WhatsApp avec tout ce que tu as besoin de savoir."
        setMessages(prev => [...prev, { role: 'ajnaya' as const, text: phoneAskMsg, timestamp: phoneAskTs }])
        analyticsMessages.current.push({ role: 'ajnaya', text: phoneAskMsg, timestamp: phoneAskTs })
        if (voiceEnabled) {
          setIsAudioPlaying(true)
          speakText("Pour aller plus loin, tu peux me laisser ton numéro ?").finally(() => setIsAudioPlaying(false))
        }
      }

      // Track objection for re-engagement
      if (/cher|arnaque|confiance|réfléchir|nul/i.test(text)) {
        lastObjectionRef.current = text
      }
    } catch {
      // Fallback — micro-delay only
      const elapsed = Date.now() - startTime
      if (elapsed < 500) await new Promise(r => setTimeout(r, 500 - elapsed))

      setTyping(false)

      const { key, reply } = matchResponse(text)
      if (key !== 'default') intentsRef.current.push(key)
      await typewriterRender(reply)

      // Identity Bridge fallback path
      if (newMessageCount === 2 && !phoneCaptureDone) {
        setPhonePromptPending(true)
        await new Promise(r => setTimeout(r, 600))
        const phoneAskTs = new Date().toISOString()
        const phoneAskMsg = "Pour aller plus loin, tu peux me laisser ton numéro ? Je t'envoie un récap WhatsApp avec tout ce que tu as besoin de savoir."
        setMessages(prev => [...prev, { role: 'ajnaya' as const, text: phoneAskMsg, timestamp: phoneAskTs }])
        analyticsMessages.current.push({ role: 'ajnaya', text: phoneAskMsg, timestamp: phoneAskTs })
      }
    }
  }, [input, messageCount, hasAskedPhone, phoneCaptureDone, pathname, sessionId, prospectId, scrollSection, heatScore, messages, voiceEnabled])

  // ─── Voice toggle ─────────────────────────────────────────────────────────
  const toggleVoice = () => {
    if (voiceEnabled) stopSpeaking()
    setVoiceEnabled(!voiceEnabled)
    setIsAudioPlaying(false)
  }

  // ─── Microphone (Web Speech API) ──────────────────────────────────────────
  const toggleMic = () => {
    unlockAudio()
    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
      return
    }

    const SpeechRecognition = (window as unknown as Record<string, unknown>).SpeechRecognition || (window as unknown as Record<string, unknown>).webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert('Ton navigateur ne supporte pas la reconnaissance vocale.')
      return
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognition = new (SpeechRecognition as any)()
    recognition.lang = 'fr-FR'
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onstart = () => setIsListening(true)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      if (transcript) handleSend(transcript)
    }
    recognition.onend = () => setIsListening(false)
    recognition.onerror = () => setIsListening(false)

    recognitionRef.current = recognition
    recognition.start()
  }

  const bubbleBottom = hasStickyBelow ? 96 : 24
  const currentLabelText = customLabel || LABEL_PHRASES[labelIndex]

  return (
    <>
      {/* ═══════════════════════════════════════════════════════════════
          HOLOGRAM ORBITAL BUBBLE
          ═══════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            key="hologram"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="fixed right-6 z-[60]"
            style={{ bottom: bubbleBottom }}
          >
            {/* Floating label */}
            <AnimatePresence>
              {labelVisible && !labelDismissed && labelCycleCount < 3 && (
                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.3 }}
                  onClick={dismissLabel}
                  className="absolute cursor-pointer z-10
                    bottom-[calc(100%+8px)] right-0 md:bottom-auto md:top-1/2 md:-translate-y-1/2 md:right-[calc(100%+12px)]"
                >
                  <div className="relative bg-black/70 backdrop-blur-sm border border-white/[0.08] rounded-xl px-4 py-2.5 min-w-[180px]">
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={customLabel || labelIndex}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.4 }}
                        className="block font-body text-sm text-white/60"
                      >
                        {currentLabelText}
                      </motion.span>
                    </AnimatePresence>
                    {/* Triangle pointer → right on desktop, down on mobile */}
                    <div className="hidden md:block absolute top-1/2 -translate-y-1/2 -right-[6px] w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-l-[6px] border-l-white/[0.08]" />
                    <div className="md:hidden absolute -bottom-[6px] right-6 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-white/[0.08]" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Orbital system */}
            <button
              onClick={() => setIsOpen(true)}
              className="relative w-[90px] h-[90px] flex items-center justify-center cursor-pointer group"
              aria-label="Ouvrir le chat Ajnaya"
            >
              {/* Glow — blur-md on mobile, blur-xl on desktop */}
              <div className="absolute inset-3 rounded-full bg-accent-purple/20 blur-md md:blur-xl" style={{ animation: 'glowPulse 3s ease-in-out infinite' }} />

              {/* Orbit ring 2 (outer, slower, reverse) */}
              <div className="absolute w-[80px] h-[80px] rounded-full border border-accent-purple/15" style={{ animation: 'orbitalSpin 18s linear infinite reverse' }}>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[5px] h-[5px] rounded-full bg-accent-purple" style={{ boxShadow: '0 0 8px #8C52FF' }} />
              </div>

              {/* Orbit ring 1 (inner, faster) */}
              <div className="absolute w-[64px] h-[64px] rounded-full border border-accent-cyan/20" style={{ animation: 'orbitalSpin 12s linear infinite' }}>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[5px] h-[5px] rounded-full bg-accent-cyan" style={{ boxShadow: '0 0 8px #00D4FF' }} />
              </div>

              {/* Core sphere */}
              <div
                className="relative w-[44px] h-[44px] rounded-full border border-white/15 flex items-center justify-center group-hover:scale-110 group-active:scale-95 transition-transform duration-200"
                style={{ background: 'radial-gradient(circle at 30% 30%, #8C52FF 0%, #00D4FF 50%, #8C52FF 100%)' }}
              >
                <span className="font-title text-lg font-bold text-white select-none" style={{ textShadow: '0 0 12px rgba(0,212,255,0.6)' }}>A</span>
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════════════
          PREMIUM CHAT WINDOW
          ═══════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="widget"
            initial={{ scale: 0.85, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.85, opacity: 0, y: 30 }}
            transition={{ type: 'spring', damping: 22, stiffness: 300 }}
            className="fixed z-[60] rounded-2xl overflow-hidden flex flex-col
              left-3 right-3 bottom-3 max-h-[75vh]
              md:left-auto md:right-6 md:bottom-[100px] md:w-[400px] md:h-[560px] md:max-h-none"
            style={{
              background: '#08080d',
              border: '1px solid rgba(255,255,255,0.06)',
              boxShadow: '0 30px 60px rgba(0,0,0,0.6), 0 0 40px rgba(140,82,255,0.08)',
            }}
          >
            {/* ─── Header ─── */}
            <div className="flex items-center justify-between px-4 h-14 flex-shrink-0" style={{ background: 'linear-gradient(180deg, #0c0c14 0%, #08080d 100%)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <div className="flex items-center gap-2.5">
                <MiniHologram />
                <span className="font-title text-base font-semibold text-white ml-0.5">Ajnaya</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent-cyan/[0.08] text-accent-cyan/60 border border-accent-cyan/15 font-mono">IA</span>
              </div>
              <div className="flex items-center">
                <button onClick={toggleVoice} className="p-1.5" title={voiceEnabled ? 'Désactiver la voix' : 'Activer la voix'}>
                  {voiceEnabled
                    ? <Volume2 className="w-[18px] h-[18px] text-accent-cyan/70 hover:text-accent-cyan transition-colors" />
                    : <VolumeX className="w-[18px] h-[18px] text-white/20 hover:text-white/40 transition-colors" />
                  }
                </button>
                <button onClick={handleClose} className="p-1.5 ml-3 rounded-lg hover:bg-white/5 transition-colors">
                  <X className="w-[18px] h-[18px] text-white/30 hover:text-white transition-colors" />
                </button>
              </div>
            </div>

            {/* ─── Messages ─── */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none' }}>

              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: msg.role === 'ajnaya' ? -15 : 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className="flex items-end gap-1">
                    <div
                      className={`max-w-[82%] px-4 py-3 text-sm leading-relaxed font-body ${
                        msg.role === 'ajnaya'
                          ? 'text-white/75'
                          : 'text-white/80 ml-auto'
                      }`}
                      style={msg.role === 'ajnaya' ? {
                        background: 'rgba(0,212,255,0.04)',
                        border: '1px solid rgba(0,212,255,0.08)',
                        borderRadius: '16px 16px 16px 4px',
                      } : {
                        background: 'rgba(140,82,255,0.12)',
                        borderRadius: '16px 16px 4px 16px',
                      }}
                    >
                      {msg.role === 'ajnaya' ? renderMessageWithLinks(msg.text) : msg.text}
                    </div>
                    {/* Audio equalizer on last Ajnaya message */}
                    {msg.role === 'ajnaya' && i === messages.length - 1 && isAudioPlaying && (
                      <AudioEqualizer />
                    )}
                  </div>
                </motion.div>
              ))}

              {/* Typing indicator */}
              {typing && (
                <div className="flex justify-start">
                  <div className="px-4 py-3 flex items-center gap-[6px]" style={{ background: 'rgba(0,212,255,0.04)', border: '1px solid rgba(0,212,255,0.08)', borderRadius: '16px 16px 16px 4px' }}>
                    {[0, 1, 2].map(i => (
                      <span key={i} className="w-[5px] h-[5px] rounded-full bg-white/25" style={{ animation: `typingDot 1.2s ease-in-out ${i * 0.15}s infinite` }} />
                    ))}
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* ─── Input ─── */}
            <div className="flex-shrink-0 px-3 py-3 flex items-center gap-2" style={{ borderTop: '1px solid rgba(255,255,255,0.04)', background: 'rgba(255,255,255,0.02)' }}>
              <button
                onClick={toggleMic}
                className="flex-shrink-0 p-1"
                title={isListening ? 'Arrêter' : 'Parler'}
              >
                <Mic className={`w-5 h-5 ${isListening ? 'text-red-400 animate-pulse' : 'text-white/30 hover:text-white/50 transition-colors'}`} />
              </button>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                placeholder={placeholder}
                className="flex-1 bg-transparent text-sm text-white/80 placeholder:text-white/25 focus:outline-none font-body"
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim()}
                className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 ${
                  input.trim()
                    ? 'bg-gradient-to-r from-accent-purple to-accent-cyan hover:opacity-90 active:scale-95'
                    : 'bg-white/5 cursor-not-allowed'
                }`}
              >
                <Send className="w-4 h-4 text-white" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── CSS Animations ─── */}
      <style jsx global>{`
        @keyframes orbitalSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes glowPulse {
          0%, 100% { opacity: 0.15; }
          50% { opacity: 0.35; }
        }
        @keyframes typingDot {
          0%, 100% { transform: scale(0.6); opacity: 0.4; }
          50% { transform: scale(1); opacity: 1; }
        }
        @keyframes equalizer {
          0%, 100% { height: 4px; }
          50% { height: 12px; }
        }
      `}</style>
    </>
  )
}
