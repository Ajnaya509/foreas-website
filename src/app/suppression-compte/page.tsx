'use client'

import { motion } from 'framer-motion'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function SuppressionComptePage() {
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
            <h1 className="font-title text-3xl md:text-4xl font-semibold text-white mb-2">Suppression de compte</h1>
            <p className="text-sm text-white/30 mb-8 md:mb-12">Mars 2026</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="space-y-6 md:space-y-8"
          >
            <div className="p-5 md:p-6 bg-white/[0.02] border border-white/[0.05] rounded-2xl">
              <h2 className="font-title text-lg md:text-xl font-semibold text-white mb-3">Votre droit de suppression</h2>
              <p className="text-white/50 text-sm md:text-base leading-relaxed">
                {"Conform\u00e9ment au RGPD (R\u00e8glement G\u00e9n\u00e9ral sur la Protection des Donn\u00e9es) et aux exigences de Google Play, vous pouvez \u00e0 tout moment demander la suppression compl\u00e8te de votre compte FOREAS et de toutes vos donn\u00e9es personnelles associ\u00e9es."}
              </p>
            </div>

            <div className="p-5 md:p-6 bg-white/[0.02] border border-white/[0.05] rounded-2xl">
              <h2 className="font-title text-lg md:text-xl font-semibold text-white mb-3">Comment supprimer votre compte</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[#8b3dff]/20 text-[#8b3dff] flex items-center justify-center text-sm font-semibold">1</span>
                  <p className="text-white/50 text-sm md:text-base leading-relaxed pt-0.5">
                    {"Envoyez un e-mail \u00e0 "}
                    <a href="mailto:suppression@foreas.xyz" className="text-[#8b3dff] hover:underline font-medium">suppression@foreas.xyz</a>
                    {" depuis l\u2019adresse e-mail associ\u00e9e \u00e0 votre compte."}
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[#8b3dff]/20 text-[#8b3dff] flex items-center justify-center text-sm font-semibold">2</span>
                  <p className="text-white/50 text-sm md:text-base leading-relaxed pt-0.5">
                    {"Indiquez en objet : \"Demande de suppression de compte\""}
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[#8b3dff]/20 text-[#8b3dff] flex items-center justify-center text-sm font-semibold">3</span>
                  <p className="text-white/50 text-sm md:text-base leading-relaxed pt-0.5">
                    {"Notre \u00e9quipe traitera votre demande sous 72 heures et vous enverra une confirmation par e-mail."}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5 md:p-6 bg-white/[0.02] border border-white/[0.05] rounded-2xl">
              <h2 className="font-title text-lg md:text-xl font-semibold text-white mb-3">{"Donn\u00e9es concern\u00e9es"}</h2>
              <p className="text-white/50 text-sm md:text-base leading-relaxed mb-3">
                {"La suppression de votre compte entra\u00eene l\u2019effacement d\u00e9finitif de :"}
              </p>
              <ul className="space-y-2">
                {[
                  "Vos informations de profil (nom, e-mail, photo)",
                  "Votre historique de courses et trajets",
                  "Vos statistiques et donn\u00e9es de performance",
                  "Vos pr\u00e9f\u00e9rences et param\u00e8tres",
                  "Vos conversations avec Ajnaya (assistant IA)",
                  "Vos donn\u00e9es de g\u00e9olocalisation",
                  "Votre historique de paiements et pourboires"
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-white/50 text-sm md:text-base">
                    <span className="text-[#8b3dff] mt-1">{"•"}</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-5 md:p-6 bg-white/[0.02] border border-white/[0.05] rounded-2xl">
              <h2 className="font-title text-lg md:text-xl font-semibold text-white mb-3">Informations importantes</h2>
              <ul className="space-y-2">
                {[
                  "La suppression est irr\u00e9versible. Aucune donn\u00e9e ne pourra \u00eatre r\u00e9cup\u00e9r\u00e9e apr\u00e8s traitement.",
                  "Certaines donn\u00e9es anonymis\u00e9es peuvent \u00eatre conserv\u00e9es \u00e0 des fins statistiques, conform\u00e9ment au RGPD.",
                  "Les donn\u00e9es li\u00e9es \u00e0 des obligations l\u00e9gales (facturation, fiscalit\u00e9) sont conserv\u00e9es selon les dur\u00e9es l\u00e9gales en vigueur.",
                  "D\u00e9lai de traitement : 72 heures maximum apr\u00e8s r\u00e9ception de votre demande."
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-white/50 text-sm md:text-base">
                    <span className="text-[#8b3dff] mt-1">{"•"}</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-5 md:p-6 bg-[#8b3dff]/10 border border-[#8b3dff]/20 rounded-2xl text-center">
              <p className="text-white/70 text-sm md:text-base mb-4">
                {"Pour toute question concernant la suppression de vos donn\u00e9es :"}
              </p>
              <a
                href="mailto:suppression@foreas.xyz"
                className="inline-block bg-[#8b3dff] hover:bg-[#7a2ef0] text-white font-semibold px-8 py-3 rounded-xl transition-colors text-sm md:text-base"
              >
                {"suppression@foreas.xyz"}
              </a>
            </div>

            <div className="p-5 md:p-6 bg-white/[0.02] border border-white/[0.05] rounded-2xl">
              <h2 className="font-title text-lg md:text-xl font-semibold text-white mb-3">Contact DPO</h2>
              <p className="text-white/50 text-sm md:text-base leading-relaxed">
                {"Pour exercer vos droits RGPD (acc\u00e8s, rectification, portabilit\u00e9, limitation), contactez notre D\u00e9l\u00e9gu\u00e9 \u00e0 la Protection des Donn\u00e9es :"}
              </p>
              <p className="text-white/50 text-sm md:text-base mt-2">
                {"E-mail : "}
                <a href="mailto:dpo@foreas.xyz" className="text-[#8b3dff] hover:underline">dpo@foreas.xyz</a>
              </p>
              <p className="text-white/50 text-sm md:text-base">
                {"FOREAS Labs \u2014 Paris, France"}
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
