'use client'

import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'
import { useIsMobile, useReducedMotion } from '@/hooks/useDevicePerf'

// ─── Visual Block types (architecture réelle Ajnaya) ───────
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

// ─── Scénario : le chauffeur demande, Ajnaya agit ─────────
const messages: ChatMessage[] = [
  // 1. Le chauffeur initie — la question que TOUT chauffeur se pose
  {
    sender: 'driver',
    text: 'Où est-ce que je peux gagner plus là ?',
    time: '20:03',
  },
  // 2. Ajnaya répond avec logique TERRAIN (jamais "d'après ses données")
  {
    sender: 'ajnaya',
    text: 'Gare de Lyon, à 800m de toi. 3 Intercités arrivent à 20:15 — la demande va monter de +40% dans 12 minutes.',
    time: '20:03',
    watermark: 'SAFE',
  },
  // 3. Ajnaya affiche le snapshot Mapbox
  {
    sender: 'ajnaya',
    text: 'Si tu pars maintenant, tu arrives avant le pic.',
    time: '20:03',
    visualBlock: {
      type: 'mapSnapshot',
      from: 'Bastille',
      to: 'Gare de Lyon',
      distance: '800m',
      duration: '4 min',
      confidence: 92,
      cta: 'Y aller avec Waze',
    },
    watermark: 'SAFE',
  },
  // 4. Le chauffeur valide — engagement immédiat
  {
    sender: 'driver',
    text: 'D\'accord, j\'y vais.',
    time: '20:04',
  },
  // 5. Confirmation vocale avec countdown
  {
    sender: 'ajnaya',
    text: 'Navigation vers Gare de Lyon ?',
    time: '20:04',
    visualBlock: {
      type: 'voiceConfirm',
      destination: 'Gare de Lyon',
      countdown: 10,
    },
  },
  // 6. Confirmation voice
  {
    sender: 'voice',
    text: '🎙 "Oui"',
    time: '20:04',
  },
  // 7. Ajnaya lance — dopamine maximale
  {
    sender: 'ajnaya',
    text: 'C\'est parti. Navigation lancée — arrivée 20:08.',
    time: '20:04',
  },
  // 8. La récompense : course assignée
  {
    sender: 'ajnaya',
    text: 'Course assignée.',
    time: '20:16',
    visualBlock: {
      type: 'courseCard',
      from: 'Gare de Lyon',
      to: 'Neuilly-sur-Seine',
      amount: '34€',
      badge: 'Ajnaya • 87%',
    },
    watermark: 'SAFE',
  },
  // 9. L'enchaînement — le chauffeur comprend la boucle vertueuse
  {
    sender: 'ajnaya',
    text: 'Neuilly : concert au Théâtre des Sablons à 21h. Enchaînement estimé dans 8 min. On y va ?',
    time: '20:42',
    watermark: 'SAFE',
  },
]

// ─── Micro-cards ───────────────────────────────────────────
type CardColor = 'cyan' | 'purple' | 'green'

const colorClasses: Record<CardColor, { bg: string; text: string }> = {
  cyan: { bg: 'bg-accent-cyan/5 border-accent-cyan/20', text: 'text-accent-cyan' },
  purple: { bg: 'bg-accent-purple/5 border-accent-purple/20', text: 'text-accent-purple' },
  green: { bg: 'bg-green-500/5 border-green-500/20', text: 'text-green-400' },
}

const microCards: { title: string; desc: string; color: CardColor; side: 'left' | 'right' }[] = [
  {
    title: 'Le chauffeur demande',
    desc: 'Une question naturelle. Ajnaya comprend l\'intention et agit.',
    color: 'cyan',
    side: 'left',
  },
  {
    title: 'Logique terrain',
    desc: 'Horaires de trains, événements, affluence — expliqués, pas cachés.',
    color: 'purple',
    side: 'right',
  },
  {
    title: 'Snapshot Mapbox',
    desc: 'Carte intégrée au chat. Un regard, une décision. Zéro friction.',
    color: 'cyan',
    side: 'left',
  },
  {
    title: '+34€ en 1 course',
    desc: 'Bonne zone, bon timing. Le résultat parle.',
    color: 'green',
    side: 'right',
  },
  {
    title: 'Boucle vertueuse',
    desc: 'La course suivante est déjà calculée. Enchaînement sans temps mort.',
    color: 'purple',
    side: 'left',
  },
]

// ─── Visual block sub-components ───────────────────────────

