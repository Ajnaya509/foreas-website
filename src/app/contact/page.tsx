'use client'

import { motion } from 'framer-motion'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { Mail, MessageSquare, MapPin } from 'lucide-react'

const contacts = [
  { icon: Mail, title: 'Email', value: 'contact@foreas.net' },
  { icon: MessageSquare, title: 'Support', value: 'support@foreas.net' },
  { icon: MapPin, title: 'Siège', value: 'Paris, France' },
]

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-[#050508]">
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
                <p className="text-xs md:text-sm text-white/40">{item.value}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Form */}
      <section className="py-12 md:py-16 px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-6 md:p-8 bg-white/[0.02] border border-white/[0.05] rounded-2xl"
          >
            <h2 className="font-title text-xl md:text-2xl font-semibold text-white mb-6">Envoyez un message</h2>
            <form className="space-y-4 md:space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div>
                  <label className="block text-xs md:text-sm font-medium text-white/60 mb-2">Nom</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 text-sm md:text-base bg-[#0a0a10] rounded-xl border border-white/10 focus:border-accent-purple focus:outline-none transition-colors text-white placeholder-white/30"
                    placeholder="Votre nom"
                  />
                </div>
                <div>
                  <label className="block text-xs md:text-sm font-medium text-white/60 mb-2">Email</label>
                  <input
                    type="email"
                    className="w-full px-4 py-3 text-sm md:text-base bg-[#0a0a10] rounded-xl border border-white/10 focus:border-accent-purple focus:outline-none transition-colors text-white placeholder-white/30"
                    placeholder="vous@exemple.com"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs md:text-sm font-medium text-white/60 mb-2">Sujet</label>
                <select className="w-full px-4 py-3 text-sm md:text-base bg-[#0a0a10] rounded-xl border border-white/10 focus:border-accent-purple focus:outline-none transition-colors text-white">
                  <option>Question générale</option>
                  <option>Support technique</option>
                  <option>Partenariat</option>
                  <option>Presse</option>
                </select>
              </div>
              <div>
                <label className="block text-xs md:text-sm font-medium text-white/60 mb-2">Message</label>
                <textarea
                  rows={4}
                  className="w-full px-4 py-3 text-sm md:text-base bg-[#0a0a10] rounded-xl border border-white/10 focus:border-accent-purple focus:outline-none transition-colors resize-none text-white placeholder-white/30"
                  placeholder="Votre message..."
                />
              </div>
              <button
                type="submit"
                className="w-full px-6 py-3.5 md:py-4 text-sm md:text-base bg-gradient-to-r from-accent-purple to-accent-cyan text-white font-semibold rounded-xl hover:opacity-90 transition-opacity"
              >
                Envoyer
              </button>
            </form>
          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
