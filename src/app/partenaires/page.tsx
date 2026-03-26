'use client'

import { motion } from 'framer-motion'
import dynamic from 'next/dynamic'
import Header from '@/components/Header'
import GradientLine from '@/components/GradientLine'
import Footer from '@/components/Footer'

// ═══════════════════════════════════════════════════════════════════════════════
// FOREAS /partenaires — BIG DOMINO PARTENAIRE FLOTTES
// Audience : gestionnaires de flottes VTC, sociétés capacitaires,
// sociétés de transport avec chauffeurs salariés/partenaires
// Structure : Frustration fleet ↔ Désir fleet → FOREAS = solution
// Deep scroll : primaire → secondaire → tertiaire → preuve → close
// ═══════════════════════════════════════════════════════════════════════════════

const Testimonials = dynamic(() => import('@/components/Testimonials'))

// ─── Dualité Card ────────────────────────────────────────────────────────────
function DualityBlock({
  frustration,
  desir,
  delay = 0,
}: {
  frustration: { title: string; desc: string }
  desir: { title: string; desc: string }
  delay?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
      className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6"
    >
      <div className="relative p-6 md:p-8 rounded-2xl border border-red-500/10 bg-red-500/[0.03] overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-red-500/60 to-transparent" />
        <div className="text-red-400/60 text-xs font-mono uppercase tracking-widest mb-3">Frustration</div>
        <h3 className="font-title text-xl md:text-2xl font-semibold text-white mb-2">{frustration.title}</h3>
        <p className="font-body text-sm md:text-base text-white/50 leading-relaxed">{frustration.desc}</p>
      </div>
      <div className="relative p-6 md:p-8 rounded-2xl border border-accent-cyan/10 bg-accent-cyan/[0.03] overflow-hidden">
        <div className="absolute top-0 right-0 w-1 h-full bg-gradient-to-b from-accent-cyan/60 to-transparent" />
        <div className="text-accent-cyan/60 text-xs font-mono uppercase tracking-widest mb-3">Avec FOREAS</div>
        <h3 className="font-title text-xl md:text-2xl font-semibold text-white mb-2">{desir.title}</h3>
        <p className="font-body text-sm md:text-base text-white/50 leading-relaxed">{desir.desc}</p>
      </div>
    </motion.div>
  )
}

// ─── Section Title ───────────────────────────────────────────────────────────
function SectionTitle({ eyebrow, title, gradient, subtitle }: {
  eyebrow?: string; title: string; gradient?: string; subtitle?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="text-center mb-12 md:mb-16"
    >
      {eyebrow && (
        <span className="inline-block text-xs font-mono uppercase tracking-widest text-accent-purple/50 mb-4">
          {eyebrow}
        </span>
      )}
      <h2 className="font-title text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-white mb-4">
        {title}
        {gradient && (
          <span className="block bg-gradient-to-r from-accent-purple to-accent-cyan bg-clip-text text-transparent">
            {gradient}
          </span>
        )}
      </h2>
      {subtitle && (
        <p className="font-body text-base md:text-lg text-white/45 max-w-xl mx-auto">{subtitle}</p>
      )}
    </motion.div>
  )
}

// ─── Feature Card ────────────────────────────────────────────────────────────
function FeatureCard({ icon, title, desc, delay = 0 }: {
  icon: string; title: string; desc: string; delay?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-30px' }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
      className="p-5 md:p-6 rounded-2xl border border-white/[0.05] bg-white/[0.02] hover:border-accent-purple/20 transition-colors"
    >
      <div className="text-2xl mb-3">{icon}</div>
      <h4 className="font-title text-base md:text-lg font-semibold text-white mb-1.5">{title}</h4>
      <p className="font-body text-sm text-white/45 leading-relaxed">{desc}</p>
    </motion.div>
  )
}

