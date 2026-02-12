'use client'

import { motion } from 'framer-motion'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

const values = [
  { title: 'Précision', desc: 'Données réelles.' },
  { title: 'Confiance', desc: 'Transparence totale.' },
  { title: 'Innovation', desc: 'Toujours en avance.' },
]

export default function AProposPage() {
  return (
    <main className="min-h-screen bg-[#050508]">
      <Header />

      {/* Hero */}
      <section className="pt-28 pb-16 md:pt-36 md:pb-24 px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="font-title text-4xl md:text-5xl lg:text-6xl font-semibold leading-[1.1] tracking-tight mb-4 md:mb-6"
          >
            <span className="text-white">Notre mission.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-body text-base md:text-lg text-white/50 max-w-lg mx-auto"
          >
            Donner aux chauffeurs le pouvoir de l'IA.
          </motion.p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 md:py-24 bg-[#08080d]">
        <div className="max-w-3xl mx-auto px-6 lg:px-8 space-y-6 md:space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-6 md:p-8 bg-white/[0.02] border border-white/[0.05] rounded-2xl"
          >
            <h2 className="font-title text-xl md:text-2xl font-semibold text-white mb-3 md:mb-4">Pourquoi</h2>
            <p className="text-sm md:text-base text-white/50 leading-relaxed">
              Les chauffeurs perdent des heures chaque jour. Attentes, zones mal choisies, courses à vide.
              L'IA peut changer ça.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="p-6 md:p-8 bg-white/[0.02] border border-white/[0.05] rounded-2xl"
          >
            <h2 className="font-title text-xl md:text-2xl font-semibold text-white mb-3 md:mb-4">Comment</h2>
            <p className="text-sm md:text-base text-white/50 leading-relaxed">
              Ajnaya analyse le marché en temps réel. Elle anticipe la demande.
              Elle guide vers les meilleures opportunités. Résultat : +35% de revenus.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="p-6 md:p-8 bg-white/[0.02] border border-white/[0.05] rounded-2xl"
          >
            <h2 className="font-title text-xl md:text-2xl font-semibold text-white mb-3 md:mb-4">Vision</h2>
            <p className="text-sm md:text-base text-white/50 leading-relaxed">
              La tech doit servir ceux qui travaillent. Pas les remplacer.
              FOREAS augmente les chauffeurs. Leur donne un avantage compétitif.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 md:py-24 bg-[#050508]">
        <div className="max-w-3xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-3 gap-4 md:gap-8">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center"
              >
                <h3 className="font-title text-base md:text-lg font-semibold text-white mb-1">{value.title}</h3>
                <p className="text-xs md:text-sm text-white/40">{value.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