function MapSnapshotBlock({ block }: { block: Extract<VisualBlock, { type: 'mapSnapshot' }> }) {
  return (
    <div className="mt-2.5 rounded-xl overflow-hidden border border-white/10">
      {/* Mapbox-style dark snapshot */}
      <div className="relative h-[75px] bg-[#080810]">
        <svg className="w-full h-full" viewBox="0 0 220 75" preserveAspectRatio="xMidYMid slice">
          <rect width="220" height="75" fill="#080810" />
          {/* Street grid - Paris style */}
          <path d="M 0 25 L 220 25" stroke="#111120" strokeWidth="0.6" />
          <path d="M 0 50 L 220 50" stroke="#111120" strokeWidth="0.6" />
          <path d="M 55 0 L 55 75" stroke="#111120" strokeWidth="0.6" />
          <path d="M 110 0 L 110 75" stroke="#111120" strokeWidth="0.6" />
          <path d="M 165 0 L 165 75" stroke="#111120" strokeWidth="0.6" />
          {/* Seine-like curve */}
          <path d="M 0 62 Q 60 55 110 60 Q 160 65 220 58" stroke="#0a1a2a" strokeWidth="3" fill="none" opacity="0.5" />
          {/* Diagonal boulevard */}
          <path d="M 15 70 Q 80 48 140 32 Q 180 22 215 18" stroke="#14142a" strokeWidth="1.2" fill="none" />
          {/* Route line — gradient */}
          <defs>
            <linearGradient id="snapRoute" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00D4FF" />
              <stop offset="100%" stopColor="#8C52FF" />
            </linearGradient>
          </defs>
          <path d="M 40 50 Q 90 44 140 30 Q 175 20 195 24" fill="none" stroke="url(#snapRoute)" strokeWidth="2.5" strokeLinecap="round" />
          {/* Origin pin — glow + solid */}
          <circle cx="40" cy="50" r="6" fill="#00D4FF" opacity="0.15" />
          <circle cx="40" cy="50" r="3.5" fill="#00D4FF" />
          <circle cx="40" cy="50" r="1.5" fill="#fff" />
          {/* Destination pin — glow + solid */}
          <circle cx="195" cy="24" r="6" fill="#8C52FF" opacity="0.15" />
          <circle cx="195" cy="24" r="3.5" fill="#8C52FF" />
          <circle cx="195" cy="24" r="1.5" fill="#fff" />
        </svg>
        {/* Location labels */}
        <div className="absolute bottom-1.5 left-2 right-2 flex justify-between">
          <span className="text-[7px] text-accent-cyan font-semibold bg-[#050508]/90 px-1.5 py-0.5 rounded-sm">{block.from}</span>
          <span className="text-[7px] text-accent-purple font-semibold bg-[#050508]/90 px-1.5 py-0.5 rounded-sm">{block.to}</span>
        </div>
        {/* SAFE watermark */}
        <div className="absolute top-1.5 right-2">
          <span className="text-[6px] text-green-400/50 font-mono tracking-widest">SAFE</span>
        </div>
      </div>
      {/* Bottom CTA bar */}
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
        {/* Countdown circle */}
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
        {/* Route */}
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
        {/* Amount + badge */}
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

  // Phone appears first
  const phoneOpacity = useTransform(scrollYProgress, [0, 0.06, 0.85, 0.95], [0, 1, 1, 0])
  const phoneScale = useTransform(scrollYProgress, [0, 0.06], [0.95, 1])
  const sectionOpacity = useTransform(scrollYProgress, [0, 0.08, 0.85, 0.95], [0, 1, 1, 0])

  // Messages appear progressively — start AFTER phone is visible (0.09)
  const msgCount = messages.length
  const msgOpacities = messages.map((_, i) => {
    const start = 0.09 + (i / msgCount) * 0.56
    const end = start + 0.04
    return useTransform(scrollYProgress, [start, end], [0, 1])
  })

  // Micro-cards — appear slightly after their corresponding message
  const cardOpacities = microCards.map((_, i) => {
    const start = 0.12 + (i / microCards.length) * 0.55
    const mid = start + 0.05
    const end = start + 0.22
    return {
      opacity: useTransform(scrollYProgress, [start, mid, end, end + 0.08], [0, 1, 1, 0]),
      y: useTransform(scrollYProgress, [start, mid], [24, 0]),
    }
  })

  // Chat scrolls up as messages accumulate — starts when 2nd message appears
  const chatScrollY = useTransform(scrollYProgress, [0.14, 0.78], [0, -580])

  return (
    <section ref={containerRef} className={`relative bg-foreas-deepblack ${isMobile ? 'h-[260vh]' : 'h-[420vh]'}`}>
      <div className="sticky top-0 h-screen flex flex-col items-center overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-foreas-deepblack via-foreas-black to-foreas-deepblack" />
        {!isMobile && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-accent-purple/[0.04] rounded-full blur-[100px]" />
        )}

        {/* Title — in flow, not absolute */}
        <motion.div
          style={{ opacity: sectionOpacity }}
          className="relative text-center z-20 px-4 pt-6 sm:pt-10 md:pt-14 pb-4 sm:pb-5 flex-shrink-0"
        >
          <h2 className="font-title text-2xl sm:text-3xl md:text-5xl text-white mb-1 sm:mb-2">
            Vous demandez. <span className="text-accent-cyan">Ajnaya agit.</span>
          </h2>
          <p className="text-white/40 text-xs sm:text-sm md:text-lg max-w-md mx-auto">
            Voix, texte, cartes — une conversation, pas un tableau de bord.
          </p>
        </motion.div>

        {/* Layout: left cards + phone + right cards — fills remaining space */}
        <motion.div
          style={{ opacity: sectionOpacity }}
          className="relative flex items-start justify-center gap-4 md:gap-8 lg:gap-12 flex-1 min-h-0"
        >
          {/* Left micro-cards (desktop) */}
          <div className="hidden lg:flex flex-col gap-5 w-[210px]">
            {microCards.filter(c => c.side === 'left').map((card, i) => {
              const idx = microCards.findIndex(c => c === card)
              return (
                <motion.div
                  key={i}
                  style={{ opacity: cardOpacities[idx].opacity, y: cardOpacities[idx].y }}
                  className={`p-4 rounded-2xl border backdrop-blur-md ${colorClasses[card.color].bg}`}
                >
                  <span className={`text-sm font-semibold ${colorClasses[card.color].text}`}>{card.title}</span>
                  <p className="text-white/50 text-xs leading-relaxed mt-1.5">{card.desc}</p>
                </motion.div>
              )
            })}
          </div>

          {/* ─── Phone Mockup ───────────────────────────── */}
          <motion.div className="relative" style={{ opacity: phoneOpacity, scale: phoneScale }}>
            {!isMobile && (
              <div className="absolute -inset-6 bg-gradient-to-b from-accent-purple/12 via-accent-cyan/6 to-transparent rounded-[4rem] blur-[50px] opacity-50" />
            )}

            <div className="relative w-[250px] sm:w-[270px] md:w-[290px] h-[480px] sm:h-[520px] md:h-[560px] bg-gradient-to-b from-[#1a1a1f] to-[#0d0d12] rounded-[2.8rem] p-[3px] shadow-2xl shadow-black/50">
              <div className="absolute inset-0 rounded-[2.8rem] border border-white/[0.08]" />

              {/* Phone screen — isolation forces proper paint containment for overflow clipping */}
              <div className="relative w-full h-full bg-[#050508] rounded-[2.6rem]" style={{ overflow: 'hidden', isolation: 'isolate' }}>
                {/* Dynamic Island */}
                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-[90px] h-[28px] bg-black rounded-full z-30" />

                {/* Status bar */}
                <div className="absolute top-3 left-6 right-6 flex justify-between items-center text-white text-[10px] font-medium z-20">
                  <span>20:03</span>
                  <div className="flex items-center gap-1 opacity-70">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z"/>
                    </svg>
                    <svg className="w-5 h-3" viewBox="0 0 28 14">
                      <rect x="0" y="0" width="24" height="14" rx="3" fill="none" stroke="currentColor" strokeWidth="1.5"/>
                      <rect x="2" y="2" width="17" height="10" rx="1.5" fill="currentColor"/>
                    </svg>
                  </div>
                </div>

                {/* Chat header — z-20 to sit above scrolling messages */}
                <div className="absolute top-12 left-0 right-0 z-20 px-4 pb-2.5 bg-[#050508] border-b border-white/[0.04]">
                  <div className="flex items-center gap-2.5">
                    {/* Ajnaya avatar */}
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
                    {/* Safe driving state */}
                    <div className="ml-auto flex items-center gap-1 bg-white/[0.04] px-2 py-0.5 rounded-full">
                      <div className="w-1 h-1 rounded-full bg-green-400" />
                      <span className="text-[7px] text-green-400/60 font-mono">STOPPED</span>
                    </div>
                  </div>
                </div>

                {/* ─── Chat scroll area — clipped zone between header and input ── */}
                <div className="absolute top-[88px] bottom-[58px] left-0 right-0 z-10" style={{ overflow: 'hidden' }}>
                  <motion.div
                    style={{ y: chatScrollY }}
                    className="px-3 space-y-2 pt-1 pb-4"
                  >
                    {messages.map((msg, i) => (
                      <motion.div
                        key={i}
                        style={{ opacity: msgOpacities[i] }}
                        className={`flex ${msg.sender === 'driver' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[88%] px-3 py-2 rounded-2xl ${
                            msg.sender === 'ajnaya'
                              ? 'bg-white/[0.05] border border-white/[0.04] rounded-tl-sm'
                              : msg.sender === 'voice'
                              ? 'bg-accent-purple/8 border border-accent-purple/15 rounded-tr-sm'
                              : 'bg-gradient-to-r from-accent-purple/20 to-accent-cyan/10 border border-accent-cyan/[0.08] rounded-tr-sm'
                          }`}
                        >
                          {/* Voice command label */}
                          {msg.sender === 'voice' && (
                            <div className="flex items-center gap-1.5 mb-1">
                              <div className="w-3.5 h-3.5 rounded-full bg-accent-purple/25 flex items-center justify-center">
                                <svg className="w-2 h-2 text-accent-purple" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                                  <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                                </svg>
                              </div>
                              <span className="text-[7px] text-accent-purple/50 font-mono tracking-wider">COMMANDE VOCALE</span>
                            </div>
                          )}

                          <p className={`text-[11px] leading-[1.5] ${
                            msg.sender === 'voice' ? 'text-accent-purple font-medium' : 'text-white/90'
                          }`}>{msg.text}</p>

                          {/* Visual blocks */}
                          {msg.visualBlock?.type === 'mapSnapshot' && (
                            <MapSnapshotBlock block={msg.visualBlock} />
                          )}
                          {msg.visualBlock?.type === 'voiceConfirm' && (
                            <VoiceConfirmBlock block={msg.visualBlock} />
                          )}
                          {msg.visualBlock?.type === 'courseCard' && (
                            <CourseCardBlock block={msg.visualBlock} />
                          )}

                          {/* Timestamp + watermark */}
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-white/20 text-[8px]">{msg.time}</span>
                            {msg.watermark && (
                              <span className="text-[6px] text-green-400/30 font-mono tracking-widest">{msg.watermark}</span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                </div>

                {/* ─── Input bar with mic button — z-20 above messages ── */}
                <div className="absolute bottom-5 left-3 right-3 z-20">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 flex items-center bg-[#050508] md:bg-[#050508]/95 md:backdrop-blur-md border border-white/[0.06] rounded-full px-3.5 py-2.5">
                      <span className="text-white/20 text-[10px]">Parlez ou écrivez...</span>
                    </div>
                    {/* Mic button — gradient, prominent */}
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-cyan to-accent-purple flex items-center justify-center shadow-lg shadow-accent-purple/25">
                      <svg className="w-4.5 h-4.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                        <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Home indicator */}
                <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-[100px] h-[4px] bg-white/15 rounded-full z-20" />
              </div>
            </div>
          </motion.div>

          {/* Right micro-cards (desktop) */}
          <div className="hidden lg:flex flex-col gap-5 w-[210px]">
            {microCards.filter(c => c.side === 'right').map((card, i) => {
              const idx = microCards.findIndex(c => c === card)
              return (
                <motion.div
                  key={i}
                  style={{ opacity: cardOpacities[idx].opacity, y: cardOpacities[idx].y }}
                  className={`p-4 rounded-2xl border backdrop-blur-md ${colorClasses[card.color].bg}`}
                >
                  <span className={`text-sm font-semibold ${colorClasses[card.color].text}`}>{card.title}</span>
                  <p className="text-white/50 text-xs leading-relaxed mt-1.5">{card.desc}</p>
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        {/* Mobile micro-cards */}
        <div className="lg:hidden absolute bottom-12 left-3 right-3 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {microCards.map((card, i) => (
            <motion.div
              key={i}
              style={{ opacity: cardOpacities[i].opacity }}
              className={`flex-shrink-0 p-2.5 rounded-xl border w-[150px] ${colorClasses[card.color].bg}`}
            >
              <span className={`text-[10px] font-semibold ${colorClasses[card.color].text}`}>{card.title}</span>
              <p className="text-white/40 text-[9px] leading-snug mt-0.5">{card.desc}</p>
            </motion.div>
          ))}
        </div>

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
