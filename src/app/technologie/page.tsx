'use client'

import { motion } from 'framer-motion'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { Layers, Database, Zap, Shield, Globe, Cpu } from 'lucide-react'
import { PLATEFORMES } from '@/lib/verite-commerciale'

import MesureVue from '@/components/mesure/MesureVue'
/**
 * TECH-04 + TECH-05 — « <100ms » était affiché DEUX FOIS sur cette page (tuile
 * Architecture + bloc Stats). Mesure du 14/08/2026 : 8 appels sur l'endpoint que
 * l'app appelle réellement (ZoneDecisionEngine → /api/zones/live) → 751, 206,
 * 158, 153, 146, 151, 154, 159 ms. AUCUNE réponse sous 100 ms ; min 146 ms,
 * médiane ~154 ms. Le client lui-même prévoit un budget de 4000 ms.
 * Une seule constante pour les deux emplacements : un chiffre écrit deux fois
 * finit toujours par n'être corrigé qu'une fois.
 */
const LATENCE_MESUREE = '~150 ms'

/**
 * Nombre de sources croisées à chaque calcul de zone. Mesuré le 14/08/2026 dans
 * la réponse de production de /api/zones/live :
 * sourcesUsed: ["openweather","sncf","tomtom","idfm","bolt"] → 5.
 */
const SOURCES_CROISEES = 5

/**
 * Prédictions posées depuis la création de la table.
 * `select count(*) from zone_predictions` → 295 le 14/08/2026.
 *
 * ⚠️ 21/08/2026 — CE CHIFFRE ÉTAIT AFFICHÉ SOUS « À CE JOUR ».
 *
 * Un nombre figé dans le code ne peut pas dire « à ce jour » : il dit toujours
 * le jour où quelqu'un l'a écrit. Une semaine plus tard la base en comptait
 * **339** — le visiteur lisait 295 en croyant lire aujourd'hui.
 *
 * Ce n'est pas une erreur de saisie, c'est une erreur de FORME : tant que la
 * page n'interroge pas la base, la seule phrase honnête porte la date de la
 * mesure. C'est ce que fait maintenant l'étiquette.
 *
 * (Le brancher en direct est possible, mais cette page est pré-rendue : ça
 * demanderait de la rendre dynamique pour un chiffre de vitrine. La date coûte
 * moins cher et ne ment pas.)
 */
const PREDICTIONS_POSEES = 295
const PREDICTIONS_MESUREES_LE = '14/08/2026'

const techFeatures = [
  // TECH-02 — « Deep Learning · 87% précision » : aucun modèle entraîné n'existe
  // (behavior_models : 30 lignes, sum(training_data_points) = 0 ; finder_ml_weights,
  // bandit_top_zones, pieuvre_zone_intelligence : 0 ligne ; aucune dépendance
  // d'inférence dans le package.json de l'app). Le moteur en ligne attribue chaque
  // zone à sources:["pattern"] — des règles, pas un réseau de neurones.
  { icon: Layers, title: 'Fusion de sources', desc: 'Météo, SNCF, IDFM, trafic — recoupés zone par zone.' },
  // TECH-09 — « Courses réelles · ce qui a vraiment été roulé » : ce n'est pas ce
  // que le moteur lit. rides = 18 lignes, dernière le 30/04/2026, et 0 ligne avec
  // pickup_lat → aucune course n'est rattachable à une zone. Les 295 prédictions
  // portent à 100 % sur 9 zones semées (heatmap_zones : source='seed_v1' sur 30/30).
  // ⚠️ 21/08/2026 — DISAIT « SOURCES PUBLIQUES · CHAQUE SOURCE EST VÉRIFIABLE ».
  // Les cinq sources mesurées sont openweather, sncf, tomtom, idfm et **bolt**.
  // Les quatre premières sont publiques ; la cinquième ne l'est pas, et personne
  // ne peut la vérifier de l'extérieur. La tuile juste au-dessus n'en nomme que
  // quatre — sous un compteur qui en annonce cinq. Le visiteur attentif comptait
  // donc quatre noms pour cinq sources, dont une invérifiable annoncée comme
  // vérifiable.
  { icon: Database, title: 'Sources ouvertes', desc: 'Quatre des cinq sources sont publiques et vérifiables.' },
  // TECH-04 — voir LATENCE_MESUREE ci-dessus.
  { icon: Zap, title: LATENCE_MESUREE, desc: 'Latence recommandation, mesurée.' },
  // TECH-06 — « Chiffrement E2E » : le E2E signifie que le serveur ne peut PAS lire.
  // Or au 14/08/2026 une simple regex SQL sur `drivers` sort 11 e-mails, 5 téléphones
  // et 14 prénoms en clair (email text, phone varchar, first_name varchar — aucune
  // colonne chiffrée). « Chiffré en transit et au repos » est vrai et défendable.
  { icon: Shield, title: 'RGPD natif', desc: 'Chiffré en transit et au repos.' },
  { icon: Globe, title: 'Scalable', desc: 'Cloud-native.' },
  // TECH-07 — « Edge AI · fonctionne offline » : aucune intelligence embarquée
  // n'existe (0 dépendance d'inférence dans FOREAS-Clean/package.json) et
  // ZoneDecisionEngine va chercher les zones sur le backend DISTANT puis renvoie
  // null s'il est injoignable. Ce qui survit vraiment au réseau coupé, c'est une
  // file d'attente (OFFLINE_QUEUE_KEY) et un mode dégradé d'initialisation.
  { icon: Cpu, title: 'Mode dégradé', desc: 'L’app reste utilisable sans réseau, elle rattrape ensuite.' },
]

