'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

type Device = 'ios' | 'android' | 'desktop'

function detectDevice(): Device {
  if (typeof navigator === 'undefined') return 'desktop'
  const ua = navigator.userAgent
  if (/iPhone|iPad|iPod/i.test(ua)) return 'ios'
  if (/Android/i.test(ua)) return 'android'
  return 'desktop'
}

const APP_STORE = 'https://apps.apple.com/app/foreas/id000000000'
const PLAY_STORE = 'https://play.google.com/store/apps/details?id=com.foreas.app'

export default function DownloadPage() {
  const [device, setDevice] = useState<Device>('desktop')

  useEffect(() => {
    setDevice(detectDevice())
  }, [])

  return (
    <main className="min-h-screen bg-[#050508]">
      <Header />

      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-to-b from-accent-purple/8 via-accent-cyan/4 to-transparent rounded-full blur-[120px] pointer-events-none" />

        <div className="relative max-w-2xl mx-auto px-6 text-center">
          {/* Check animé */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 15, stiffness: 200 }}
            className="w-20 h-20 mx-auto mb-8 rounded-full bg-accent-cyan/10 border border-accent-cyan/20 flex items-center justify-center"
          >
            <svg className="w-10 h-10 text-accent-cyan" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <motion.path
                d="M4 12l5 5L20 7"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              />
            </svg>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="font-title text-3xl md:text-4xl font-semibold text-white mb-4"
          >
            Télécharge l'app
            <span className="block bg-gradient-to-r from-accent-cyan to-accent-purple bg-clip-text text-transparent">
              FOREAS
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="font-body text-base text-white/50 mb-10 max-w-md mx-auto"
          >
            L'app FOREAS arrive bientôt sur les stores. En attendant, tu peux
            accéder à la webapp directement.
          </motion.p>

          {/* Boutons téléchargement */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-4 mb-10"
          >
            {/* Webapp CTA */}
            <a
              href="/"
              className="group relative inline-flex items-center justify-center gap-2 w-full max-w-sm px-8 py-4 text-base font-semibold text-white overflow-hidden rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-accent-purple to-accent-cyan" />
              <span className="relative">Accéder à la webapp</span>
              <svg className="relative w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>

            {/* Store buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href={APP_STORE}
                className={`inline-flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl border border-white/10 bg-white/[0.03] text-white/70 hover:text-white hover:border-white/20 transition-all ${device === 'ios' ? 'ring-2 ring-accent-cyan/30' : ''}`}
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
                <div className="text-left">
                  <div className="text-[10px] text-white/40 leading-none">Bientôt sur</div>
                  <div className="text-sm font-semibold">App Store</div>
                </div>
              </a>
              <a
                href={PLAY_STORE}
                className={`inline-flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl border border-white/10 bg-white/[0.03] text-white/70 hover:text-white hover:border-white/20 transition-all ${device === 'android' ? 'ring-2 ring-accent-cyan/30' : ''}`}
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M3.18 23.25c-.44-.25-.68-.71-.68-1.22V1.97c0-.51.24-.97.68-1.22l11.2 11.25-11.2 11.25zM14.89 14.5L5.62 23.18l12.15-6.82-2.88-1.86zm2.88-1.86l3.23 2.09c.44.28.73.78.73 1.27s-.29.99-.73 1.27l-3.23 2.09-3.18-3.36 3.18-3.36zM5.62.82L14.89 9.5 12.01 11.36 5.62.82z"/></svg>
                <div className="text-left">
                  <div className="text-[10px] text-white/40 leading-none">Bientôt sur</div>
                  <div className="text-sm font-semibold">Google Play</div>
                </div>
              </a>
            </div>
          </motion.div>

          {/* Info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white/40"
          >
            L'app native est en cours de validation sur les stores.
            Tu seras notifié par email dès qu'elle sera disponible.
          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
