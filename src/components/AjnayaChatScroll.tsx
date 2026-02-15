'use client'

import { motion, useScroll, useTransform, MotionValue } from 'framer-motion'
import { useRef } from 'react'
import { useIsMobile, useReducedMotion } from '@/hooks/useDevicePerf'

// ─── Visual Block types ────────────────────────────────────
type VisualBlock =
  | { type: 'mapSnapshot'; from: string; to: string; distance: string; duration: string; confidence: number; cta: string }
  | { type: 'voiceConfirm'; destination: string; countdown: number }
  | { type: 'courseCard'; from: string; to: string; amount: string; badge: string }

interface ChatMessage {
  sender: 'ajnaya' | 'driver' | 'voice'
  text: string
  time: string
  visualBlock?: VisualBlock
  watermark?: 'SAFE'
}

// ─── Scénario ──────────────────────────────────────────────
const messages: ChatMessage[] = [
  { sender: 'driver', text: 'Où est-ce que je peux gagner plus là ?', time: '20:03' },
  { sender: 'ajnaya', text: 'Gare de Lyon, à 800m de toi. 3 Intercités arrivent à 20:15 — la demande va monter de +40% dans 12 minutes.', time: '20:03', watermark: 'SAFE' },
  { sender: 'ajnaya', text: 'Si tu pars maintenant, tu arrives avant le pic.', time: '20:03', visualBlock: { type: 'mapSnapshot', from: 'Bastille', to: 'Gare de Lyon', distance: '800m', duration: '4 min', confidence: 92, cta: 'Y aller avec Waze' }, watermark: 'SAFE' },
  { sender: 'driver', text: 'D\'accord, j\'y vais.', time: '20:04' },
  { sender: 'ajnaya', text: 'Navigation vers Gare de Lyon ?', time: '20:04', visualBlock: { type: 'voiceConfirm', destination: 'Gare de Lyon', countdown: 10 } },
  { sender: 'voice', text: '🎙 "Oui"', time: '20:04' },
  { sender: 'ajnaya', text: 'C\'est parti. Navigation lancée — arrivée 20:08.', time: '20:04' },
  { sender: 'ajnaya', text: 'Course assignée.', time: '20:16', visualBlock: { type: 'courseCard', from: 'Gare de Lyon', to: 'Neuilly-sur-Seine', amount: '34€', badge: 'Ajnaya • 87%' }, watermark: 'SAFE' },
  { sender: 'ajnaya', text: 'Neuilly : concert au Théâtre des Sablons à 21h. Enchaînement estimé dans 8 min. On y va ?', time: '20:42', watermark: 'SAFE' },
]

// ─── Explanation cards ─────────────────────────────────────
type CardColor = 'cyan' | 'purple' | 'green'

interface ExplanationCard {
  title: string
  desc: string
  icon: string
  color: CardColor
  side: 'left' | 'right'
}

const explanationCards: ExplanationCard[] = [
  { title: 'Le chauffeur demande', desc: 'Une question naturelle. Ajnaya comprend et agit.', icon: '💬', color: 'cyan', side: 'left' },
  { title: 'Logique terrain', desc: 'Trains, événements, affluence — tout est expliqué.', icon: '🧠', color: 'purple', side: 'right' },
  { title: 'Carte intégrée', desc: 'Un regard sur la carte, une décision. Zéro friction.', icon: '🗺️', color: 'cyan', side: 'left' },
  { title: '+34€ en 1 course', desc: 'Bonne zone, bon timing. Le résultat parle.', icon: '💰', color: 'green', side: 'right' },
  { title: 'Boucle vertueuse', desc: 'La suivante est déjà calculée. Zéro temps mort.', icon: '🔄', color: 'purple', side: 'left' },
]

const colorMap: Record<CardColor, { bg: string; border: string; text: string; dot: string }> = {
  cyan: { bg: 'bg-accent-cyan/[0.06]', border: 'border-accent-cyan/20', text: 'text-accent-cyan', dot: 'bg-accent-cyan' },
  purple: { bg: 'bg-accent-purple/[0.06]', border: 'border-accent-purple/20', text: 'text-accent-purple', dot: 'bg-accent-purple' },
  green: { bg: 'bg-green-500/[0.06]', border: 'border-green-500/20', text: 'text-green-400', dot: 'bg-green-400' },
}

