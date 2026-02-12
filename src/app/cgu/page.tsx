'use client'

import { motion } from 'framer-motion'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function CGUPage() {
  return (
    <main className="min-h-screen bg-[#050508]">
      <Header />

      <section className="pt-28 pb-16 md:pt-36 md:pb-24 px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="font-title text-3xl md:text-4xl font-semibold text-white mb-2">CGU</h1>
            <p className="text-sm text-white/30 mb-8 md:mb-12">Février 2026</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="space-y-6 md:space-y-8"
          >
            <div className="p-5 md:p-6 bg-white/[0.02] border border-white/[0.05] rounded-2xl">
              <h2 className="font-title text-lg md:text-xl font-semibold text-white mb-3">1. Objet</h2>
              <p className="text-sm md:text-base text-white/40 leading-relaxed">
                Ces CGU régissent l'utilisation de l'application FOREAS et des services associés.
              </p>
            </div>

            <div className="p-5 md:p-6 bg-white/[0.02] border border-white/[0.05] rounded-2xl">
              <h2 className="font-title text-lg md:text-xl font-semibold text-white mb-3">2. Acceptation</h2>
              <p className="text-sm md:text-base text-white/40 leading-relaxed">
                L'utilisation de FOREAS implique l'acceptation de ces conditions.
              </p>
            </div>

            <div className="p-5 md:p-6 bg-white/[0.02] border border-white/[0.05] rounded-2xl">
              <h2 className="font-title text-lg md:text-xl font-semibold text-white mb-3">3. Service</h2>
              <p className="text-sm md:text-base text-white/40 leading-relaxed">
                FOREAS fournit des recommandations IA pour les chauffeurs VTC et taxi : zones, horaires, positionnement.
              </p>
            </div>

            <div className="p-5 md:p-6 bg-white/[0.02] border border-white/[0.05] rounded-2xl">
              <h2 className="font-title text-lg md:text-xl font-semibold text-white mb-3">4. Responsabilité</h2>
              <p className="text-sm md:text-base text-white/40 leading-relaxed">
                Les recommandations sont indicatives. L'utilisateur reste responsable de ses décisions.
              </p>
            </div>

            <div className="p-5 md:p-6 bg-white/[0.02] border border-white/[0.05] rounded-2xl">
              <h2 className="font-title text-lg md:text-xl font-semibold text-white mb-3">5. Contact</h2>
              <p className="text-sm md:text-base text-white/40 leading-relaxed">
                Questions : legal@foreas.net
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
