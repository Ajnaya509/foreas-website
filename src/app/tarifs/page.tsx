'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function TarifsPage() {
  const [billingCycle, setBillingCycle] = useState<'weekly' | 'annual'>('weekly')

  const pricing = {
    weekly: {
      price: 12.97,
      period: '/semaine',
      savings: null,
      priceId: 'price_weekly_xxx' // À remplacer par le vrai price_id Stripe
    },
    annual: {
      price: 9.97,
      period: '/semaine',
      savings: '23%',
      total: 518.44,
      priceId: 'price_annual_xxx' // À remplacer par le vrai price_id Stripe
    }
  }

  const features = [
    { name: 'Ajnaya IA prédictive', included: true, description: 'Zones chaudes en temps réel' },
    { name: 'Multi-app (Uber, Bolt, Heetch)', included: true, description: 'Vue unifiée de toutes vos apps' },
    { name: 'Alertes intelligentes', included: true, description: 'Notifications contextuelles' },
    { name: 'Historique & statistiques', included: true, description: 'Analysez vos performances' },
    { name: 'Mode nuit optimisé', included: true, description: 'Stratégies nocturnes' },
    { name: 'Support prioritaire', included: true, description: 'Réponse < 2h' },
  ]

  const [loading, setLoading] = useState(false)

  const handleCheckout = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: billingCycle })
      })
      const data = await response.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        console.error('Checkout error:', data.error)
        alert('Configuration Stripe requise. Ajoutez vos clés API dans Vercel.')
      }
    } catch (error) {
      console.error('Checkout error:', error)
      alert('Erreur de connexion. Réessayez.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-foreas-deepblack pt-24 pb-20">
        {/* Background effects */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-accent-purple/[0.05] rounded-full blur-[150px]" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-accent-cyan/[0.03] rounded-full blur-[100px]" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium tracking-wider uppercase text-accent-cyan/80 border border-accent-cyan/20 rounded-full mb-6">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              7 jours d'essai gratuit
            </span>

            <h1 className="font-title text-4xl md:text-5xl lg:text-6xl font-semibold text-white mb-4">
              Un investissement.<br />
              <span className="bg-gradient-to-r from-accent-cyan to-accent-purple bg-clip-text text-transparent">
                Pas une dépense.
              </span>
            </h1>

            <p className="text-white/50 text-lg max-w-xl mx-auto">
              +35% de CA en moyenne. L'abonnement se rembourse dès la première semaine.
            </p>
          </motion.div>

          {/* Billing toggle */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex justify-center mb-10"
          >
            <div className="inline-flex items-center gap-2 p-1.5 bg-white/5 rounded-xl border border-white/10">
              <button
                onClick={() => setBillingCycle('weekly')}
                className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  billingCycle === 'weekly'
                    ? 'bg-gradient-to-r from-accent-purple to-accent-cyan text-white shadow-lg'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                Hebdomadaire
              </button>
              <button
                onClick={() => setBillingCycle('annual')}
                className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                  billingCycle === 'annual'
                    ? 'bg-gradient-to-r from-accent-purple to-accent-cyan text-white shadow-lg'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                Annuel
                <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">
                  -23%
                </span>
              </button>
            </div>
          </motion.div>

          {/* Pricing card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="relative"
          >
            {/* Glow effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-accent-purple via-accent-cyan to-accent-purple rounded-3xl blur-xl opacity-20" />

            <div className="relative bg-gradient-to-b from-[#12121a] to-[#0a0a10] rounded-3xl border border-white/10 overflow-hidden">
              {/* Popular badge */}
              <div className="absolute top-0 right-0 bg-gradient-to-r from-accent-purple to-accent-cyan text-white text-xs font-bold px-4 py-1.5 rounded-bl-xl">
                RECOMMANDÉ
              </div>

              <div className="p-8 md:p-12">
                {/* Price */}
                <div className="text-center mb-8">
                  <div className="flex items-end justify-center gap-1 mb-2">
                    <span className="font-title text-6xl md:text-7xl font-bold text-white">
                      {pricing[billingCycle].price.toFixed(2).replace('.', ',')}
                    </span>
                    <span className="text-2xl text-white/60 mb-2">€</span>
                    <span className="text-white/40 mb-2">{pricing[billingCycle].period}</span>
                  </div>

                  {billingCycle === 'annual' && (
                    <p className="text-white/40 text-sm">
                      Facturé {pricing.annual.total.toFixed(2).replace('.', ',')}€/an
                      <span className="text-green-400 ml-2">Économisez {pricing.annual.savings}</span>
                    </p>
                  )}
                </div>

                {/* CTA */}
                <button
                  onClick={handleCheckout}
                  disabled={loading}
                  className="w-full py-4 bg-gradient-to-r from-accent-purple to-accent-cyan rounded-xl text-white font-semibold text-lg hover:opacity-90 transition-opacity mb-8 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Redirection...
                    </>
                  ) : (
                    <>
                      Commencer l'essai gratuit
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </>
                  )}
                </button>

                <p className="text-center text-white/30 text-sm mb-8">
                  Annulez à tout moment. Sans engagement.
                </p>

                {/* Features */}
                <div className="space-y-4">
                  <h3 className="text-white/60 text-sm font-medium uppercase tracking-wider mb-4">
                    Tout inclus
                  </h3>
                  {features.map((feature, index) => (
                    <motion.div
                      key={feature.name}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + index * 0.05 }}
                      className="flex items-start gap-3"
                    >
                      <div className="w-5 h-5 rounded-full bg-accent-cyan/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <svg className="w-3 h-3 text-accent-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-white font-medium">{feature.name}</p>
                        <p className="text-white/40 text-sm">{feature.description}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Bottom section - Guarantee */}
              <div className="border-t border-white/5 bg-white/[0.02] px-8 md:px-12 py-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-white font-medium">Garantie satisfait ou remboursé</p>
                    <p className="text-white/40 text-sm">30 jours pour tester. Pas convaincu ? On vous rembourse.</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ROI Calculator teaser */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-12 text-center"
          >
            <p className="text-white/40 text-sm mb-4">
              Pas sûr que ça vaille le coup ?
            </p>
            <a
              href="#simulateur"
              className="inline-flex items-center gap-2 text-accent-cyan hover:text-white transition-colors"
            >
              <span>Calculez vos gains potentiels</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </a>
          </motion.div>

          {/* FAQ */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-20"
          >
            <h2 className="font-title text-2xl text-white text-center mb-8">Questions fréquentes</h2>

            <div className="space-y-4">
              {[
                {
                  q: "Comment fonctionne l'essai gratuit ?",
                  a: "Vous avez 7 jours pour tester toutes les fonctionnalités. Aucune carte bancaire requise pour commencer. Vous ne payez que si vous êtes convaincu."
                },
                {
                  q: "Puis-je annuler à tout moment ?",
                  a: "Oui, sans engagement. Annulez en un clic depuis l'app. Pas de frais cachés, pas de questions."
                },
                {
                  q: "L'abonnement est-il rentable ?",
                  a: "Nos utilisateurs gagnent en moyenne +35% de CA. À 12,97€/semaine, l'abonnement se rembourse en 1-2 courses supplémentaires."
                },
                {
                  q: "Quels moyens de paiement acceptez-vous ?",
                  a: "Carte bancaire (Visa, Mastercard, Amex), Apple Pay, Google Pay. Paiement 100% sécurisé via Stripe."
                }
              ].map((faq, index) => (
                <div
                  key={index}
                  className="bg-white/[0.02] border border-white/5 rounded-xl p-6"
                >
                  <h3 className="text-white font-medium mb-2">{faq.q}</h3>
                  <p className="text-white/50 text-sm">{faq.a}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </main>
      <Footer />
    </>
  )
}
