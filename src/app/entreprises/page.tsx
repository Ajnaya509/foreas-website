'use client'

import { motion } from 'framer-motion'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { Database, LineChart, Building2, Globe, Shield, Handshake } from 'lucide-react'

const solutions = [
  {
    icon: Database,
    title: 'Licensing Data',
    desc: 'Données mobilité uniques.',
  },
  {
    icon: LineChart,
    title: 'API Intelligence',
    desc: 'Intégration directe.',
  },
  {
    icon: Building2,
    title: 'Flottes',
    desc: 'Insights temps réel.',
  },
  {
    icon: Globe,
    title: 'Smart Cities',
    desc: 'Données anonymisées.',
  },
  {
    icon: Shield,
    title: 'Assurance',
    desc: 'Scoring comportemental.',
  },
  {
    icon: Handshake,
    title: 'Partenariats',
    desc: 'Co-développement.',
  },
]

export default function EntreprisesPage() {
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
            <span className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium tracking-wider uppercase text-accent-purple/80 border border-accent-purple/20 rounded-full mb-6 md:mb-8">
              B2B & Partenaires
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-title text-4xl md:text-5xl lg:text-6xl font-semibold leading-[1.1] tracking-tight mb-4 md:mb-6"
          >
            <span className="text-white">Intelligence FOREAS.</span>
            <span className="block bg-gradient-to-r from-accent-purple to-accent-cyan bg-clip-text text-transparent">Pour votre entreprise.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="font-body text-base md:text-lg text-white/50 max-w-lg mx-auto mb-8 md:mb-10"
          >
            Licensing IA. API. Données mobilité.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center"
          >
            <a
              href="/contact"
              className="group relative inline-flex items-center justify-center gap-2 px-6 py-3.5 md:px-8 md:py-4 text-sm md:text-base font-semibold text-white overflow-hidden rounded-xl md:rounded-2xl transition-all hover:scale-[1.02]"
            >
              <div className="absolute inset-0 bg-accent-purple group-hover:bg-accent-purple/90 transition-all" />
              <span className="relative">Demander une démo</span>
            </a>
            <a
              href="#solutions"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 md:px-8 md:py-4 text-sm md:text-base font-medium text-white/70 hover:text-white border border-white/10 hover:border-white/20 rounded-xl md:rounded-2xl transition-all"
            >
              Nos solutions
            </a>
          </motion.div>
        </div>
      </section>

      {/* Solutions Grid */}
      <section id="solutions" className="py-16 md:py-24 bg-[#08080d]">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12 md:mb-16"
          >
            <h2 className="font-title text-2xl md:text-3xl lg:text-4xl font-semibold text-white">
              Briques d'intelligence.
              <span className="block text-white/40">Prêtes à intégrer.</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {solutions.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
                className="group p-5 md:p-6 bg-white/[0.02] border border-white/[0.05] rounded-2xl hover:border-accent-purple/30 transition-colors"
              >
                <div className="w-10 h-10 md:w-12 md:h-12 mb-3 md:mb-4 rounded-xl bg-accent-purple/10 flex items-center justify-center group-hover:bg-accent-purple/20 transition-colors">
                  <item.icon className="w-5 h-5 md:w-6 md:h-6 text-accent-purple" />
                </div>
                <h3 className="font-title text-base md:text-lg font-semibold text-white mb-1">{item.title}</h3>
                <p className="text-xs md:text-sm text-white/40">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-24 bg-[#050508]">
        <div className="max-w-2xl mx-auto px-6 lg:px-8 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-title text-2xl md:text-3xl lg:text-4xl font-semibold text-white mb-4 md:mb-6"
          >
            Discutons.
          </motion.h2>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            <a
              href="/contact"
              className="group relative inline-flex items-center justify-center gap-2 px-6 py-3.5 md:px-8 md:py-4 text-sm md:text-base font-semibold text-white overflow-hidden rounded-xl md:rounded-2xl transition-all hover:scale-[1.02]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-accent-purple to-accent-cyan transition-all" />
              <span className="relative">Contactez-nous</span>
            </a>
          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