// ─── Visual block sub-components ───────────────────────────

function MapSnapshotBlock({ block }: { block: Extract<VisualBlock, { type: 'mapSnapshot' }> }) {
  return (
    <div className="mt-2.5 rounded-xl overflow-hidden border border-white/10">
      <div className="relative h-[75px] bg-[#080810]">
        <svg className="w-full h-full" viewBox="0 0 220 75" preserveAspectRatio="xMidYMid slice">
          <rect width="220" height="75" fill="#080810" />
          <path d="M 0 25 L 220 25" stroke="#111120" strokeWidth="0.6" />
          <path d="M 0 50 L 220 50" stroke="#111120" strokeWidth="0.6" />
          <path d="M 55 0 L 55 75" stroke="#111120" strokeWidth="0.6" />
          <path d="M 110 0 L 110 75" stroke="#111120" strokeWidth="0.6" />
          <path d="M 165 0 L 165 75" stroke="#111120" strokeWidth="0.6" />
          <path d="M 0 62 Q 60 55 110 60 Q 160 65 220 58" stroke="#0a1a2a" strokeWidth="3" fill="none" opacity="0.5" />
          <path d="M 15 70 Q 80 48 140 32 Q 180 22 215 18" stroke="#14142a" strokeWidth="1.2" fill="none" />
          <defs>
            <linearGradient id="snapRoute" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00D4FF" />
              <stop offset="100%" stopColor="#8C52FF" />
            </linearGradient>
          </defs>
          <path d="M 40 50 Q 90 44 140 30 Q 175 20 195 24" fill="none" stroke="url(#snapRoute)" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="40" cy="50" r="6" fill="#00D4FF" opacity="0.15" />
          <circle cx="40" cy="50" r="3.5" fill="#00D4FF" />
          <circle cx="40" cy="50" r="1.5" fill="#fff" />
          <circle cx="195" cy="24" r="6" fill="#8C52FF" opacity="0.15" />
          <circle cx="195" cy="24" r="3.5" fill="#8C52FF" />
          <circle cx="195" cy="24" r="1.5" fill="#fff" />
        </svg>
        <div className="absolute bottom-1.5 left-2 right-2 flex justify-between">
          <span className="text-[7px] text-accent-cyan font-semibold bg-[#050508]/90 px-1.5 py-0.5 rounded-sm">{block.from}</span>
          <span className="text-[7px] text-accent-purple font-semibold bg-[#050508]/90 px-1.5 py-0.5 rounded-sm">{block.to}</span>
        </div>
        <div className="absolute top-1.5 right-2">
          <span className="text-[6px] text-green-400/50 font-mono tracking-widest">SAFE</span>
        </div>
      </div>
      <div className="flex items-center justify-between px-3 py-2 bg-[#0a0a16] border-t border-white/5">
        <div className="flex items-center gap-2.5">
          <span className="text-[9px] text-white/50 font-medium">{block.duration}</span>
          <span className="text-[9px] text-white/30">•</span>
          <span className="text-[9px] text-white/50">{block.distance}</span>
          <div className="flex items-center gap-1 ml-1">
            <div className="w-1 h-1 rounded-full bg-accent-cyan" />
            <span className="text-[8px] text-accent-cyan/80 font-mono">{block.confidence}%</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 bg-gradient-to-r from-accent-cyan/20 to-accent-purple/10 px-2.5 py-1 rounded-full border border-accent-cyan/20">
          <svg className="w-3 h-3 text-accent-cyan" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
          </svg>
          <span className="text-[8px] text-accent-cyan font-bold tracking-wide">{block.cta}</span>
        </div>
      </div>
    </div>
  )
}