const steps = [
  { num: '01', title: 'Collecte', desc: 'Terrain, météo, événements' },
  // TECH-08 — « ML temps réel » : aucun apprentissage ne tourne. behavior_models :
  // 30 lignes, training_data_points = 0 sur les 30 ; finder_ml_weights = 0 ligne.
  // La production renvoie sources:["pattern"] — une table de motifs horaires figés.
  { num: '02', title: 'Recoupement', desc: 'Météo, transports, trafic croisés' },
  { num: '03', title: 'Prédiction', desc: 'Zone par zone' },
  { num: '04', title: 'Action', desc: 'Recommandation immédiate' },
]

const stats = [
  // TECH-01 — « 87% Précision » : rien n'a jamais été vérifié. zone_predictions =
  // 295 lignes, was_right NULL sur 100 % ; zone_reliability : 9 zones, sample_size=0
  // et accuracy_pct NULL sur les 9 ; ai_predictions, prediction_monitoring,
  // ajnaya_prediction_feedback, pieuvre_surge_predictions = 0 ligne.
  // On affiche le seul chiffre qu'on sait compter : le volume posé.
  // Aucun pourcentage de précision ne revient tant que zone_reliability.accuracy_pct
  // est NULL. Vérification terrain en cours.
  { value: String(PREDICTIONS_POSEES), label: `Prédictions posées au ${PREDICTIONS_MESUREES_LE}` },
  // TECH-05 — second emplacement du « <100ms ». Même constante que la tuile.
  { value: LATENCE_MESUREE, label: 'Latence mesurée' },
  // TECH-03 — « 10M+ Prédictions/jour » : le record absolu est de 38 prédictions
  // en une journée (05/07/2026), et 295 en cumulé toutes époques confondues.
  // 10 000 000/jour = 263 000 fois le record. Remplacé par une mesure vraie :
  // sourcesUsed:["openweather","sncf","tomtom","idfm","bolt"] (production, 14/08).
  { value: String(SOURCES_CROISEES), label: 'Sources croisées' },
  // « 99.9% Uptime » : chiffre écrit en dur, relié à aucune mesure ni à aucune
  // sonde. Règle du canon — un chiffre public vient d'une mesure ou ne s'affiche
  // pas. Remplacé par une valeur qui, elle, sort de src/lib/verite-commerciale.ts
  // (select distinct platform from rides → Uber, Bolt, Heetch).
  { value: String(PLATEFORMES.nombre), label: 'Plateformes au même endroit' },
]

export default function TechnologiePage() {
  return (
    <main className="min-h-screen bg-[#050508]">
      {/* La vue de cette page est comptée. Avant le 21/08/2026, aucune des
          dix pages commerciales n'avait de compteur : on connaissait les
          abonnements, jamais la page qui les avait produits. */}
      <MesureVue page="/technologie" intention="ajnaya" audience="chauffeur" />
      <Header />

      {/* Hero */}
      <section className="pt-28 pb-16 md:pt-36 md:pb-24 px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium tracking-wider uppercase text-accent-cyan/80 border border-accent-cyan/20 rounded-full mb-6 md:mb-8">
              <span className="w-1.5 h-1.5 bg-accent-cyan rounded-full animate-pulse" />
              Propulsé par Ajnaya
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-title text-4xl md:text-5xl lg:text-6xl font-semibold leading-[1.1] tracking-tight mb-4 md:mb-6"
          >
            <span className="bg-gradient-to-r from-accent-cyan to-accent-purple bg-clip-text text-transparent">Ajnaya.</span>
            <span className="block text-white/60">Le copilote qui te fait gagner.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="font-body text-base md:text-lg text-white/50 max-w-lg mx-auto"
          >
            Prédiction. Précision. Performance.
          </motion.p>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 md:py-24 bg-[#08080d]">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12 md:mb-16"
          >
            <h2 className="font-title text-2xl md:text-3xl font-semibold text-white">
              Comment ça marche.
            </h2>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="font-title text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-accent-cyan to-accent-purple bg-clip-text text-transparent mb-2 md:mb-3">
                  {step.num}
                </div>
                <h3 className="font-title text-base md:text-lg font-semibold text-white mb-1">{step.title}</h3>
                <p className="text-xs md:text-sm text-white/65">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Grid */}
      <section className="py-16 md:py-24 bg-[#050508]">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12 md:mb-16"
          >
            <h2 className="font-title text-2xl md:text-3xl font-semibold text-white">
              Architecture.
            </h2>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {techFeatures.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
                className="p-5 md:p-6 bg-white/[0.02] border border-white/[0.05] rounded-2xl"
              >
                <div className="w-10 h-10 md:w-12 md:h-12 mb-3 md:mb-4 rounded-xl bg-accent-cyan/10 flex items-center justify-center">
                  <item.icon className="w-5 h-5 md:w-6 md:h-6 text-accent-cyan" />
                </div>
                <h3 className="font-title text-base md:text-lg font-semibold text-white mb-1">{item.title}</h3>
                <p className="text-xs md:text-sm text-white/65">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 md:py-24 bg-[#08080d]">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="font-title text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-accent-cyan to-accent-purple bg-clip-text text-transparent mb-1">
                  {stat.value}
                </div>
                <div className="text-xs md:text-sm text-white/65">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
