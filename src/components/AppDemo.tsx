'use client'

import { motion } from 'framer-motion'
import InteractivePhoneMockup from './InteractivePhoneMockup'

export default function AppDemo() {
  return (
    <section id="demo" className="relative py-24 bg-foreas-deepblack overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-accent-purple/[0.04] rounded-full blur-[150px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: Phone mockup */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex justify-center lg:justify-end order-2 lg:order-1"
          >
            <InteractivePhoneMockup />
          </motion.div>

          {/* Right: Content */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="order-1 lg:order-2"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium tracking-wider uppercase text-accent-purple/80 border border-accent-purple/20 rounded-full mb-6">
              <span className="w-1.5 h-1.5 bg-accent-purple rounded-full animate-pulse" />
              Démo interactive
            </span>

            <h2 className="font-title text-3xl md:text-5xl text-white mb-6">
              Explorez <span className="bg-gradient-to-r from-accent-purple to-accent-cyan bg-clip-text text-transparent">l'app</span>
            </h2>

            <p className="text-white/50 text-lg mb-8">
              Cliquez sur les onglets pour découvrir chaque fonctionnalité. C'est exactement ce que vous aurez dans votre poche.
            </p>

            {/* Feature highlights */}
            <div className="space-y-4 mb-8">
              {[
                {
                  icon: '🗺️',
                  title: 'Carte en temps réel',
                  description: 'Zones chaudes actualisées toutes les 30 secondes'
                },
                {
                  icon: '🤖',
                  title: 'Ajnaya IA',
                  description: 'Prédictions basées sur 847 chauffeurs actifs'
                },
                {
                  icon: '👥',
                  title: 'Communauté',
                  description: 'Partagez les bons plans entre chauffeurs'
                },
                {
                  icon: '📊',
                  title: 'Stats détaillées',
                  description: 'Suivez vos performances jour par jour'
                }
              ].map((feature, i) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-start gap-4 p-4 bg-white/[0.02] rounded-xl border border-white/5 hover:border-white/10 transition-colors"
                >
                  <span className="text-2xl">{feature.icon}</span>
                  <div>
                    <h3 className="text-white font-medium mb-1">{feature.title}</h3>
                    <p className="text-white/60 text-sm">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="/tarifs"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-accent-purple to-accent-cyan rounded-xl text-white font-semibold hover:opacity-90 transition-opacity"
              >
                Essayer gratuitement
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </a>

              <a
                href="#simulateur"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-white/10 rounded-xl text-white/70 hover:text-white hover:border-white/20 transition-all"
              >
                Calculer mes gains
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