function VoiceConfirmBlock({ block }: { block: Extract<VisualBlock, { type: 'voiceConfirm' }> }) {
  return (
    <div className="mt-2 px-3 py-2.5 rounded-xl bg-accent-purple/8 border border-accent-purple/15">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-accent-purple/20 flex items-center justify-center">
            <svg className="w-3 h-3 text-accent-purple" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
            </svg>
          </div>
          <div>
            <span className="text-[10px] text-white/80 font-medium">Confirmer : &quot;{block.destination}&quot;</span>
            <span className="text-[8px] text-white/30 block">Dites &quot;Oui&quot; ou &quot;Non&quot;</span>
          </div>
        </div>
        <div className="relative w-8 h-8">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 32 32">
            <circle cx="16" cy="16" r="13" fill="none" stroke="#8C52FF15" strokeWidth="2.5" />
            <circle cx="16" cy="16" r="13" fill="none" stroke="#8C52FF" strokeWidth="2.5" strokeDasharray="81.68" strokeDashoffset="20" strokeLinecap="round" />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-[10px] text-accent-purple font-bold">{block.countdown}</span>
        </div>
      </div>
    </div>
  )
}

function CourseCardBlock({ block }: { block: Extract<VisualBlock, { type: 'courseCard' }> }) {
  return (
    <div className="mt-2.5 rounded-xl overflow-hidden border border-green-500/15 bg-gradient-to-br from-green-500/[0.06] to-green-500/[0.02]">
      <div className="px-3 py-2.5">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-accent-cyan shadow-sm shadow-accent-cyan/30" />
            <span className="text-[9px] text-white/70 font-medium">{block.from}</span>
          </div>
          <div className="flex-1 h-px bg-gradient-to-r from-accent-cyan/30 to-accent-purple/30" />
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] text-white/70 font-medium">{block.to}</span>
            <div className="w-2 h-2 rounded-full bg-accent-purple shadow-sm shadow-accent-purple/30" />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold text-green-400">{block.amount}</span>
            <span className="text-[8px] text-green-400/50">estimé</span>
          </div>
          <span className="text-[7px] text-white/35 font-mono bg-white/[0.04] px-2 py-0.5 rounded-full">{block.badge}</span>
        </div>
      </div>
      <div className="flex items-center justify-end px-2.5 py-1 bg-green-500/[0.03] border-t border-green-500/10">
        <span className="text-[6px] text-green-400/40 font-mono tracking-widest">SAFE</span>
      </div>
    </div>
  )
}

// ─── Desktop floating card with horizontal connector ───────
function DesktopFloatingCard({
  card, opacity, x,
}: {
  card: ExplanationCard
  opacity: MotionValue<number>
  x: MotionValue<number>
}) {
  const colors = colorMap[card.color]
  const isLeft = card.side === 'left'

  return (
    <motion.div
      style={{ opacity, x }}
      className={`flex items-center gap-0 ${isLeft ? 'flex-row' : 'flex-row-reverse'}`}
    >
      <div className={`w-[190px] p-3 rounded-2xl border ${colors.bg} ${colors.border}`}>
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-base">{card.icon}</span>
          <span className={`text-xs font-semibold ${colors.text}`}>{card.title}</span>
        </div>
        <p className="text-white/45 text-[11px] leading-snug">{card.desc}</p>
      </div>
      {/* Horizontal dotted connector */}
      <div className="flex items-center gap-0">
        <div className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
        <div className={`w-8 lg:w-12 border-t border-dashed ${colors.border}`} />
        <div className={`w-1 h-1 rounded-full ${colors.dot} opacity-50`} />
      </div>
    </motion.div>
  )
}

// ─── Main component ────────────────────────────────────────

