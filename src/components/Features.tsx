'use client'

import { motion } from 'framer-motion'
import { TrendingUp, Clock, MapPin, Brain, Layers, Zap } from 'lucide-react'

const features = [
  {
    icon: TrendingUp,
    // 14/08/2026 — « 7 apps » : select distinct platform from rides → Uber, Bolt,
    // Heetch (+ « Private » = course directe) = 3 plateformes réelles.
    title: 'Tes 3 apps en 1 écran',
    description: 'Uber, Bolt, Heetch, au même endroit.',
    color: 'from-green-500 to-emerald-500',
    iconBg: 'bg-green-500/10',
    iconColor: 'text-green-400',
  },
  {
    icon: Clock,
    // 14/08/2026 — disait « Arrivez avant la demande. » Deux défauts : le
    // vouvoiement (la voix FOREAS tutoie) et une lecture de la demande qui
    // n'existe pas — pieuvre_h3_demand_zones, pieuvre_zone_intelligence,
    // extracted_surge_data → 0 ligne chacune. Ce qui EST mesuré, c'est le délai
    // de réponse : POST /api/ajnaya/home-modal en production → 4,66 s (CDG) et
    // 5,51 s (La Défense) le 14/08/2026.
    title: 'Zéro temps mort',
    description: 'Tu poses la question, tu as la réponse en secondes.',
    color: 'from-blue-500 to-cyan-500',
    iconBg: 'bg-blue-500/10',
    iconColor: 'text-blue-400',
  },
  {
    icon: MapPin,
    // 14/08/2026 — « Temps réel. » : aucune source continue n'existe.
    // extracted_surge_data → 0 ligne, pieuvre_surge_predictions → 0 ligne,
    // pieuvre_h3_demand_zones → 0 ligne ; en production l'API zone renvoie
    // is_estimate=true et data_state="NO_DATA_COLLECTED_YET". La modale affiche
    // déjà le badge « ESTIMATION » dans ce cas — cette tuile s'aligne dessus.
    title: 'Zones chaudes',
    description: 'Ta zone, auditée avant de démarrer.',
    color: 'from-orange-500 to-amber-500',
    iconBg: 'bg-orange-500/10',
    iconColor: 'text-orange-400',
  },
  {
    icon: Brain,
    // 14/08/2026 — titre « IA prédictive » : mot banni (verite-commerciale
    // MOT_INTERDIT_IA), mesuré 2 fois dans le HTML servi par /509. Et
    // « Elle apprend. » n'est adossé à rien : zone_predictions → 295 lignes dont
    // 0 vérifiée (was_right NULL partout), ajnaya_prediction_feedback → 0 ligne.
    // Rien ne peut apprendre d'une prédiction jamais notée. Ajnaya a un nom.
    title: 'Ajnaya',
    description: 'Elle regarde tes courses, pas des moyennes.',
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
