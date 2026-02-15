'use client'

import { motion } from 'framer-motion'

const testimonials = [
  {
    name: 'Karim M.',
    role: 'Chauffeur VTC Paris',
    avatar: 'KM',
    quote: "Depuis que j'utilise FOREAS, je fais +400€ par semaine. L'IA me dit exactement où aller, je ne tourne plus à vide.",
    stats: '+38% CA',
    rating: 5,
    color: 'from-accent-purple to-accent-cyan'
  },
  {
    name: 'Sarah L.',
    role: 'Chauffeure VTC Lyon',
    avatar: 'SL',
    quote: "Je travaille moins mais je gagne plus. Ajnaya m'a fait découvrir des zones que je n'aurais jamais trouvées seule.",
    stats: '-2h/jour de vide',
    rating: 5,
    color: 'from-accent-cyan to-accent-purple'
  },
  {
    name: 'David K.',
    role: 'Chauffeur VTC Paris',
    avatar: 'DK',
    quote: "L'essai gratuit m'a convaincu en 3 jours. Maintenant je ne peux plus m'en passer. C'est comme avoir un copilote intelligent.",
    stats: '+32% CA',
    rating: 5,
    color: 'from-accent-purple to-red-500'
  }
]

export default function Testimonials() {
  return (
    <section className="relative py-24 bg-foreas-deepblack overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-0 w-[200px] h-[200px] md:w-[400px] md:h-[400px] bg-accent-purple/[0.03] rounded-full blur-[60px] md:blur-[120px]" />
        <div className="absolute top-1/2 right-0 w-[200px] h-[200px] md:w-[400px] md:h-[400px] bg-accent-cyan/[0.03] rounded-full blur-[60px] md:blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium tracking-wider uppercase text-accent-cyan/80 border border-accent-cyan/20 rounded-full mb-6">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
            847 chauffeurs actifs
          </span>

          <h2 className="font-title text-3xl md:text-5xl text-white mb-4">
            Ils ont fait le <span className="text-accent-cyan">choix</span>
          </h2>
          <p className="text-white/50 text-lg max-w-xl mx-auto">
            Des résultats mesurés, pas des promesses.
          </p>
        </motion.div>

        {/* Testimonials grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="relative group"
            >
              {/* Card glow on hover */}
              <div className={`absolute -inset-1 bg-gradient-to-r ${testimonial.color} rounded-2xl blur-lg opacity-0 group-hover:opacity-20 transition-opacity duration-500`} />

              <div className="relative bg-gradient-to-b from-[#12121a] to-[#0a0a10] rounded-2xl border border-white/10 p-6 h-full flex flex-col">
                {/* Quote */}
                <p className="text-white/70 text-sm leading-relaxed mb-6 flex-1">
                  "{testimonial.quote}"
                </p>

                {/* Stats badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-500/10 rounded-lg border border-green-500/20 w-fit mb-4">
                  <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  <span className="text-green-400 text-sm font-medium">{testimonial.stats}</span>
                </div>

                {/* Author */}
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${testimonial.color} flex items-center justify-center text-white font-medium text-sm`}>
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">{testimonial.name}</p>
                    <p className="text-white/60 text-xs">{testimonial.role}</p>
                  </div>
                  <div className="ml-auto flex gap-0.5">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <svg key={i} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 flex flex-wrap items-center justify-center gap-8"
        >
          <div className="flex items-center gap-2 text-white/50">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
            </svg>
            <span className="text-sm">Données sécurisées</span>
          </div>
          <div className="flex items-center gap-2 text-white/50">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
            </svg>
            <span className="text-sm">Résultats vérifiés</span>
          </div>
          <div className="flex items-center gap-2 text-white/50">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            <span className="text-sm">Support 24/7</span>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
