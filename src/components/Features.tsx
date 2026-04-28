'use client'

import { motion } from 'framer-motion'
import { TrendingUp, Clock, MapPin, Brain, Layers, Zap } from 'lucide-react'

const features = [
  {
    icon: TrendingUp,
    title: '+35% de CA',
    description: 'Moyenne terrain. Paris.',
    color: 'from-green-500 to-emerald-500',
    iconBg: 'bg-green-500/10',
    iconColor: 'text-green-400',
  },
  {
    icon: Clock,
    title: 'Zéro temps mort',
    description: 'Arrivez avant la demande.',
    color: 'from-blue-500 to-cyan-500',
    iconBg: 'bg-blue-500/10',
    iconColor: 'text-blue-400',
  },
  {
    icon: MapPin,
    title: 'Zones chaudes',
    description: 'Temps réel. Avant de démarrer.',
    color: 'from-orange-500 to-amber-500',
    iconBg: 'bg-orange-500/10',
    iconColor: 'text-orange-400',
  },
  {
    icon: Brain,
    title: 'IA prédictive',
    description: 'Elle apprend. Elle anticipe.',
    color: 'from-purple-500 to-violet-500',
    iconBg: 'bg-purple-500/10',
    iconColor: 'text-purple-400',
  },
  {
    icon: Layers,
    title: 'Multi-app',
    description: 'Uber, Bolt, Heetch. Une seule vue.',
    color: 'from-pink-500 to-rose-500',
    iconBg: 'bg-pink-500/10',
    iconColor: 'text-pink-400',
  },
  {
    icon: Zap,
    title: 'Alertes smart',
    description: 'Que du signal. Zéro bruit.',
    color: 'from-yellow-500 to-orange-500',
    iconBg: 'bg-yellow-500/10',
    iconColor: 'text-yellow-400',
  },
]

export default function Features() {
  return (
    <section className="relative py-32 lg:py-40 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[#050508]" />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 50% 30% at 20% 50%, rgba(140, 82, 255, 0.04) 0%, transparent 50%),
            radial-gradient(ellipse 50% 30% at 80% 50%, rgba(0, 212, 255, 0.03) 0%, transparent 50%)
          `
        }}
      />

      <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <motion.span
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="inline-block text-xs font-semibold tracking-[0.2em] uppercase text-accent-purple mb-4"
          >
            Fonctionnalités
          </motion.span>
          <h2 className="font-title text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-white mb-6">
            Chaque fonction
            <span className="block bg-gradient-to-r from-accent-purple to-accent-cyan bg-clip-text text-transparent">
              rapporte.
            </span>
          </h2>
        </motion.div>

        {/* Features grid - Bento style */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.08 }}
              className="group relative"
            >
              <div className="relative h-full p-8 rounded-3xl bg-white/[0.02] border border-white/[0.05] md:backdrop-blur-sm overflow-hidden transition-all duration-500 hover:bg-white/[0.04] hover:border-white/10">
                {/* Hover glow */}
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-10 blur-3xl transition-opacity duration-500`} />

                {/* Icon */}
                <div className={`relative w-14 h-14 mb-6 rounded-2xl ${feature.iconBg} flex items-center justify-center transition-transform duration-300 group-hover:scale-110`}>
                  <feature.icon className={`w-7 h-7 ${feature.iconColor}`} strokeWidth={1.5} />
                </div>

                {/* Content */}
                <h3 className="font-title text-xl font-semibold text-white mb-3 tracking-tight">
                  {feature.title}
                </h3>
                <p className="font-body text-[15px] text-white/60 leading-relaxed">
                  {feature.description}
                </p>

                {/* Bottom line accent */}
                <div className={`absolute bottom-0 left-8 right-8 h-px bg-gradient-to-r ${feature.color} opacity-0 group-hover:opacity-30 transition-opacity duration-500`} />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
