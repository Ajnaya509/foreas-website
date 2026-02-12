'use client'

import { motion } from 'framer-motion'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { Brain, Database, Zap, Shield, Globe, Cpu } from 'lucide-react'

const techFeatures = [
  { icon: Brain, title: 'Deep Learning', desc: '87% précision.' },
  { icon: Database, title: 'Temps réel', desc: 'Data pipeline live.' },
  { icon: Zap, title: '<100ms', desc: 'Latence recommandation.' },
  { icon: Shield, title: 'RGPD natif', desc: 'Chiffrement E2E.' },
  { icon: Globe, title: 'Scalable', desc: 'Cloud-native.' },
  { icon: Cpu, title: 'Edge AI', desc: 'Fonctionne offline.' },
]

const steps = [
  { num: '01', title: 'Collecte', desc: 'Terrain, météo, événements' },
  { num: '02', title: 'Analyse', desc: 'ML temps réel' },
  { num: '03', title: 'Prédiction', desc: 'Zone par zone' },
  { num: '04', title: 'Action', desc: 'Recommandation immédiate' },
]

const stats = [
  { value: '87%', label: 'Précision' },
  { value: '<100ms', label: 'Latence' },
  { value: '10M+', label: 'Prédictions/jour' },
  { value: '99.9%', label: 'Uptime' },
]

export default function TechnologiePage() {
  return (
    <main className="min-h-screen bg-[#050508]">
      <Header />

      {/* Hero */}
      <section className="pt-28 pb-16 md:pt-36 md:pb-24 px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium tracking-wider uppercase text-accent-cyan/80 border border-accent-cyan/20 rounded-full mb-6 md:mb-8">
              <span className="w-1.5 h-1.5 bg-accent-cyan rounded-full animate-pulse" />
              Propulsé par l'IA
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-title text-4xl md:text-5xl lg:text-6xl font-semibold leading-[1.1] tracking-tight mb-4 md:mb-6"
          >
            <span className="bg-gradient-to-r from-accent-cyan to-accent-purple bg-clip-text text-transparent">Ajnaya.</span>
            <span className="block text-white/60">L'IA qui vous fait gagner.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="font-body text-base md:text-lg text-white/50 max-w-lg mx-auto"
          >
            Prédiction. Précision. Performance.
          </motion.p>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 md:py-24 bg-[#08080d]">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12 md:mb-16"
          >
            <h2 className="font-title text-2xl md:text-3xl font-semibold text-white">
              Comment ça marche.
            </h2>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="font-title text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-accent-cyan to-accent-purple bg-clip-text text-transparent mb-2 md:mb-3">
                  {step.num}
                </div>
                <h3 className="font-title text-base md:text-lg font-semibold text-white mb-1">{step.title}</h3>
                <p className="text-xs md:text-sm text-white/40">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Grid */}
      <section className="py-16 md:py-24 bg-[#050508]">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12 md:mb-16"
          >
            <h2 className="font-title text-2xl md:text-3xl font-semibold text-white">
              Architecture.
            </h2>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {techFeatures.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
                className="p-5 md:p-6 bg-white/[0.02] border border-white/[0.05] rounded-2xl"
              >
                <div className="w-10 h-10 md:w-12 md:h-12 mb-3 md:mb-4 rounded-xl bg-accent-cyan/10 flex items-center justify-center">
                  <item.icon className="w-5 h-5 md:w-6 md:h-6 text-accent-cyan" />
                </div>
                <h3 className="font-title text-base md:text-lg font-semibold text-white mb-1">{item.title}</h3>
                <p className="text-xs md:text-sm text-white/40">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 md:py-24 bg-[#08080d]">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="font-title text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-accent-cyan to-accent-purple bg-clip-text text-transparent mb-1">
                  {stat.value}
                </div>
                <div className="text-xs md:text-sm text-white/40">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
