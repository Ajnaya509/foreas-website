'use client'

import { motion } from 'framer-motion'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { Mail, MessageSquare, MapPin } from 'lucide-react'
import FormulaireContact from '@/components/contact/FormulaireContact'

import MesureVue from '@/components/mesure/MesureVue'
const contacts = [
  { icon: Mail, title: 'Email', value: 'contact@foreas.net' },
  { icon: MessageSquare, title: 'Support', value: 'support@foreas.net' },
  { icon: MapPin, title: 'Siège', value: 'Paris, France' },
]

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-[#050508]">
      {/* La vue de cette page est comptée. Avant le 21/08/2026, aucune des
          dix pages commerciales n'avait de compteur : on connaissait les
          abonnements, jamais la page qui les avait produits. */}
      <MesureVue page="/contact" intention="general" audience="entreprise" />
      <Header />

      {/* Hero */}
      <section className="pt-28 pb-12 md:pt-36 md:pb-16 px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="font-title text-4xl md:text-5xl lg:text-6xl font-semibold leading-[1.1] tracking-tight mb-4 md:mb-6"
          >
            <span className="text-white">Contactez-nous.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-body text-base md:text-lg text-white/50"
          >
            Une question ? On répond vite.
          </motion.p>
        </div>
      </section>

      {/* Contact Info */}
      <section className="py-8 md:py-12 px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="grid grid-cols-3 gap-4 md:gap-6">
            {contacts.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center p-4 md:p-6"
              >
                <div className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-2 md:mb-3 rounded-xl bg-accent-purple/10 flex items-center justify-center">
                  <item.icon className="w-5 h-5 md:w-6 md:h-6 text-accent-purple" />
                </div>
                <h3 className="font-title text-sm md:text-base font-semibold text-white mb-1">{item.title}</h3>
                <p className="text-xs md:text-sm text-white/65">{item.value}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Form */}
      <section className="py-12 md:py-16 px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <FormulaireContact page="/contact" />
        </div>
      </section>

      <Footer />
    </main>
  )
}