// ─── Metric Block ────────────────────────────────────────────────────────────
function Metric({ value, label, desc }: { value: string; label: string; desc: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      className="p-6 rounded-2xl border border-accent-cyan/10 bg-accent-cyan/[0.02] text-center"
    >
      <div className="font-title text-3xl md:text-4xl font-bold text-accent-cyan mb-1">{value}</div>
      <div className="font-body text-sm text-white/70 font-medium mb-1">{label}</div>
      <div className="font-body text-xs text-white/35">{desc}</div>
    </motion.div>
  )
}


// ═══════════════════════════════════════════════════════════════════════════════
// PAGE PARTENAIRES — BIG DOMINO FLOTTES
// ═══════════════════════════════════════════════════════════════════════════════

export default function PartenairesPage() {
  return (
    <main className="min-h-screen bg-[#050508]">
      <Header />

      {/* ═══════════════════════════════════════════════════════════════
          1. HERO — Le Big Domino Partenaire
          Croyance à abattre : "Gérer une flotte, c'est du chaos,
          et aucun outil ne peut vraiment m'aider."
          ═══════════════════════════════════════════════════════════════ */}
      <section className="relative pt-28 pb-20 md:pt-36 md:pb-28 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] md:w-[1200px] md:h-[700px] bg-gradient-to-b from-accent-purple/8 via-accent-cyan/4 to-transparent rounded-full blur-[80px] md:blur-[150px] pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-6 md:mb-8"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium tracking-wider uppercase text-accent-purple/80 border border-accent-purple/15 rounded-full">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-purple opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-purple" />
              </span>
              Pour gestionnaires de flottes
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="font-title text-4xl md:text-6xl lg:text-7xl font-semibold leading-[1.05] tracking-tight mb-6"
          >
            <span className="text-white">Votre flotte tourne.</span>
            <br />
            <span className="bg-gradient-to-r from-accent-purple to-accent-cyan bg-clip-text text-transparent">
              Mais tourne-t-elle bien ?
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="font-body text-base md:text-lg text-white/50 max-w-lg mx-auto mb-8 md:mb-10"
          >
            FOREAS transforme votre flotte VTC en machine d'efficacité pilotée par l'IA.
            Plus de revenus par chauffeur. Moins de vide. Zéro gaspillage.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center"
          >
            <a
              href="/contact"
              className="group relative inline-flex items-center justify-center gap-2 px-7 py-4 text-sm md:text-base font-semibold text-white overflow-hidden rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-accent-purple to-accent-cyan transition-all duration-300" />
              <span className="relative">Demander une démo flotte</span>
              <svg className="relative w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
            <a
              href="#douleurs"
              className="inline-flex items-center justify-center gap-2 px-7 py-4 text-sm md:text-base font-medium text-white/70 hover:text-white border border-white/10 hover:border-white/20 rounded-2xl transition-all"
            >
              Voir les résultats
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 mt-8 text-white/30 text-xs"
          >
            <span>Dashboard temps réel</span>
            <span className="w-px h-3 bg-white/10" />
            <span>IA par chauffeur</span>
            <span className="w-px h-3 bg-white/10" />
            <span>ROI mesurable</span>
          </motion.div>
        </div>
      </section>


      {/* ═══════════════════════════════════════════════════════════════
          2. DOULEUR PRIMAIRE — La réalité fleet
          ═══════════════════════════════════════════════════════════════ */}
      <section id="douleurs" className="relative py-20 md:py-28 bg-[#08080d]">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <SectionTitle
            eyebrow="Ce que vous vivez au quotidien"
            title="Gérer une flotte VTC"
            gradient="c'est piloter à l'aveugle."
            subtitle="Chaque colonne est un miroir. À gauche, votre réalité. À droite, votre flotte avec FOREAS."
          />

          <div className="space-y-5 md:space-y-6">
            <DualityBlock
              frustration={{
                title: 'Vos chauffeurs tournent à vide 25% du temps.',
                desc: 'Vous payez du carburant, de l\'usure et du temps pour des kilomètres improductifs. Chaque heure de vide, c\'est du CA brûlé.',
              }}
              desir={{
                title: 'Chaque chauffeur est repositionné en temps réel.',
                desc: 'Ajnaya anticipe la demande et redistribue votre flotte zone par zone. Le taux de vide chute. Le CA par chauffeur explose.',
              }}
              delay={0}
            />

            <DualityBlock
              frustration={{
                title: 'Vous n\'avez aucune visibilité sur la performance réelle.',
                desc: 'Combien rapporte chaque chauffeur par heure nette ? Quels sont vos meilleurs créneaux ? Vos zones mortes ? Vous gérez au feeling.',
              }}
              desir={{
                title: 'Dashboard en temps réel, chauffeur par chauffeur.',
                desc: '€/h net, €/km, taux de vide, créneaux les plus rentables, comparaison inter-chauffeurs. Vous pilotez avec des données, pas de l\'intuition.',
              }}
              delay={0.1}
            />

            <DualityBlock
              frustration={{
                title: 'Le turnover vous coûte une fortune.',
                desc: 'Vos meilleurs chauffeurs partent parce qu\'ils gagnent plus ailleurs. Formation perdue, clients mécontents, recrutement permanent.',
              }}
              desir={{
                title: 'Vos chauffeurs gagnent plus → ils restent.',
                desc: 'Un chauffeur FOREAS gagne plus par heure, fatigue moins, et a des outils que la concurrence n\'offre pas. Votre rétention s\'améliore structurellement.',
              }}
              delay={0.2}
            />
          </div>
        </div>
      </section>

      <GradientLine className="py-4" />


      {/* ═══════════════════════════════════════════════════════════════
          3. DOULEURS SECONDAIRES — Les problèmes qu'on ne mesure pas
          ═══════════════════════════════════════════════════════════════ */}
      <section className="relative py-20 md:py-28">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <SectionTitle
            eyebrow="Les coûts cachés"
            title="Ce que vous perdez"
            gradient="sans le savoir."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            <FeatureCard
              icon="📊"
              title="Pas de benchmark interne"
              desc="Impossible de comparer vos chauffeurs entre eux. Le meilleur et le pire génèrent un écart de 40% de CA — mais vous ne le voyez pas."
              delay={0}
            />
            <FeatureCard
              icon="🗺️"
              title="Couverture zone déséquilibrée"
              desc="3 chauffeurs au même endroit, zéro dans une zone qui explose. Sans orchestration IA, votre flotte se cannibalise elle-même."
              delay={0.05}
            />
            <FeatureCard
              icon="⏱️"
              title="Temps de réponse imprévisible"
              desc="Votre client VIP attend 12 minutes. Inacceptable pour votre marque. Mais sans prédiction de demande, c'est la loterie."
              delay={0.1}
            />
            <FeatureCard
              icon="💸"
              title="Commission plateforme élevée"
              desc="Uber, Bolt prennent 20-25%. Sur 100 courses/jour, c'est des milliers d'euros qui ne reviennent jamais à votre flotte."
              delay={0.15}
            />
            <FeatureCard
              icon="📱"
              title="Aucun outil de communication unifié"
              desc="WhatsApp perso, appels, SMS — vous gérez votre flotte avec des outils de 2010. Aucune traçabilité, aucun historique structuré."
              delay={0.2}
            />
            <FeatureCard
              icon="🔄"
              title="Formation chronophage"
              desc="Chaque nouveau chauffeur met 3 semaines à connaître Paris. Avec Ajnaya, il est productif dès le jour 1 — l'IA compense l'inexpérience."
              delay={0.25}
            />
          </div>
        </div>
      </section>

      <GradientLine className="py-4" />


      {/* ═══════════════════════════════════════════════════════════════
          4. LA SOLUTION FOREAS FLEET — Ce qui change
          ═══════════════════════════════════════════════════════════════ */}
      <section className="relative py-20 md:py-28 bg-[#08080d]">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <SectionTitle
            eyebrow="FOREAS Fleet"
            title="Votre flotte,"
            gradient="augmentée par l'IA."
            subtitle="Chaque chauffeur devient plus rentable. Votre opération devient prévisible."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {/* Feature 1 */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="p-6 md:p-8 rounded-2xl border border-accent-cyan/10 bg-accent-cyan/[0.02]"
            >
              <div className="w-12 h-12 mb-4 rounded-xl bg-accent-cyan/10 flex items-center justify-center text-xl">🧠</div>
              <h3 className="font-title text-xl font-semibold text-white mb-3">Ajnaya individuelle par chauffeur</h3>
              <p className="font-body text-sm text-white/50 leading-relaxed">
                Chaque chauffeur reçoit des recommandations personnalisées selon sa position, son historique,
                ses préférences et les conditions temps réel. Pas de conseil générique — de l'intelligence ciblée.
              </p>
            </motion.div>

            {/* Feature 2 */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="p-6 md:p-8 rounded-2xl border border-accent-purple/10 bg-accent-purple/[0.02]"
            >
              <div className="w-12 h-12 mb-4 rounded-xl bg-accent-purple/10 flex items-center justify-center text-xl">📈</div>
              <h3 className="font-title text-xl font-semibold text-white mb-3">Dashboard fleet en temps réel</h3>
              <p className="font-body text-sm text-white/50 leading-relaxed">
                Vue d'ensemble de votre flotte : position de chaque chauffeur, €/h en cours, taux d'occupation,
                alertes de sous-performance. Pilotez comme un centre d'opérations, pas comme un standard téléphonique.
              </p>
            </motion.div>

            {/* Feature 3 */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="p-6 md:p-8 rounded-2xl border border-accent-green/10 bg-accent-green/[0.02]"
            >
              <div className="w-12 h-12 mb-4 rounded-xl bg-accent-green/10 flex items-center justify-center text-xl">🎯</div>
              <h3 className="font-title text-xl font-semibold text-white mb-3">Orchestration zone intelligente</h3>
              <p className="font-body text-sm text-white/50 leading-relaxed">
                Plus jamais 5 chauffeurs sur la même zone et zéro sur une autre. L'IA distribue votre couverture
                en fonction de la demande prédite, pas de l'habitude de vos chauffeurs.
              </p>
            </motion.div>

            {/* Feature 4 */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="p-6 md:p-8 rounded-2xl border border-white/[0.05] bg-white/[0.02]"
            >
              <div className="w-12 h-12 mb-4 rounded-xl bg-accent-cyan/10 flex items-center justify-center text-xl">🤝</div>
              <h3 className="font-title text-xl font-semibold text-white mb-3">Pipeline partenaires intégré</h3>
              <p className="font-body text-sm text-white/50 leading-relaxed">
                Accédez aux courses Private Hunter — hôtels, Airbnb, conciergeries. Un flux de clients premium
                que vos chauffeurs reçoivent directement dans l'app, sans commission plateforme.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      <GradientLine className="py-4" />


      {/* ═══════════════════════════════════════════════════════════════
          5. SCÉNARIOS TERRAIN — On connaît votre quotidien
          ═══════════════════════════════════════════════════════════════ */}
      <section className="relative py-20 md:py-28">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <SectionTitle
            eyebrow="En conditions réelles"
            title="Des situations"
            gradient="que vous reconnaîtrez."
          />

          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.7 }}
              className="p-6 md:p-8 rounded-2xl border border-white/[0.05] bg-white/[0.02]"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-accent-purple/10 flex items-center justify-center text-xl">📞</div>
                <div>
                  <h4 className="font-title text-lg md:text-xl font-semibold text-white mb-2">Lundi matin — 3 chauffeurs appellent en même temps</h4>
                  <p className="font-body text-sm md:text-base text-white/50 leading-relaxed">
                    "Chef, je suis où ?" "Y'a rien à Roissy." "J'ai fait 2h sans course."
                    <span className="text-accent-cyan"> Avec FOREAS : chacun a ses instructions personnalisées dans l'app. Vous ne recevez plus ces appels.</span>
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.7 }}
              className="p-6 md:p-8 rounded-2xl border border-white/[0.05] bg-white/[0.02]"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-accent-cyan/10 flex items-center justify-center text-xl">🆕</div>
                <div>
                  <h4 className="font-title text-lg md:text-xl font-semibold text-white mb-2">Nouveau chauffeur — il ne connaît pas Paris</h4>
                  <p className="font-body text-sm md:text-base text-white/50 leading-relaxed">
                    D'habitude, il met 3 semaines à être autonome. Pendant ce temps, il tourne, il perd, vous perdez.
                    <span className="text-accent-cyan"> Avec Ajnaya, il reçoit les mêmes recommandations qu'un chauffeur de 5 ans d'expérience. Productif dès J1.</span>
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.7 }}
              className="p-6 md:p-8 rounded-2xl border border-white/[0.05] bg-white/[0.02]"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-accent-green/10 flex items-center justify-center text-xl">📊</div>
                <div>
                  <h4 className="font-title text-lg md:text-xl font-semibold text-white mb-2">Fin de mois — vous faites les comptes</h4>
                  <p className="font-body text-sm md:text-base text-white/50 leading-relaxed">
                    Excel, screenshots Uber, WhatsApp — vous reconstituez la performance de chaque chauffeur à la main.
                    <span className="text-accent-cyan"> FOREAS génère automatiquement vos rapports : CA par chauffeur, €/h net, zones couvertes, comparatifs.</span>
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <GradientLine className="py-4" />


      {/* ═══════════════════════════════════════════════════════════════
          6. SOCIAL PROOF — Les chauffeurs eux-mêmes témoignent
          Si vos chauffeurs sont contents, vous êtes content
          ═══════════════════════════════════════════════════════════════ */}
      <Testimonials />

      <GradientLine className="py-4" />


      {/* ═══════════════════════════════════════════════════════════════
          7. CTA FINAL — Contact / Démo
          Pricing partenaire à définir → pas de Stripe ici
          ═══════════════════════════════════════════════════════════════ */}
      <section className="relative py-32 lg:py-40 overflow-hidden">
        <div className="absolute inset-0 bg-[#050508]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[300px] md:w-[1000px] md:h-[600px] bg-gradient-to-b from-accent-purple/10 via-accent-cyan/5 to-transparent rounded-full blur-[60px] md:blur-[120px] pointer-events-none" />

        <div className="relative max-w-4xl mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-center"
          >
            <h2 className="font-title text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-white mb-6">
              Votre flotte mérite
              <span className="block bg-gradient-to-r from-accent-purple to-accent-cyan bg-clip-text text-transparent">
                un copilote IA.
              </span>
            </h2>

            <p className="font-body text-lg text-white/55 max-w-xl mx-auto mb-10">
              Réservez un appel avec notre équipe. On vous montre le dashboard,
              les chiffres terrain, et comment ça s'intègre à votre flotte.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <a
                href="/contact"
                className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold text-white overflow-hidden rounded-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-accent-purple to-accent-cyan" />
                <span className="relative">Réserver une démo</span>
                <svg className="relative w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </a>
              <a
                href="/chauffeurs"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-medium text-white/70 hover:text-white border border-white/10 hover:border-white/20 rounded-2xl transition-all duration-300"
              >
                Je suis chauffeur indépendant
              </a>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-white/35 text-sm">
              <span>Démo gratuite 30 min</span>
              <span>Intégration en 48h</span>
              <span>Support dédié fleet</span>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
