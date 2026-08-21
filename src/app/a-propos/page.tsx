'use client'

import { motion } from 'framer-motion'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

import MesureVue from '@/components/mesure/MesureVue'
const values = [
  // APROPOS-05 — « Données réelles » : le substrat du moteur de zones est SEMÉ,
  // pas réel. heatmap_zones : 30 lignes, source='seed_v1' sur les 30,
  // weather_factor et event_factor constants à 1, last_updated figé au 30/04/2026.
  // Les 295 prédictions portent à 100 % sur 9 zones semées (synth-local-0, bonus-*).
  // rides = 18 lignes, aucune coordonnée, rien depuis le 30/04.
  // Une promesse que n'importe qui peut recouper vaut mieux qu'un mot fort invérifiable.
  { title: 'Précision', desc: 'Sources vérifiables.' },
  { title: 'Confiance', desc: 'Transparence totale.' },
  { title: 'Innovation', desc: 'Toujours en avance.' },
]

export default function AProposPage() {
  return (
    <main className="min-h-screen bg-[#050508]">
      {/* La vue de cette page est comptée. Avant le 21/08/2026, aucune des
          dix pages commerciales n'avait de compteur : on connaissait les
          abonnements, jamais la page qui les avait produits. */}
      <MesureVue page="/a-propos" intention="general" audience="chauffeur" />
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
            Donner aux chauffeurs ce que les plateformes gardent pour elles.
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
              Ajnaya peut changer ça.
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
            {/*
              APROPOS-01 — « Ajnaya lit ce que paient vraiment les courses, zone par
              zone, heure par heure » : les trois dimensions sont démenties.
              · « ce que paient les courses » : rides = 18 lignes, dernière le 30/04/2026,
                0 sur les 30 derniers jours ;
              · « zone par zone » : 0 des 18 courses n'a de pickup_lat → aucun prix réel
                n'est rattachable à une zone, c'est structurellement impossible ;
              · « heure par heure » : 9 heures distinctes dans tout l'historique, et
                driver_ride_features (la table d'une lecture continue) = 0 ligne.
              Ce que la production renvoie réellement (/api/zones/live, 14/08) :
              sourcesUsed:["openweather","sncf","tomtom","idfm","bolt"] — d'où la phrase
              ci-dessous, mesurée vraie. On revient aux prix réels le jour où `rides`
              porte des coordonnées.
            */}
            <p className="text-sm md:text-base text-white/50 leading-relaxed">
              Ajnaya croise la météo, les transports et le trafic, zone par zone, heure par heure.
              Elle te dit où aller avant les autres. Résultat : tu arrêtes de rouler à vide.
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
                <p className="text-xs md:text-sm text-white/65">{value.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
