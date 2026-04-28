'use client'

import { motion } from 'framer-motion'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function MentionsLegalesPage() {
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
            <p className="font-title text-xs font-semibold tracking-widest uppercase text-white/40 mb-3">Légal</p>
            <h1 className="font-title text-3xl md:text-4xl font-bold text-white mb-2">
              Mentions Légales
            </h1>
            <p className="font-sans text-sm text-white/45 mb-8 md:mb-12">Dernière mise à jour : Mars 2026</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="space-y-6 md:space-y-8"
          >

            <div className="p-5 md:p-6 bg-white/[0.02] border border-white/[0.06] rounded-2xl">
              <h2 className="font-title text-lg md:text-xl font-semibold text-white/90 mb-3">Éditeur du site et de l&apos;application</h2>
              <div className="p-4 bg-white/[0.03] rounded-xl space-y-1.5">
                <p className="font-sans text-sm md:text-base text-white/65"><span className="text-white/45">Dénomination :</span> <span className="text-white/85">FOREAS Labs</span></p>
                <p className="font-sans text-sm md:text-base text-white/65"><span className="text-white/45">SIRET :</span> <span className="text-white/85">940 879 281</span></p>
                <p className="font-sans text-sm md:text-base text-white/65"><span className="text-white/45">Pays :</span> France</p>
                <p className="font-sans text-sm md:text-base text-white/65"><span className="text-white/45">E-mail :</span> <span className="text-white/85">contact@foreas.xyz</span></p>
                <p className="font-sans text-sm md:text-base text-white/65"><span className="text-white/45">Site web :</span> foreas.xyz</p>
                <p className="font-sans text-sm md:text-base text-white/65"><span className="text-white/45">Application :</span> FOREAS — Google Play Store & Apple App Store</p>
              </div>
              <p className="font-sans text-sm md:text-base text-white/65 leading-relaxed mt-4">
                Le directeur de la publication est le représentant légal de FOREAS Labs.
              </p>
            </div>

            <div className="p-5 md:p-6 bg-white/[0.02] border border-white/[0.06] rounded-2xl">
              <h2 className="font-title text-lg md:text-xl font-semibold text-white/90 mb-3">Hébergement du site</h2>
              <div className="p-4 bg-white/[0.03] rounded-xl space-y-1.5">
                <p className="font-sans text-sm md:text-base text-white/65"><span className="text-white/45">Prestataire :</span> <span className="text-white/85">Vercel Inc.</span></p>
                <p className="font-sans text-sm md:text-base text-white/65"><span className="text-white/45">Adresse :</span> 340 Pine Street, Suite 701, San Francisco, CA 94104, États-Unis</p>
                <p className="font-sans text-sm md:text-base text-white/65"><span className="text-white/45">Site :</span> vercel.com</p>
              </div>
            </div>

            <div className="p-5 md:p-6 bg-white/[0.02] border border-white/[0.06] rounded-2xl">
              <h2 className="font-title text-lg md:text-xl font-semibold text-white/90 mb-4">Infrastructure de l&apos;application</h2>
              <div className="space-y-3">
                <div className="p-3.5 bg-white/[0.03] rounded-xl">
                  <p className="font-title italic text-sm font-semibold text-white/75 mb-1">Base de données — Supabase</p>
                  <p className="font-sans text-xs text-white/55 leading-relaxed">Hébergement dans l&apos;Union Européenne (Frankfurt, AWS eu-central-1). Supabase Inc., Singapore.</p>
                </div>
                <div className="p-3.5 bg-white/[0.03] rounded-xl">
                  <p className="font-title italic text-sm font-semibold text-white/75 mb-1">Backend IA — Railway</p>
                  <p className="font-sans text-xs text-white/55 leading-relaxed">Déploiement et exécution des services d&apos;intelligence artificielle. Railway Corporation, San Francisco, CA, États-Unis.</p>
                </div>
              </div>
            </div>

            <div className="p-5 md:p-6 bg-white/[0.02] border border-white/[0.06] rounded-2xl">
              <h2 className="font-title text-lg md:text-xl font-semibold text-white/90 mb-3">Propriété intellectuelle</h2>
              <p className="font-sans text-sm md:text-base text-white/65 leading-relaxed">
                L&apos;ensemble du contenu du site foreas.xyz et de l&apos;application FOREAS — textes, visuels, logotype, interface, algorithmes, modèles d&apos;intelligence artificielle, architecture et code source — est la propriété exclusive de FOREAS Labs et est protégé par les lois françaises et internationales relatives à la propriété intellectuelle.
              </p>
              <p className="font-sans text-sm md:text-base text-white/65 leading-relaxed mt-3">
                Toute reproduction, représentation, modification, adaptation ou exploitation, totale ou partielle, est strictement interdite sans autorisation écrite préalable de FOREAS Labs.
              </p>
            </div>

            <div className="p-5 md:p-6 bg-white/[0.02] border border-white/[0.06] rounded-2xl">
              <h2 className="font-title text-lg md:text-xl font-semibold text-white/90 mb-3">Données personnelles</h2>
              <p className="font-sans text-sm md:text-base text-white/65 leading-relaxed">
                Le traitement des données personnelles collectées via le site et l&apos;application est régi par la Politique de Confidentialité de FOREAS, accessible à l&apos;adresse <span className="text-white/80">foreas.xyz/confidentialite</span>, conformément au RGPD (UE 2016/679) et à la loi Informatique et Libertés.
              </p>
              <p className="font-sans text-sm md:text-base text-white/65 leading-relaxed mt-3">
                Responsable du traitement : FOREAS Labs — <span className="text-white/80">contact@foreas.xyz</span>
              </p>
            </div>

            <div className="p-5 md:p-6 bg-white/[0.02] border border-white/[0.06] rounded-2xl">
              <h2 className="font-title text-lg md:text-xl font-semibold text-white/90 mb-3">Liens hypertextes</h2>
              <p className="font-sans text-sm md:text-base text-white/65 leading-relaxed">
                Le site foreas.xyz peut contenir des liens vers des sites tiers. FOREAS Labs n&apos;exerce aucun contrôle sur ces sites et décline toute responsabilité quant à leur contenu, leur disponibilité ou leurs pratiques en matière de protection des données.
              </p>
              <p className="font-sans text-sm md:text-base text-white/65 leading-relaxed mt-3">
                La création de liens hypertextes vers foreas.xyz est autorisée sous réserve de ne pas porter atteinte à l&apos;image de FOREAS Labs.
              </p>
            </div>

            <div className="p-5 md:p-6 bg-white/[0.02] border border-white/[0.06] rounded-2xl">
              <h2 className="font-title text-lg md:text-xl font-semibold text-white/90 mb-3">Limitation de responsabilité</h2>
              <p className="font-sans text-sm md:text-base text-white/65 leading-relaxed">
                FOREAS Labs s&apos;efforce d&apos;assurer l&apos;exactitude des informations publiées sur foreas.xyz, sans toutefois garantir leur exhaustivité. FOREAS Labs ne saurait être tenu responsable des dommages directs ou indirects résultant de l&apos;accès au site ou de l&apos;impossibilité d&apos;y accéder.
              </p>
            </div>

            <div className="p-5 md:p-6 bg-white/[0.02] border border-white/[0.06] rounded-2xl">
              <h2 className="font-title text-lg md:text-xl font-semibold text-white/90 mb-3">Droit applicable</h2>
              <p className="font-sans text-sm md:text-base text-white/65 leading-relaxed">
                Les présentes mentions légales sont soumises au droit français. En cas de litige, les tribunaux compétents du ressort de Paris seront seuls compétents.
              </p>
            </div>

            <div className="p-5 md:p-6 bg-white/[0.02] border border-white/[0.06] rounded-2xl">
              <h2 className="font-title text-lg md:text-xl font-semibold text-white/90 mb-3">Contact</h2>
              <div className="mt-1 p-4 bg-white/[0.03] rounded-xl space-y-1.5">
                <p className="font-sans text-sm md:text-base text-white/65"><span className="text-white/45">E-mail :</span> <span className="text-white/85">contact@foreas.xyz</span></p>
                <p className="font-sans text-sm md:text-base text-white/65"><span className="text-white/45">Société :</span> FOREAS Labs — SIRET 940 879 281 — France</p>
              </div>
            </div>

          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
