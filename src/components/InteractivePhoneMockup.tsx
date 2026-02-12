'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'

type TabId = 'accueil' | 'ajnaya' | 'social' | 'stats' | 'profil'

export default function InteractivePhoneMockup() {
  const [activeTab, setActiveTab] = useState<TabId>('accueil')

  const tabs: { id: TabId; icon: string; label: string }[] = [
    { id: 'accueil', icon: 'home', label: 'Accueil' },
    { id: 'ajnaya', icon: 'sparkle', label: 'Ajnaya' },
    { id: 'social', icon: 'users', label: 'Social' },
    { id: 'stats', icon: 'chart', label: 'Stats' },
    { id: 'profil', icon: 'user', label: 'Profil' },
  ]

  return (
    <div className="relative">
      {/* Outer glow layers */}
      <div className="absolute -inset-8 bg-gradient-to-b from-accent-purple/20 via-accent-cyan/10 to-transparent rounded-[4rem] blur-[60px] opacity-60" />
      <div className="absolute -inset-4 bg-gradient-to-b from-accent-purple/10 to-transparent rounded-[4rem] blur-[40px]" />

      {/* Phone container */}
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        className="relative"
      >
        {/* iPhone Frame */}
        <div className="relative w-[280px] md:w-[320px] h-[580px] md:h-[660px] bg-gradient-to-b from-[#1a1a1f] to-[#0d0d12] rounded-[3rem] p-[3px] shadow-2xl shadow-black/50">
          <div className="absolute inset-0 rounded-[3rem] border border-white/10" />

          {/* Screen area */}
          <div className="relative w-full h-full bg-[#050508] rounded-[2.8rem] overflow-hidden">
            {/* Dynamic Island */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-[100px] h-[32px] bg-black rounded-full z-20" />

            {/* Status bar */}
            <div className="absolute top-3 left-7 right-7 flex justify-between items-center text-white text-[11px] font-medium z-10">
              <span>20:08</span>
              <div className="flex items-center gap-1.5 opacity-80">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z"/>
                </svg>
                <svg className="w-6 h-3.5" viewBox="0 0 28 14">
                  <rect x="0" y="0" width="24" height="14" rx="3" fill="none" stroke="currentColor" strokeWidth="1.5"/>
                  <rect x="2" y="2" width="17" height="10" rx="1.5" fill="currentColor"/>
                </svg>
              </div>
            </div>

            {/* Screen Content */}
            <div className="absolute inset-0 pt-14">
              <AnimatePresence mode="wait">
                {activeTab === 'accueil' && <AccueilScreen key="accueil" />}
                {activeTab === 'ajnaya' && <AjnayaScreen key="ajnaya" />}
                {activeTab === 'social' && <SocialScreen key="social" />}
                {activeTab === 'stats' && <StatsScreen key="stats" />}
                {activeTab === 'profil' && <ProfilScreen key="profil" />}
              </AnimatePresence>

              {/* Bottom Navigation - Interactive */}
              <div className="absolute bottom-0 left-0 right-0 h-[72px] bg-[#0a0a10]/95 backdrop-blur-xl border-t border-white/[0.05] flex items-center justify-around px-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex flex-col items-center gap-1 py-2 px-3 rounded-xl transition-all ${
                      activeTab === tab.id ? 'text-white' : 'text-white/30 hover:text-white/50'
                    }`}
                  >
                    <div className={`w-5 h-5 ${activeTab === tab.id ? 'text-accent-cyan' : ''}`}>
                      {tab.icon === 'home' && (
                        <svg fill="currentColor" viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
                      )}
                      {tab.icon === 'sparkle' && (
                        <svg fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2z"/></svg>
                      )}
                      {tab.icon === 'users' && (
                        <svg fill="currentColor" viewBox="0 0 24 24"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
                      )}
                      {tab.icon === 'chart' && (
                        <svg fill="currentColor" viewBox="0 0 24 24"><path d="M3 13h2v8H3v-8zm4-6h2v14H7V7zm4-4h2v18h-2V3zm4 8h2v10h-2V11zm4-3h2v13h-2V8z"/></svg>
                      )}
                      {tab.icon === 'user' && (
                        <svg fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                      )}
                    </div>
                    <span className="text-[9px] font-medium">{tab.label}</span>
                    {activeTab === tab.id && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute bottom-2 w-1 h-1 bg-accent-cyan rounded-full"
                      />
                    )}
                  </button>
                ))}
              </div>

              {/* Home indicator */}
              <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-32 h-1 bg-white/20 rounded-full" />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

// Screen components
function AccueilScreen() {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="h-full pb-20"
    >
      {/* Map preview */}
      <div className="h-[45%] bg-[#0a0a12] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0a0a12]/50" />
        <div className="absolute top-4 left-4 px-3 py-1.5 bg-black/50 backdrop-blur rounded-lg">
          <span className="text-white text-xs">Paris 11e</span>
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="w-16 h-16 rounded-full bg-red-500/30 flex items-center justify-center">
            <span className="text-white font-bold">+35%</span>
          </div>
        </div>
      </div>

      {/* Ajnaya card */}
      <div className="px-4 -mt-4 relative z-10">
        <div className="bg-[#12121a] rounded-2xl p-4 border border-white/10">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-purple to-accent-cyan flex items-center justify-center">
              <span className="text-white text-xs">✦</span>
            </div>
            <span className="text-white/60 text-sm">Ajnaya recommande</span>
          </div>
          <p className="text-white font-medium mb-2">République • 12 min</p>
          <button className="w-full py-2.5 bg-gradient-to-r from-accent-purple to-accent-cyan rounded-xl text-white text-sm font-medium">
            Y aller →
          </button>
        </div>
      </div>
    </motion.div>
  )
}

function AjnayaScreen() {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="h-full pb-20 px-4 pt-4"
    >
      <h3 className="text-white font-semibold mb-4">Ajnaya IA</h3>

      <div className="space-y-3">
        <div className="bg-accent-purple/10 rounded-xl p-4 border border-accent-purple/20">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-green-400 text-xs">En analyse</span>
          </div>
          <p className="text-white text-sm">Zone République optimale dans 8 min</p>
        </div>

        <div className="bg-white/5 rounded-xl p-4">
          <p className="text-white/60 text-xs mb-2">Prédiction 30 min</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
              <div className="w-[75%] h-full bg-gradient-to-r from-accent-cyan to-accent-purple rounded-full" />
            </div>
            <span className="text-white text-sm">75%</span>
          </div>
        </div>

        <div className="bg-white/5 rounded-xl p-4">
          <p className="text-white/60 text-xs mb-2">Zones chaudes actives</p>
          <div className="flex gap-2">
            {['République', 'Bastille', 'Nation'].map(zone => (
              <span key={zone} className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-lg">
                {zone}
              </span>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function SocialScreen() {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="h-full pb-20 px-4 pt-4"
    >
      <h3 className="text-white font-semibold mb-4">Communauté</h3>

      <div className="space-y-3">
        {[
          { name: 'Karim M.', message: 'Zone Opéra fire ce soir 🔥', time: '2 min' },
          { name: 'Sarah L.', message: 'Évitez Châtelet, travaux', time: '15 min' },
          { name: 'David K.', message: '+280€ aujourd\'hui grâce à Ajnaya', time: '1h' },
        ].map((item, i) => (
          <div key={i} className="bg-white/5 rounded-xl p-3 flex gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-purple to-accent-cyan flex items-center justify-center text-white font-medium">
              {item.name[0]}
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-center mb-1">
                <span className="text-white text-sm font-medium">{item.name}</span>
                <span className="text-white/30 text-xs">{item.time}</span>
              </div>
              <p className="text-white/60 text-sm">{item.message}</p>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

function StatsScreen() {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="h-full pb-20 px-4 pt-4"
    >
      <h3 className="text-white font-semibold mb-4">Vos stats</h3>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-white/5 rounded-xl p-3 text-center">
          <p className="text-accent-cyan text-2xl font-bold">1 247€</p>
          <p className="text-white/40 text-xs">Cette semaine</p>
        </div>
        <div className="bg-white/5 rounded-xl p-3 text-center">
          <p className="text-green-400 text-2xl font-bold">+32%</p>
          <p className="text-white/40 text-xs">vs semaine dernière</p>
        </div>
      </div>

      <div className="bg-white/5 rounded-xl p-4">
        <p className="text-white/60 text-xs mb-3">CA journalier</p>
        <div className="flex items-end gap-1 h-24">
          {[60, 80, 45, 90, 75, 95, 70].map((h, i) => (
            <div
              key={i}
              className="flex-1 bg-gradient-to-t from-accent-purple to-accent-cyan rounded-t"
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
        <div className="flex justify-between text-white/30 text-[10px] mt-2">
          <span>L</span><span>M</span><span>M</span><span>J</span><span>V</span><span>S</span><span>D</span>
        </div>
      </div>
    </motion.div>
  )
}

function ProfilScreen() {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="h-full pb-20 px-4 pt-4"
    >
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-accent-purple to-accent-cyan flex items-center justify-center text-white text-xl font-bold">
          VT
        </div>
        <div>
          <h3 className="text-white font-semibold">Vitium</h3>
          <p className="text-accent-cyan text-sm">Premium • 847 courses</p>
        </div>
      </div>

      <div className="space-y-2">
        {[
          { icon: '⚙️', label: 'Paramètres' },
          { icon: '💳', label: 'Abonnement' },
          { icon: '📊', label: 'Historique' },
          { icon: '🎯', label: 'Objectifs' },
          { icon: '❓', label: 'Aide' },
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
            <span>{item.icon}</span>
            <span className="text-white text-sm">{item.label}</span>
            <svg className="w-4 h-4 text-white/30 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        ))}
      </div>
    </motion.div>
  )
}
