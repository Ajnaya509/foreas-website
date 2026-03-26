'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useSearchParams } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

interface VerifyData {
  success: boolean
  email?: string
  name?: string
  plan?: string
  trialEnd?: string
  subscriptionId?: string
  error?: string
}

const APP_STORE = 'https://apps.apple.com/app/foreas/id000000000'
const PLAY_STORE = 'https://play.google.com/store/apps/details?id=com.foreas.app'

function AnimatedCheck() {
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', damping: 12, stiffness: 200, delay: 0.2 }}
      className="w-20 h-20 mx-auto mb-8 rounded-full bg-accent-green/10 border-2 border-accent-green/30 flex items-center justify-center"
    >
      <svg className="w-10 h-10 text-accent-green" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <motion.path
          d="M4 12l5 5L20 7"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.5, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
    </motion.div>
  )
}

function StepItem({ step, title, subtitle, status }: {
  step: number; title: string; subtitle: string; status: 'done' | 'current' | 'upcoming'
}) {
  const colors = {
    done: 'bg-accent-green/15 border-accent-green/30 text-accent-green',
    current: 'bg-accent-cyan/15 border-accent-cyan/30 text-accent-cyan',
    upcoming: 'bg-white/5 border-white/10 text-white/30',
  }
  const icons = {
    done: '✓',
    current: '→',
    upcoming: '⏳',
  }
  return (
    <div className="flex items-start gap-4">
      <div className={`flex-shrink-0 w-10 h-10 rounded-full border ${colors[status]} flex items-center justify-center text-sm font-bold`}>
        {icons[status]}
      </div>
      <div className="pt-1">
        <p className="font-title text-base font-semibold text-white">{title}</p>
        <p className="text-sm text-white/40 mt-0.5">{subtitle}</p>
      </div>
    </div>
  )
}

export default function SuccessPage() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const [data, setData] = useState<VerifyData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!sessionId) {
      setData({ success: false, error: 'Aucune session trouvée' })
      setLoading(false)
      return
    }
    fetch(`/api/checkout/verify?session_id=${sessionId}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => { setData({ success: false, error: 'Erreur de vérification' }); setLoading(false) })
  }, [sessionId])

  const today = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <main className="min-h-screen bg-[#050508]">
      <Header />

      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28">
        {/* Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-to-b from-accent-green/6 via-accent-cyan/3 to-transparent rounded-full blur-[120px] pointer-events-none" />

        <div className="relative max-w-2xl mx-auto px-6">

          {/* ─── Chargement ─── */}
          {loading && (
            <div className="text-center py-20">
              <div className="w-12 h-12 mx-auto mb-6 rounded-full border-2 border-accent-cyan/30 border-t-accent-cyan animate-spin" />
              <p className="font-body text-base text-white/50">Vérification de ton paiement...</p>
            </div>
          )}

          {/* ─── Erreur ─── */}
          {!loading && (!data?.success) && (
            <div className="text-center py-20">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <span className="text-3xl">⚠️</span>
              </div>
              <h1 className="font-title text-2xl md:text-3xl font-semibold text-white mb-3">
                Quelque chose s'est mal passé
              </h1>
              <p className="font-body text-base text-white/50 mb-6">
                {data?.error || 'Impossible de vérifier le paiement.'}
              </p>
              <a href="/contact" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:text-white transition-all">
                Contacter le support
              </a>
            </div>
          )}

          {/* ─── Succès ─── */}
          {!loading && data?.success && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* A) Check animé + titre */}
              <AnimatedCheck />

              <motion.h1
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="font-title text-3xl md:text-4xl font-semibold text-center mb-3"
              >
                <span className="bg-gradient-to-r from-accent-cyan to-accent-purple bg-clip-text text-transparent">
                  Bienvenue dans FOREAS.
                </span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="font-body text-base text-white/50 text-center mb-10"
              >
                Ton essai gratuit est activé. Voici la suite.
              </motion.p>

              {/* B) Timeline des étapes */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="space-y-6 mb-12 p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06]"
              >
                <StepItem
                  step={1}
                  title="Inscription validée"
                  subtitle={today}
                  status="done"
                />
                <div className="ml-5 w-px h-4 bg-white/10" />
                <StepItem
                  step={2}
                  title="Télécharge l'app"
                  subtitle="Disponible sur iOS et Android"
                  status="current"
                />
                <div className="ml-5 w-px h-4 bg-white/10" />
                <StepItem
                  step={3}
                  title="Premier prélèvement"
                  subtitle={data.trialEnd ? `${data.trialEnd} · Plan ${data.plan}` : `Plan ${data.plan}`}
                  status="upcoming"
                />
              </motion.div>

              {/* C) Boutons téléchargement */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="text-center mb-10"
              >
                <div className="flex flex-col sm:flex-row gap-3 justify-center mb-4">
                  <a
                    href={APP_STORE}
                    className="inline-flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl border border-white/10 bg-white/[0.03] text-white/70 hover:text-white hover:border-white/20 transition-all"
                  >
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
                    <div className="text-left">
                      <div className="text-[10px] text-white/40 leading-none">Télécharger sur</div>
                      <div className="text-sm font-semibold">App Store</div>
                    </div>
                  </a>
                  <a
                    href={PLAY_STORE}
                    className="inline-flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl border border-white/10 bg-white/[0.03] text-white/70 hover:text-white hover:border-white/20 transition-all"
                  >
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M3.18 23.25c-.44-.25-.68-.71-.68-1.22V1.97c0-.51.24-.97.68-1.22l11.2 11.25-11.2 11.25zM14.89 14.5L5.62 23.18l12.15-6.82-2.88-1.86zm2.88-1.86l3.23 2.09c.44.28.73.78.73 1.27s-.29.99-.73 1.27l-3.23 2.09-3.18-3.36 3.18-3.36zM5.62.82L14.89 9.5 12.01 11.36 5.62.82z"/></svg>
                    <div className="text-left">
                      <div className="text-[10px] text-white/40 leading-none">Télécharger sur</div>
                      <div className="text-sm font-semibold">Google Play</div>
                    </div>
                  </a>
                </div>
                <p className="text-sm text-white/30">Tu recevras aussi le lien par email et SMS.</p>
              </motion.div>

              {/* D) Infos compte */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="p-5 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-2 mb-10"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/40">Ton compte</span>
                  <span className="text-sm text-white/70 font-mono">{data.email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/40">Plan</span>
                  <span className="text-sm text-white/70">{data.plan} — Essai gratuit jusqu'au {data.trialEnd}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/40">Support</span>
                  <a href="mailto:support@foreas.net" className="text-sm text-accent-cyan/60 hover:text-accent-cyan transition-colors">support@foreas.net</a>
                </div>
              </motion.div>

              {/* E) CTA secondaire */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
                className="text-center"
              >
                <a href="/chauffeurs" className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-accent-cyan transition-colors">
                  En attendant, explore ce qu'Ajnaya peut faire pour toi →
                </a>
              </motion.div>
            </motion.div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  )
}
