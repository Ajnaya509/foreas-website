'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePathname } from 'next/navigation'
import { sendWidgetAnalytics, getSessionId, getDevice, type WidgetMessage } from '@/lib/ajnaya-analytics'

// ─── Contextual welcome messages ──────────────────────────────────────────────
const WELCOME_MESSAGES: Record<string, string> = {
  '/': "Bonjour ! Je suis Ajnaya, l'intelligence FOREAS. Vous gérez un hôtel, une conciergerie, ou des locations ? Je peux vous montrer comment FOREAS transforme le transport de vos clients.",
  '/chauffeurs': 'Salut ! Je suis Ajnaya. Tu veux savoir comment gagner plus en roulant moins ? Demande-moi.',
  '/partenaires': 'Bonjour ! Vous gérez une flotte VTC ? Je peux vous montrer comment FOREAS optimise chaque chauffeur.',
  '/tarifs2': "Tu hésites ? Normal. Demande-moi n'importe quoi sur l'essai, les fonctionnalités, le prix.",
}
const DEFAULT_WELCOME = "Salut ! Je suis Ajnaya, l'IA FOREAS. En quoi je peux t'aider ?"

// ─── Pre-scripted responses ───────────────────────────────────────────────────
const RESPONSES: Array<{ pattern: RegExp; key: string; reply: string }> = [
  { pattern: /prix|tarif|co[uû]t|combien|cher/i, key: 'pricing', reply: "L'abonnement commence à 1,42€/jour avec essai gratuit, 0€ débité. Tous les détails sont sur /tarifs2." },
  { pattern: /essai|gratuit|tester|test/i, key: 'trial', reply: "L'essai est gratuit jusqu'au prochain lundi 18h. 0€ prélevé. Annulation en 1 clic." },
  { pattern: /comment ça marche|fonctionnement|comment|fonctionne/i, key: 'how', reply: 'Je croise trains, vols, événements, météo et habitudes locales en temps réel pour te dire où te positionner 15 min avant la demande.' },
  { pattern: /uber|bolt|heetch/i, key: 'platforms', reply: 'Compatible avec toutes les apps VTC. Je ne les remplace pas — je te dis où être pour avoir les meilleures courses.' },
  { pattern: /partenaire|flotte|entreprise|h[oô]tel|airbnb/i, key: 'b2b', reply: 'Pour les partenaires, on propose un accompagnement sur mesure avec dashboard dédié. Le mieux : prenez contact via /contact.' },
  { pattern: /zone|carte|map|o[uù]/i, key: 'coverage', reply: "Je couvre Paris et l'Île-de-France. Les zones chaudes changent en temps réel selon les événements, la météo et les transports." },
]
const DEFAULT_REPLY = 'Bonne question ! Pour aller plus loin, explore le site ou essaie l\'app gratuitement sur /tarifs2.'

function matchResponse(text: string): { key: string; reply: string } {
  for (const r of RESPONSES) {
    if (r.pattern.test(text)) return { key: r.key, reply: r.reply }
  }
  return { key: 'default', reply: DEFAULT_REPLY }
}

