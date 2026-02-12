'use client'

import { motion } from 'framer-motion'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function ConfidentialitePage() {
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
            <h1 className="font-title text-3xl md:text-4xl font-semibold text-white mb-2">Confidentialité</h1>
            <p className="text-sm text-white/30 mb-8 md:mb-12">Février 2026</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="space-y-6 md:space-y-8"
          >
            <div className="p-5 md:p-6 bg-white/[0.02] border border-white/[0.05] rounded-2xl">
              <h2 className="font-title text-lg md:text-xl font-semibold text-white mb-3">1. Responsable</h2>
              <p className="text-sm md:text-base text-white/40 leading-relaxed">
                FOREAS Labs, Paris, France.
              </p>
            </div>

            <div className="p-5 md:p-6 bg-white/[0.02] border border-white/[0.05] rounded-2xl">
              <h2 className="font-title text-lg md:text-xl font-semibold text-white mb-3">2. Données collectées</h2>
              <p className="text-sm md:text-base text-white/40 leading-relaxed">
                Identification (nom, email) • Géolocalisation (consentement) • Usage app • Activité pro.
              </p>
            </div>

            <div className="p-5 md:p-6 bg-white/[0.02] border border-white/[0.05] rounded-2xl">
              <h2 className="font-title text-lg md:text-xl font-semibold text-white mb-3">3. Finalités</h2>
              <p className="text-sm md:text-base text-white/40 leading-relaxed">
                Services IA • Amélioration algorithmes • Personnalisation • Communication.
              </p>
            </div>

            <div className="p-5 md:p-6 bg-white/[0.02] border border-white/[0.05] rounded-2xl">
              <h2 className="font-title text-lg md:text-xl font-semibold text-white mb-3">4. Vos droits</h2>
              <p className="text-sm md:text-base text-white/40 leading-relaxed">
                RGPD : accès, rectification, effacement, portabilité, opposition. Contact : privacy@foreas.net
              </p>
            </div>

            <div className="p-5 md:p-6 bg-white/[0.02] border border-white/[0.05] rounded-2xl">
              <h2 className="font-title text-lg md:text-xl font-semibold text-white mb-3">5. Sécurité</h2>
              <p className="text-sm md:text-base text-white/40 leading-relaxed">
                Chiffrement E2E. Mesures techniques et organisationnelles appropriées.
              </p>
            </div>

            <div className="p-5 md:p-6 bg-white/[0.02] border border-white/[0.05] rounded-2xl">
              <h2 className="font-title text-lg md:text-xl font-semibold text-white mb-3">6. DPO</h2>
              <p className="text-sm md:text-base text-white/40 leading-relaxed">
                Contact : dpo@foreas.net
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
