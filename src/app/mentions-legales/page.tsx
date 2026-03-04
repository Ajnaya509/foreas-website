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
            <p className="text-xs font-semibold tracking-widest uppercase text-white/30 mb-3">Légal</p>
            <h1 className="font-title text-3xl md:text-4xl font-semibold text-white mb-2">
              Mentions Légales
            </h1>
            <p className="text-sm text-white/30 mb-8 md:mb-12">Dernière mise à jour : Mars 2026</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="space-y-6 md:space-y-8"
          >

            {/* Éditeur */}
            <div className="p-5 md:p-6 bg-white/[0.02] border border-white/[0.05] rounded-2xl">
              <h2 className="font-title text-lg md:text-xl font-semibold text-white mb-3">Éditeur du site et de l&apos;application</h2>
              <div className="space-y-1.5 text-sm md:text-base text-white/40 leading-relaxed">
                <p><span className="text-white/25">Dénomination :</span> <span className="text-white/55">FOREAS Labs</span></p>
                <p><span className="text-white/25">Forme juridique :</span> Entreprise individuelle / société en cours d&apos;immatriculation</p>
                <p><span className="text-white/25">SIRET :</span> <span className="text-white/55">940 879 281</span></p>
                <p><span className="text-white/25">Pays :</span> France</p>
                <p><span className="text-white/25">E-mail :</span> <span className="text-white/55">contact@foreas.xyz</span></p>
                <p><span className="text-white/25">Site web :</span> foreas.xyz</p>
                <p><span className="text-white/25">Application :</span> FOREAS — disponible sur Google Play Store et Apple App Store</p>
              </div>
              <p className="text-sm md:text-base text-white/40 leading-relaxed mt-4">
                Le directeur de la publication est le représentant légal de FOREAS Labs.
              </p>
            </div>

            {/* Hébergement */}
            <div className="p-5 md:p-6 bg-white/[0.02] border border-white/[0.05] rounded-2xl">
              <h2 className="font-title text-lg md:text-xl font-semibold text-white mb-3">Hébergement du site</h2>
              <div className="space-y-1.5 text-sm md:text-base text-white/40 leading-relaxed">
                <p><span className="text-white/25">Prestataire :</span> <span className="text-white/55">Vercel Inc.</span></p>
                <p><span className="text-white/25">Adresse :</span> 340 Pine Street, Suite 701, San Francisco, CA 94104, États-Unis</p>
                <p><span className="text-white/25">Site :</span> vercel.com</p>
              </div>
            </div>

            {/* Hébergement app */}
            <div className="p-5 md:p-6 bg-white/[0.02] border border-white/[0.05] rounded-2xl">
              <h2 className="font-title text-lg md:text-xl font-semibold text-white mb-3">Infrastructure de l&apos;application</h2>
              <div className="space-y-3 text-sm md:text-base text-white/40 leading-relaxed">
                <div>
                  <p className="text-white/55 font-medium mb-0.5">Base de données — Supabase</p>
                  <p>Hébergement dans l&apos;Union Européenne (région Frankfurt). Supabase Inc., 970 Toa Payoh North, Singapore.</p>
                </div>
                <div>
                  <p className="text-white/55 font-medium mb-0.5">Backend IA — Railway</p>
                  <p>Déploiement et exécution des services d&apos;intelligence artificielle. Railway Corporation, San Francisco, CA, États-Unis.</p>
                </div>
              </div>
            </div>

            {/* Propriété intellectuelle */}
            <div className="p-5 md:p-6 bg-white/[0.02] border border-white/[0.05] rounded-2xl">
              <h2 className="font-title text-lg md:text-xl font-semibold text-white mb-3">Propriété intellectuelle</h2>
              <p className="text-sm md:text-base text-white/40 leading-relaxed">
                L&apos;ensemble du contenu du site foreas.xyz et de l&apos;application FOREAS — textes, visuels, logotype, interface, algorithmes, modèles d&apos;intelligence artificielle, architecture et code source — est la propriété exclusive de FOREAS Labs et est protégé par les lois françaises et internationales relatives à la propriété intellectuelle.
              </p>
              <p className="text-sm md:text-base text-white/40 leading-relaxed mt-3">
                Toute reproduction, représentation, modification, adaptation, traduction ou exploitation, totale ou partielle, par quelque moyen que ce soit, est strictement interdite sans autorisation écrite préalable de FOREAS Labs.
              </p>
            </div>

            {/* Données personnelles */}
            <div className="p-5 md:p-6 bg-white/[0.02] border border-white/[0.05] rounded-2xl">
              <h2 className="font-title text-lg md:text-xl font-semibold text-white mb-3">Données personnelles</h2>
              <p className="text-sm md:text-base text-white/40 leading-relaxed">
                Le traitement des données personnelles collectées via le site et l&apos;application est régi par la Politique de Confidentialité de FOREAS, accessible à l&apos;adresse foreas.xyz/confidentialite, conformément au Règlement Général sur la Protection des Données (RGPD — UE 2016/679) et à la loi Informatique et Libertés.
              </p>
              <p className="text-sm md:text-base text-white/40 leading-relaxed mt-3">
                Responsable du traitement : FOREAS Labs — contact@foreas.xyz
              </p>
            </div>

            {/* Liens hypertextes */}
            <div className="p-5 md:p-6 bg-white/[0.02] border border-white/[0.05] rounded-2xl">
              <h2 className="font-title text-lg md:text-xl font-semibold text-white mb-3">Liens hypertextes</h2>
              <p className="text-sm md:text-base text-white/40 leading-relaxed">
                Le site foreas.xyz peut contenir des liens vers des sites tiers. FOREAS Labs n&apos;exerce aucun contrôle sur ces sites et décline toute responsabilité quant à leur contenu, leur disponibilité ou leurs pratiques en matière de protection des données.
              </p>
              <p className="text-sm md:text-base text-white/40 leading-relaxed mt-3">
                La création de liens hypertextes vers foreas.xyz est autorisée sous réserve de ne pas porter atteinte à l&apos;image de FOREAS Labs et de ne pas utiliser la marque FOREAS à des fins trompeuses.
              </p>
            </div>

            {/* Limitation de responsabilité */}
            <div className="p-5 md:p-6 bg-white/[0.02] border border-white/[0.05] rounded-2xl">
              <h2 className="font-title text-lg md:text-xl font-semibold text-white mb-3">Limitation de responsabilité</h2>
              <p className="text-sm md:text-base text-white/40 leading-relaxed">
                FOREAS Labs s&apos;efforce d&apos;assurer l&apos;exactitude et la mise à jour des informations publiées sur le site foreas.xyz, sans toutefois garantir leur exhaustivité ni leur absence d&apos;erreur. FOREAS Labs se réserve le droit de modifier ou corriger le contenu du site à tout moment et sans préavis.
              </p>
              <p className="text-sm md:text-base text-white/40 leading-relaxed mt-3">
                FOREAS Labs ne saurait être tenu responsable des dommages directs ou indirects résultant de l&apos;accès au site, de son utilisation ou de l&apos;impossibilité d&apos;y accéder, ni des décisions prises sur la base des informations qui y figurent.
              </p>
            </div>

            {/* Droit applicable */}
            <div className="p-5 md:p-6 bg-white/[0.02] border border-white/[0.05] rounded-2xl">
              <h2 className="font-title text-lg md:text-xl font-semibold text-white mb-3">Droit applicable</h2>
              <p className="text-sm md:text-base text-white/40 leading-relaxed">
                Les présentes mentions légales sont soumises au droit français. En cas de litige relatif à leur interprétation ou leur exécution, les tribunaux compétents du ressort de Paris seront seuls compétents.
              </p>
            </div>

            {/* Contact */}
            <div className="p-5 md:p-6 bg-white/[0.02] border border-white/[0.05] rounded-2xl">
              <h2 className="font-title text-lg md:text-xl font-semibold text-white mb-3">Contact</h2>
              <p className="text-sm md:text-base text-white/40 leading-relaxed">
                Pour toute question relative au site ou à l&apos;application FOREAS :
              </p>
              <div className="mt-3 p-4 bg-white/[0.03] rounded-xl text-sm md:text-base text-white/50 leading-relaxed space-y-1">
                <p><span className="text-white/30">E-mail :</span> contact@foreas.xyz</p>
                <p><span className="text-white/30">Société :</span> FOREAS Labs — SIRET 940 879 281 — France</p>
              </div>
            </div>

          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