// ─── Widget Component ─────────────────────────────────────────────────────────
export default function AjnayaWidget() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'ajnaya'; text: string }>>([])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const [hasStickyBelow, setHasStickyBelow] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const openedAtRef = useRef<number>(0)
  const intentsRef = useRef<string[]>([])
  const analyticsMessages = useRef<WidgetMessage[]>([])
  const sentRef = useRef(false)
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const ctaTrackingTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typing])

  // Welcome message on open
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      openedAtRef.current = Date.now()
      sentRef.current = false
      const welcome = WELCOME_MESSAGES[pathname] || DEFAULT_WELCOME
      setMessages([{ role: 'ajnaya', text: welcome }])
      analyticsMessages.current = [{ role: 'ajnaya', text: welcome, timestamp: new Date().toISOString() }]
    }
  }, [isOpen, pathname, messages.length])

  // Detect sticky CTA on /chauffeurs
  useEffect(() => {
    if (pathname !== '/chauffeurs') { setHasStickyBelow(false); return }
    const handleScroll = () => {
      setHasStickyBelow(window.scrollY > window.innerHeight * 0.6)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [pathname])

  // Send analytics
  const sendAnalytics = useCallback((ctaUrl: string | null = null) => {
    if (sentRef.current || analyticsMessages.current.length <= 1) return
    sentRef.current = true
    sendWidgetAnalytics({
      session_id: getSessionId(),
      page_source: pathname,
      device: getDevice(),
      messages: analyticsMessages.current,
      intents_detected: [...new Set(intentsRef.current)],
      cta_clicked_after: ctaUrl,
      conversation_duration_ms: Date.now() - openedAtRef.current,
    })
  }, [pathname])

  // Inactivity timer (60s)
  useEffect(() => {
    if (!isOpen || messages.length <= 1) return
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current)
    inactivityTimer.current = setTimeout(() => sendAnalytics(), 60000)
    return () => { if (inactivityTimer.current) clearTimeout(inactivityTimer.current) }
  }, [isOpen, messages, sendAnalytics])

  // Beforeunload
  useEffect(() => {
    const handler = () => sendAnalytics()
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [sendAnalytics])

  // CTA tracking after close
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
    ctaTrackingTimer.current = setTimeout(() => {
      document.removeEventListener('click', handler)
    }, 60000)
  }, [sendAnalytics])

  // Close widget
  const handleClose = () => {
    setIsOpen(false)
    sendAnalytics()
    startCtaTracking()
  }

  // Send user message
  const handleSend = () => {
    const text = input.trim()
    if (!text) return
    setInput('')

    const userMsg = { role: 'user' as const, text }
    setMessages(prev => [...prev, userMsg])
    analyticsMessages.current.push({ ...userMsg, timestamp: new Date().toISOString() })

    // Match response
    const { key, reply } = matchResponse(text)
    if (key !== 'default') intentsRef.current.push(key)

    // Typing delay
    setTyping(true)
    const delay = 800 + Math.random() * 700
    setTimeout(() => {
      setTyping(false)
      const ajnayaMsg = { role: 'ajnaya' as const, text: reply }
      setMessages(prev => [...prev, ajnayaMsg])
      analyticsMessages.current.push({ ...ajnayaMsg, timestamp: new Date().toISOString() })
    }, delay)
  }

  const bubbleBottom = hasStickyBelow ? 'bottom-24' : 'bottom-6'

  return (
    <>
      {/* ─── Floating Bubble ─── */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            key="bubble"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            onClick={() => setIsOpen(true)}
            className={`fixed right-6 z-[60] w-14 h-14 md:w-[60px] md:h-[60px] rounded-full bg-gradient-to-br from-accent-purple to-accent-cyan shadow-lg shadow-accent-purple/20 flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95 transition-transform ${bubbleBottom}`}
            style={{ animation: 'widgetBounce 30s ease-in-out infinite' }}
          >
            <span className="font-title text-xl md:text-2xl font-bold text-white select-none">A</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* ─── Chat Window ─── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="widget"
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="fixed z-[60] bottom-6 right-4 md:right-6 w-[92vw] md:w-[380px] h-[80vh] md:h-[520px] max-h-[600px] rounded-2xl overflow-hidden shadow-2xl shadow-black/50 border border-white/[0.08] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-[#0a0a12] border-b border-white/[0.06]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-purple to-accent-cyan flex items-center justify-center">
                  <span className="font-title text-sm font-bold text-white">A</span>
                </div>
                <span className="font-title text-base font-semibold text-white">Ajnaya</span>
                <span className="px-1.5 py-0.5 text-[9px] font-mono uppercase tracking-wider text-accent-cyan/80 bg-accent-cyan/10 rounded">IA</span>
              </div>
              <button onClick={handleClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 transition-colors text-white/40 hover:text-white">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-[#08080d]">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'ajnaya'
                      ? 'bg-accent-cyan/[0.05] border border-accent-cyan/10 text-white/80 rounded-bl-md'
                      : 'bg-accent-purple/20 text-white/90 rounded-br-md'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {typing && (
                <div className="flex justify-start">
                  <div className="px-4 py-3 rounded-2xl rounded-bl-md bg-accent-cyan/[0.05] border border-accent-cyan/10 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-accent-cyan/50 animate-pulse" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-accent-cyan/50 animate-pulse" style={{ animationDelay: '200ms' }} />
                    <span className="w-2 h-2 rounded-full bg-accent-cyan/50 animate-pulse" style={{ animationDelay: '400ms' }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="px-3 py-3 bg-[#0a0a12] border-t border-white/[0.06]">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                  placeholder="Écris un message..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-accent-cyan/30 transition-colors"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-r from-accent-purple to-accent-cyan flex items-center justify-center disabled:opacity-30 transition-opacity hover:opacity-90"
                >
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19V5m0 0l-7 7m7-7l7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bounce animation */}
      <style jsx global>{`
        @keyframes widgetBounce {
          0%, 97%, 100% { transform: translateY(0); }
          98% { transform: translateY(-3px); }
          99% { transform: translateY(0); }
        }
      `}</style>
    </>
  )
}