export default function AjnayaChatScroll() {
  const containerRef = useRef<HTMLDivElement>(null)
  const isMobile = useIsMobile()
  const reducedMotion = useReducedMotion()
  const skipInfinite = isMobile || reducedMotion

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  })

  // ─── Timing ──────────────────────────────────────────────
  const t = isMobile
    ? { phoneIn: 0.08, phoneOut: 0.88, sectionIn: 0.10, sectionOut: 0.90,
        msgStart: 0.18, msgSpan: 0.52, cardStart: 0.22, cardSpan: 0.50,
        scrollStart: 0.24, scrollEnd: 0.82, chatTravel: -480 }
    : { phoneIn: 0.06, phoneOut: 0.85, sectionIn: 0.08, sectionOut: 0.85,
        msgStart: 0.09, msgSpan: 0.56, cardStart: 0.12, cardSpan: 0.55,
        scrollStart: 0.14, scrollEnd: 0.78, chatTravel: -580 }

  const phoneOpacity = useTransform(scrollYProgress, [0, t.phoneIn, t.phoneOut, t.phoneOut + 0.10], [0, 1, 1, 0])
  const phoneScale = useTransform(scrollYProgress, [0, t.phoneIn], [0.95, 1])
  const sectionOpacity = useTransform(scrollYProgress, [0, t.sectionIn, t.sectionOut, t.sectionOut + 0.10], [0, 1, 1, 0])

  const msgCount = messages.length
  const msgOpacities = messages.map((_, i) => {
    const start = t.msgStart + (i / msgCount) * t.msgSpan
    const end = start + 0.04
    return useTransform(scrollYProgress, [start, end], [0, 1])
  })

  // ─── Card animations ────────────────────────────────────
  const slideDistance = isMobile ? 80 : 160
  const cardAnimations = explanationCards.map((card, i) => {
    const totalCards = explanationCards.length
    const cardWindowStart = t.cardStart + (i / totalCards) * t.cardSpan
    const enterEnd = cardWindowStart + 0.06
    const exitStart = cardWindowStart + 0.14
    const exitEnd = exitStart + 0.06
    // Mobile: cards slide in from the bottom
    // Desktop: cards slide in from left/right
    const direction = isMobile ? 1 : (card.side === 'left' ? -1 : 1)

    return {
      opacity: useTransform(scrollYProgress, [cardWindowStart, enterEnd, exitStart, exitEnd], [0, 1, 1, 0]),
      x: isMobile
        ? useTransform(scrollYProgress, [cardWindowStart, enterEnd, exitStart, exitEnd], [
            card.side === 'left' ? -slideDistance : slideDistance, 0, 0,
            card.side === 'left' ? slideDistance : -slideDistance,
          ])
        : useTransform(scrollYProgress, [cardWindowStart, enterEnd, exitStart, exitEnd], [
            direction * slideDistance, 0, 0, direction * -slideDistance,
          ]),
    }
  })

  const chatScrollY = useTransform(scrollYProgress, [t.scrollStart, t.scrollEnd], [0, t.chatTravel])

  // Desktop vertical positions for side cards
  const desktopCardPositions = ['10%', '26%', '42%', '58%', '74%']

  return (
    <section ref={containerRef} className={`relative bg-foreas-deepblack ${isMobile ? 'h-[300vh]' : 'h-[420vh]'}`}>
      <div className="sticky top-0 h-screen flex flex-col items-center overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-foreas-deepblack via-foreas-black to-foreas-deepblack" />
        {!isMobile && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-accent-purple/[0.04] rounded-full blur-[100px]" />
        )}

        {/* Title */}
        <motion.div
          style={{ opacity: sectionOpacity }}
          className="relative text-center z-20 px-4 pt-6 sm:pt-10 md:pt-14 pb-2 sm:pb-5 flex-shrink-0"
        >
          <h2 className="font-title text-2xl sm:text-3xl md:text-5xl text-white mb-1 sm:mb-2">
            Vous demandez. <span className="text-accent-cyan">Ajnaya agit.</span>
          </h2>
          <p className="text-white/40 text-xs sm:text-sm md:text-lg max-w-md mx-auto">
            Voix, texte, cartes — une conversation, pas un tableau de bord.
          </p>
        </motion.div>

        {/* ─── MOBILE LAYOUT: phone top + card below with vertical connector ─── */}
        {isMobile && (
          <motion.div
            style={{ opacity: sectionOpacity }}
            className="relative flex-1 min-h-0 w-full flex flex-col items-center"
          >
            {/* Phone mockup — smaller on mobile to leave card room */}
            <motion.div className="relative flex-shrink-0" style={{ opacity: phoneOpacity, scale: phoneScale }}>
              <div className="relative w-[220px] h-[400px] bg-gradient-to-b from-[#1a1a1f] to-[#0d0d12] rounded-[2.4rem] p-[2px] shadow-2xl shadow-black/50">
                <div className="absolute inset-0 rounded-[2.4rem] border border-white/[0.08]" />
                <div className="relative w-full h-full bg-[#050508] rounded-[2.2rem]" style={{ overflow: 'hidden', isolation: 'isolate' }}>
                  {/* Dynamic Island */}
                  <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-[75px] h-[24px] bg-black rounded-full z-30" />
                  {/* Status bar */}
                  <div className="absolute top-2.5 left-5 right-5 flex justify-between items-center text-white text-[9px] font-medium z-20">
                    <span>20:03</span>
                    <div className="flex items-center gap-1 opacity-70">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z"/></svg>
                      <svg className="w-4 h-2.5" viewBox="0 0 28 14"><rect x="0" y="0" width="24" height="14" rx="3" fill="none" stroke="currentColor" strokeWidth="1.5"/><rect x="2" y="2" width="17" height="10" rx="1.5" fill="currentColor"/></svg>
                    </div>
                  </div>
                  {/* Chat header */}
                  <div className="absolute top-10 left-0 right-0 z-20 px-3 pb-2 bg-[#050508] border-b border-white/[0.04]">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-accent-cyan to-accent-purple flex items-center justify-center">
                        <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                        </svg>
                      </div>
                      <div>
                        <span className="text-white text-[10px] font-semibold">Ajnaya</span>
                        <div className="flex items-center gap-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                          <span className="text-green-400/80 text-[7px]">En ligne</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Chat messages */}
                  <div className="absolute top-[74px] bottom-[48px] left-0 right-0 z-10" style={{ overflow: 'hidden' }}>
                    <motion.div style={{ y: chatScrollY }} className="px-2.5 space-y-1.5 pt-1 pb-4">
                      {messages.map((msg, i) => (
                        <motion.div key={i} style={{ opacity: msgOpacities[i] }} className={`flex ${msg.sender === 'driver' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[88%] px-2.5 py-1.5 rounded-2xl ${
                            msg.sender === 'ajnaya' ? 'bg-white/[0.05] border border-white/[0.04] rounded-tl-sm'
                            : msg.sender === 'voice' ? 'bg-accent-purple/8 border border-accent-purple/15 rounded-tr-sm'
                            : 'bg-gradient-to-r from-accent-purple/20 to-accent-cyan/10 border border-accent-cyan/[0.08] rounded-tr-sm'
                          }`}>
                            {msg.sender === 'voice' && (
                              <div className="flex items-center gap-1 mb-0.5">
                                <div className="w-3 h-3 rounded-full bg-accent-purple/25 flex items-center justify-center">
                                  <svg className="w-1.5 h-1.5 text-accent-purple" fill="currentColor" viewBox="0 0 24 24"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>
                                </div>
                                <span className="text-[6px] text-accent-purple/50 font-mono tracking-wider">VOCALE</span>
                              </div>
                            )}
                            <p className={`text-[10px] leading-[1.4] ${msg.sender === 'voice' ? 'text-accent-purple font-medium' : 'text-white/90'}`}>{msg.text}</p>
                            {msg.visualBlock?.type === 'mapSnapshot' && <MapSnapshotBlock block={msg.visualBlock} />}
                            {msg.visualBlock?.type === 'voiceConfirm' && <VoiceConfirmBlock block={msg.visualBlock} />}
                            {msg.visualBlock?.type === 'courseCard' && <CourseCardBlock block={msg.visualBlock} />}
                            <div className="flex items-center justify-between mt-0.5">
                              <span className="text-white/20 text-[7px]">{msg.time}</span>
                              {msg.watermark && <span className="text-[5px] text-green-400/30 font-mono tracking-widest">{msg.watermark}</span>}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                  </div>
                  {/* Input bar */}
                  <div className="absolute bottom-4 left-2.5 right-2.5 z-20">
                    <div className="flex items-center gap-1.5">
                      <div className="flex-1 flex items-center bg-[#050508] border border-white/[0.06] rounded-full px-3 py-2">
                        <span className="text-white/20 text-[9px]">Parlez ou écrivez...</span>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-cyan to-accent-purple flex items-center justify-center">
                        <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>
                      </div>
                    </div>
                  </div>
                  <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-[80px] h-[3px] bg-white/15 rounded-full z-20" />
                </div>
              </div>
            </motion.div>

            {/* ─── Mobile card area — below phone, one at a time ─── */}
            <div className="relative w-full flex-1 min-h-[120px] flex items-start justify-center mt-2">
              {explanationCards.map((card, i) => {
                const colors = colorMap[card.color]
                return (
                  <motion.div
                    key={i}
                    style={{ opacity: cardAnimations[i].opacity, x: cardAnimations[i].x }}
                    className="absolute top-0 left-4 right-4 flex flex-col items-center"
                  >
                    {/* Vertical dotted connector — goes UP from card to phone bottom */}
                    <div className="flex flex-col items-center mb-1.5">
                      <div className={`w-1 h-1 rounded-full ${colors.dot} opacity-50`} />
                      <div className={`w-px h-4 border-l border-dashed ${colors.border}`} />
                      <div className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
                    </div>
                    {/* Card */}
                    <div className={`w-full max-w-[280px] p-3 rounded-2xl border ${colors.bg} ${colors.border}`}>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{card.icon}</span>
                        <div className="flex-1">
                          <span className={`text-[11px] font-semibold ${colors.text}`}>{card.title}</span>
                          <p className="text-white/45 text-[10px] leading-snug mt-0.5">{card.desc}</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        )}

        {/* ─── DESKTOP LAYOUT: side cards + phone center ─── */}
        {!isMobile && (
          <motion.div
            style={{ opacity: sectionOpacity }}
            className="relative flex-1 min-h-0 w-full flex items-start justify-center"
          >
            {/* Desktop floating cards on left/right */}
            {explanationCards.map((card, i) => (
              <div
                key={i}
                className="absolute z-30"
                style={{
                  top: desktopCardPositions[i],
                  ...(card.side === 'left'
                    ? { right: '50%', marginRight: '155px' }
                    : { left: '50%', marginLeft: '155px' }),
                }}
              >
                <DesktopFloatingCard
                  card={card}
                  opacity={cardAnimations[i].opacity}
                  x={cardAnimations[i].x}
                />
              </div>
            ))}

            {/* Phone mockup — desktop size */}
            <motion.div className="relative" style={{ opacity: phoneOpacity, scale: phoneScale }}>
              <div className="absolute -inset-6 bg-gradient-to-b from-accent-purple/12 via-accent-cyan/6 to-transparent rounded-[4rem] blur-[50px] opacity-50" />

              <div className="relative w-[290px] h-[560px] bg-gradient-to-b from-[#1a1a1f] to-[#0d0d12] rounded-[2.8rem] p-[3px] shadow-2xl shadow-black/50">
                <div className="absolute inset-0 rounded-[2.8rem] border border-white/[0.08]" />
                <div className="relative w-full h-full bg-[#050508] rounded-[2.6rem]" style={{ overflow: 'hidden', isolation: 'isolate' }}>
                  <div className="absolute top-3 left-1/2 -translate-x-1/2 w-[90px] h-[28px] bg-black rounded-full z-30" />
                  <div className="absolute top-3 left-6 right-6 flex justify-between items-center text-white text-[10px] font-medium z-20">
                    <span>20:03</span>
                    <div className="flex items-center gap-1 opacity-70">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z"/></svg>
                      <svg className="w-5 h-3" viewBox="0 0 28 14"><rect x="0" y="0" width="24" height="14" rx="3" fill="none" stroke="currentColor" strokeWidth="1.5"/><rect x="2" y="2" width="17" height="10" rx="1.5" fill="currentColor"/></svg>
                    </div>
                  </div>
                  <div className="absolute top-12 left-0 right-0 z-20 px-4 pb-2.5 bg-[#050508] border-b border-white/[0.04]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-cyan to-accent-purple flex items-center justify-center shadow-lg shadow-accent-purple/20">
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                        </svg>
                      </div>
                      <div>
                        <span className="text-white text-[11px] font-semibold tracking-wide">Ajnaya</span>
                        <div className="flex items-center gap-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-400 shadow-sm shadow-green-400/50" />
                          <span className="text-green-400/80 text-[8px]">En ligne</span>
                        </div>
                      </div>
                      <div className="ml-auto flex items-center gap-1 bg-white/[0.04] px-2 py-0.5 rounded-full">
                        <div className="w-1 h-1 rounded-full bg-green-400" />
                        <span className="text-[7px] text-green-400/60 font-mono">STOPPED</span>
                      </div>
                    </div>
                  </div>
                  <div className="absolute top-[88px] bottom-[58px] left-0 right-0 z-10" style={{ overflow: 'hidden' }}>
                    <motion.div style={{ y: chatScrollY }} className="px-3 space-y-2 pt-1 pb-4">
                      {messages.map((msg, i) => (
                        <motion.div key={i} style={{ opacity: msgOpacities[i] }} className={`flex ${msg.sender === 'driver' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[88%] px-3 py-2 rounded-2xl ${
                            msg.sender === 'ajnaya' ? 'bg-white/[0.05] border border-white/[0.04] rounded-tl-sm'
                            : msg.sender === 'voice' ? 'bg-accent-purple/8 border border-accent-purple/15 rounded-tr-sm'
                            : 'bg-gradient-to-r from-accent-purple/20 to-accent-cyan/10 border border-accent-cyan/[0.08] rounded-tr-sm'
                          }`}>
                            {msg.sender === 'voice' && (
                              <div className="flex items-center gap-1.5 mb-1">
                                <div className="w-3.5 h-3.5 rounded-full bg-accent-purple/25 flex items-center justify-center">
                                  <svg className="w-2 h-2 text-accent-purple" fill="currentColor" viewBox="0 0 24 24"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>
                                </div>
                                <span className="text-[7px] text-accent-purple/50 font-mono tracking-wider">COMMANDE VOCALE</span>
                              </div>
                            )}
                            <p className={`text-[11px] leading-[1.5] ${msg.sender === 'voice' ? 'text-accent-purple font-medium' : 'text-white/90'}`}>{msg.text}</p>
                            {msg.visualBlock?.type === 'mapSnapshot' && <MapSnapshotBlock block={msg.visualBlock} />}
                            {msg.visualBlock?.type === 'voiceConfirm' && <VoiceConfirmBlock block={msg.visualBlock} />}
                            {msg.visualBlock?.type === 'courseCard' && <CourseCardBlock block={msg.visualBlock} />}
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-white/20 text-[8px]">{msg.time}</span>
                              {msg.watermark && <span className="text-[6px] text-green-400/30 font-mono tracking-widest">{msg.watermark}</span>}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                  </div>
                  <div className="absolute bottom-5 left-3 right-3 z-20">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 flex items-center bg-[#050508]/95 backdrop-blur-md border border-white/[0.06] rounded-full px-3.5 py-2.5">
                        <span className="text-white/20 text-[10px]">Parlez ou écrivez...</span>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-cyan to-accent-purple flex items-center justify-center shadow-lg shadow-accent-purple/25">
                        <svg className="w-4.5 h-4.5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>
                      </div>
                    </div>
                  </div>
                  <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-[100px] h-[4px] bg-white/15 rounded-full z-20" />
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Scroll indicator */}
        <motion.div
          style={{ opacity: useTransform(scrollYProgress, [0, 0.06], [1, 0]) }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <span className="text-white/30 text-xs">Scrollez</span>
          <motion.div
            animate={skipInfinite ? undefined : { y: [0, 5, 0] }}
            transition={skipInfinite ? undefined : { duration: 1.5, repeat: Infinity }}
            className="w-5 h-8 border-2 border-white/10 rounded-full flex justify-center pt-1.5"
          >
            <div className="w-1 h-2.5 bg-white/20 rounded-full" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
