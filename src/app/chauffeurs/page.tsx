'use client'

import { motion } from 'framer-motion'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { TrendingUp, Clock, MapPin, Layers } from 'lucide-react'

const benefits = [
  {
    icon: TrendingUp,
    stat: '+35%',
    label: 'de CA',
    desc: 'Moyenne terrain. Paris.',
  },
  {
    icon: Clock,
    stat: '–2h',
    label: 'de vide',
    desc: 'Chaque jour.',
  },
  {
    icon: MapPin,
    stat: '87%',
    label: 'précision',
    desc: 'Validé terrain.',
  },
  {
    icon: Layers,
    stat: '5+',
    label: 'apps',
    desc: 'Une seule vue.',
  },
]

export default function ChauffeursPage() {
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
              <span className="w-1.5 h-1.5 bg-accent-green rounded-full animate-pulse" />
              Pour chauffeurs VTC
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-title text-4xl md:text-5xl lg:text-6xl font-semibold leading-[1.1] tracking-tight mb-4 md:mb-6"
          >
            <span className="text-white">Gagnez plus.</span>
            <span className="block bg-gradient-to-r from-accent-cyan to-accent-purple bg-clip-text text-transparent">Roulez moins.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="font-body text-base md:text-lg text-white/50 max-w-lg mx-auto mb-8 md:mb-10"
          >
            L'IA qui voit la demande avant qu'elle arrive.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center"
          >
            <a
              href="#telecharger"
              className="group relative inline-flex items-center justify-center gap-2 px-6 py-3.5 md:px-8 md:py-4 text-sm md:text-base font-semibold text-white overflow-hidden rounded-xl md:rounded-2xl transition-all hover:scale-[1.02]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-accent-purple to-accent-purple/80 group-hover:to-accent-cyan/80 transition-all" />
              <span className="relative">Essayer gratuitement</span>
            </a>
            <a
              href="#avantages"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 md:px-8 md:py-4 text-sm md:text-base font-medium text-white/70 hover:text-white border border-white/10 hover:border-white/20 rounded-xl md:rounded-2xl transition-all"
            >
              Voir les résultats
            </a>
          </motion.div>
        </div>
      </section>

      {/* Stats Grid */}
      <section id="avantages" className="py-16 md:py-24 bg-[#08080d]">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {benefits.map((item, index) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="p-5 md:p-6 bg-white/[0.02] border border-white/[0.05] rounded-2xl text-center"
              >
                <div className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-3 md:mb-4 rounded-xl bg-accent-purple/10 flex items-center justify-center">
                  <item.icon className="w-5 h-5 md:w-6 md:h-6 text-accent-purple" />
                </div>
                <div className="font-title text-2xl md:text-3xl font-bold text-white mb-1">{item.stat}</div>
                <div className="text-sm md:text-base text-white/60 mb-1">{item.label}</div>
                <div className="text-xs md:text-sm text-white/30">{item.desc}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Simple CTA */}
      <section className="py-16 md:py-24 bg-[#050508]">
        <div className="max-w-2xl mx-auto px-6 lg:px-8 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-title text-2xl md:text-3xl lg:text-4xl font-semibold text-white mb-4 md:mb-6"
          >
            847 chauffeurs avant vous.
          </motion.h2>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            <a
              href="#telecharger"
              className="group relative inline-flex items-center justify-center gap-2 px-6 py-3.5 md:px-8 md:py-4 text-sm md:text-base font-semibold text-white overflow-hidden rounded-xl md:rounded-2xl transition-all hover:scale-[1.02]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-accent-purple to-accent-cyan transition-all" />
              <span className="relative">Commencer</span>
            </a>
          </motion.div>
          <p className="mt-4 text-white/30 text-xs md:text-sm">
            Résiliable en 1 clic
          </p>
        </div>
      </section>

      <Footer />
    </main>
  )
}
