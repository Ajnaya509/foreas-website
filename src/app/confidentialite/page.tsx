'use client'

import { motion } from 'framer-motion'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function ConfidentialitePage() {
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
              Politique de Confidentialité
            </h1>
            <p className="text-sm text-white/30 mb-8 md:mb-12">Dernière mise à jour : Mars 2026</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="space-y-6 md:space-y-8"
          >

            {/* Intro */}
            <div className="p-5 md:p-6 bg-white/[0.02] border border-white/[0.05] rounded-2xl">
              <h2 className="font-title text-lg md:text-xl font-semibold text-white mb-3">Introduction</h2>
              <p className="text-sm md:text-base text-white/40 leading-relaxed">
                FOREAS Labs (SIRET 940&nbsp;879&nbsp;281, ci-après « FOREAS ») accorde une importance primordiale à la protection de vos données personnelles. La présente Politique de Confidentialité décrit de manière transparente les données collectées via l&apos;application FOREAS, les finalités de leur traitement, les bases juridiques, les destinataires, les durées de conservation et vos droits, conformément au Règlement Général sur la Protection des Données (RGPD — UE 2016/679) et à la loi française Informatique et Libertés.
              </p>
            </div>

            {/* Article 1 */}
            <div className="p-5 md:p-6 bg-white/[0.02] border border-white/[0.05] rounded-2xl">
              <h2 className="font-title text-lg md:text-xl font-semibold text-white mb-3">1. Responsable du traitement</h2>
              <p className="text-sm md:text-base text-white/40 leading-relaxed">
                Le responsable du traitement de vos données personnelles est :
              </p>
              <div className="mt-3 p-4 bg-white/[0.03] rounded-xl text-sm md:text-base text-white/50 leading-relaxed space-y-1">
                <p><span className="text-white/30">Société :</span> FOREAS Labs</p>
                <p><span className="text-white/30">SIRET :</span> 940 879 281</p>
                <p><span className="text-white/30">Pays :</span> France</p>
                <p><span className="text-white/30">Contact :</span> contact@foreas.xyz</p>
              </div>
            </div>

            {/* Article 2 */}
            <div className="p-5 md:p-6 bg-white/[0.02] border border-white/[0.05] rounded-2xl">
              <h2 className="font-title text-lg md:text-xl font-semibold text-white mb-3">2. Données collectées et autorisations requises</h2>
              <p className="text-sm md:text-base text-white/40 leading-relaxed mb-4">
                L&apos;application FOREAS collecte les catégories de données suivantes dans le cadre de son fonctionnement :
              </p>

              <div className="space-y-4">
                <div>
                  <p className="text-sm font-semibold text-white/60 mb-2">a) Données de compte</p>
                  <p className="text-sm md:text-base text-white/40 leading-relaxed">
                    Prénom, nom, adresse e-mail, numéro de téléphone (optionnel), statut professionnel (VTC / taxi), informations de facturation (traitées exclusivement par Stripe — non stockées par FOREAS).
                  </p>
                </div>

                <div>
                  <p className="text-sm font-semibold text-white/60 mb-2">b) Données de géolocalisation — Permission <code className="text-xs bg-white/[0.06] px-1.5 py-0.5 rounded">ACCESS_FINE_LOCATION</code></p>
                  <p className="text-sm md:text-base text-white/40 leading-relaxed">
                    Votre position GPS précise est utilisée pour générer des recommandations de zones, calculer les temps de repositionnement, détecter les zones à forte demande et analyser vos parcours. La localisation est collectée uniquement lorsque l&apos;application est active et avec votre consentement explicite. Aucune donnée de localisation brute n&apos;est partagée avec des tiers à des fins publicitaires.
                  </p>
                </div>

                <div>
                  <p className="text-sm font-semibold text-white/60 mb-2">c) Données vocales — Permission <code className="text-xs bg-white/[0.06] px-1.5 py-0.5 rounded">RECORD_AUDIO</code></p>
                  <p className="text-sm md:text-base text-white/40 leading-relaxed">
                    Le microphone est utilisé exclusivement pour les commandes vocales adressées à l&apos;assistant Ajnaya (activation, questions, navigation mains libres). Les séquences audio sont transmises en temps réel au service de synthèse vocale ElevenLabs pour génération de réponse, puis immédiatement supprimées. <strong className="text-white/60">Aucun enregistrement vocal n&apos;est conservé par FOREAS ni par ElevenLabs.</strong> Le microphone n&apos;est jamais activé en arrière-plan sans action explicite de l&apos;Utilisateur.
                  </p>
                </div>

                <div>
                  <p className="text-sm font-semibold text-white/60 mb-2">d) Données comportementales et opérationnelles</p>
                  <p className="text-sm md:text-base text-white/40 leading-relaxed">
                    Historique des sessions actives, zones fréquentées (agrégées et anonymisées), horaires d&apos;activité, interactions avec les recommandations (acceptation / refus), durée et fréquence d&apos;utilisation du Service. Ces données sont collectées de manière passive afin d&apos;améliorer la pertinence des recommandations et d&apos;entraîner les modèles d&apos;IA propriétaires FOREAS.
                  </p>
                </div>

                <div>
                  <p className="text-sm font-semibold text-white/60 mb-2">e) Données techniques</p>
                  <p className="text-sm md:text-base text-white/40 leading-relaxed">
                    Identifiant de l&apos;appareil, système d&apos;exploitation, version de l&apos;application, journaux d&apos;erreurs techniques à des fins de diagnostic et de stabilité.
                  </p>
                </div>
              </div>
            </div>

            {/* Article 3 */}
            <div className="p-5 md:p-6 bg-white/[0.02] border border-white/[0.05] rounded-2xl">
              <h2 className="font-title text-lg md:text-xl font-semibold text-white mb-3">3. Finalités et bases juridiques</h2>
              <div className="space-y-3 text-sm md:text-base text-white/40 leading-relaxed">
                <div className="flex gap-3">
                  <span className="text-white/20 shrink-0 mt-0.5">▸</span>
                  <p><strong className="text-white/55">Fourniture du Service</strong> — exécution du contrat d&apos;abonnement (art. 6.1.b RGPD)</p>
                </div>
                <div className="flex gap-3">
                  <span className="text-white/20 shrink-0 mt-0.5">▸</span>
                  <p><strong className="text-white/55">Recommandations de zones et d&apos;horaires</strong> — exécution du contrat / intérêt légitime (amélioration du service)</p>
                </div>
                <div className="flex gap-3">
                  <span className="text-white/20 shrink-0 mt-0.5">▸</span>
                  <p><strong className="text-white/55">Géolocalisation pour suggestions IA</strong> — consentement explicite (art. 6.1.a RGPD) — révocable à tout moment</p>
                </div>
                <div className="flex gap-3">
                  <span className="text-white/20 shrink-0 mt-0.5">▸</span>
                  <p><strong className="text-white/55">Commandes vocales Ajnaya</strong> — consentement explicite (art. 6.1.a RGPD)</p>
                </div>
                <div className="flex gap-3">
                  <span className="text-white/20 shrink-0 mt-0.5">▸</span>
                  <p><strong className="text-white/55">Entraînement des modèles IA internes</strong> — intérêt légitime (art. 6.1.f RGPD) — données agrégées et anonymisées</p>
                </div>
                <div className="flex gap-3">
                  <span className="text-white/20 shrink-0 mt-0.5">▸</span>
                  <p><strong className="text-white/55">Facturation et prévention de la fraude</strong> — obligation légale / exécution du contrat</p>
                </div>
                <div className="flex gap-3">
                  <span className="text-white/20 shrink-0 mt-0.5">▸</span>
                  <p><strong className="text-white/55">Communications transactionnelles</strong> — exécution du contrat (notifications service, sécurité)</p>
                </div>
              </div>
            </div>

            {/* Article 4 */}
            <div className="p-5 md:p-6 bg-white/[0.02] border border-white/[0.05] rounded-2xl">
              <h2 className="font-title text-lg md:text-xl font-semibold text-white mb-3">4. Durées de conservation</h2>
              <div className="space-y-3 text-sm md:text-base text-white/40 leading-relaxed">
                <div className="flex gap-3 items-start">
                  <span className="text-white/20 shrink-0 mt-0.5">▸</span>
                  <p><strong className="text-white/55">Données de compte</strong> — conservées pendant toute la durée du contrat, puis 3 ans après résiliation à des fins de preuve et d&apos;obligations légales</p>
                </div>
                <div className="flex gap-3 items-start">
                  <span className="text-white/20 shrink-0 mt-0.5">▸</span>
                  <p><strong className="text-white/55">Données de géolocalisation brutes</strong> — non conservées au-delà de la session active. Les données agrégées et anonymisées (zones, densités horaires) sont conservées 5 ans à des fins d&apos;amélioration des modèles</p>
                </div>
                <div className="flex gap-3 items-start">
                  <span className="text-white/20 shrink-0 mt-0.5">▸</span>
                  <p><strong className="text-white/55">Enregistrements vocaux</strong> — aucune conservation. Traitement instantané, suppression immédiate</p>
                </div>
                <div className="flex gap-3 items-start">
                  <span className="text-white/20 shrink-0 mt-0.5">▸</span>
                  <p><strong className="text-white/55">Données comportementales agrégées</strong> — 5 ans (anonymisées, non rattachées à un individu après 12 mois)</p>
                </div>
                <div className="flex gap-3 items-start">
                  <span className="text-white/20 shrink-0 mt-0.5">▸</span>
                  <p><strong className="text-white/55">Journaux techniques</strong> — 12 mois</p>
                </div>
                <div className="flex gap-3 items-start">
                  <span className="text-white/20 shrink-0 mt-0.5">▸</span>
                  <p><strong className="text-white/55">Données de facturation</strong> — 10 ans (obligation comptable légale)</p>
                </div>
              </div>
            </div>

            {/* Article 5 */}
            <div className="p-5 md:p-6 bg-white/[0.02] border border-white/[0.05] rounded-2xl">
              <h2 className="font-title text-lg md:text-xl font-semibold text-white mb-3">5. Destinataires et sous-traitants</h2>
              <p className="text-sm md:text-base text-white/40 leading-relaxed mb-4">
                FOREAS ne vend pas vos données personnelles à des tiers. Les données peuvent être transmises aux sous-traitants techniques suivants, dans le strict cadre de la fourniture du Service :
              </p>
              <div className="space-y-3">
                <div className="p-3 bg-white/[0.03] rounded-xl">
                  <p className="text-sm font-semibold text-white/60 mb-1">Supabase</p>
                  <p className="text-xs text-white/35 leading-relaxed">Base de données et authentification — Hébergement dans l&apos;Union Européenne (Frankfurt, AWS eu-central-1) — Conformité RGPD</p>
                </div>
                <div className="p-3 bg-white/[0.03] rounded-xl">
                  <p className="text-sm font-semibold text-white/60 mb-1">Stripe</p>
                  <p className="text-xs text-white/35 leading-relaxed">Traitement des paiements — Certifié PCI-DSS niveau 1 — Données de facturation uniquement, non transmises à FOREAS</p>
                </div>
                <div className="p-3 bg-white/[0.03] rounded-xl">
                  <p className="text-sm font-semibold text-white/60 mb-1">ElevenLabs</p>
                  <p className="text-xs text-white/35 leading-relaxed">Synthèse vocale pour l&apos;assistant Ajnaya — Traitement en temps réel, aucune rétention audio — API conforme aux standards de sécurité industriels</p>
                </div>
                <div className="p-3 bg-white/[0.03] rounded-xl">
                  <p className="text-sm font-semibold text-white/60 mb-1">Railway</p>
                  <p className="text-xs text-white/35 leading-relaxed">Infrastructure backend et déploiement des services IA — Hébergement sécurisé</p>
                </div>
                <div className="p-3 bg-white/[0.03] rounded-xl">
                  <p className="text-sm font-semibold text-white/60 mb-1">Vercel</p>
                  <p className="text-xs text-white/35 leading-relaxed">Hébergement du site web foreas.xyz — Aucune donnée utilisateur applicative</p>
                </div>
              </div>
              <p className="text-sm md:text-base text-white/40 leading-relaxed mt-4">
                En cas de transfert hors UE, FOREAS s&apos;assure que des garanties appropriées sont en place (clauses contractuelles types de la Commission européenne ou décisions d&apos;adéquation).
              </p>
            </div>

            {/* Article 6 */}
            <div className="p-5 md:p-6 bg-white/[0.02] border border-white/[0.05] rounded-2xl">
              <h2 className="font-title text-lg md:text-xl font-semibold text-white mb-3">6. Vos droits</h2>
              <p className="text-sm md:text-base text-white/40 leading-relaxed mb-4">
                Conformément au RGPD, vous disposez des droits suivants sur vos données personnelles :
              </p>
              <div className="space-y-2 text-sm md:text-base text-white/40 leading-relaxed">
                <div className="flex gap-3"><span className="text-white/20 shrink-0">▸</span><p><strong className="text-white/55">Droit d&apos;accès</strong> — obtenir une copie de vos données traitées par FOREAS</p></div>
                <div className="flex gap-3"><span className="text-white/20 shrink-0">▸</span><p><strong className="text-white/55">Droit de rectification</strong> — corriger des données inexactes ou incomplètes</p></div>
                <div className="flex gap-3"><span className="text-white/20 shrink-0">▸</span><p><strong className="text-white/55">Droit à l&apos;effacement</strong> — demander la suppression de vos données (« droit à l&apos;oubli »)</p></div>
                <div className="flex gap-3"><span className="text-white/20 shrink-0">▸</span><p><strong className="text-white/55">Droit à la portabilité</strong> — recevoir vos données dans un format structuré et lisible par machine</p></div>
                <div className="flex gap-3"><span className="text-white/20 shrink-0">▸</span><p><strong className="text-white/55">Droit d&apos;opposition</strong> — vous opposer aux traitements fondés sur l&apos;intérêt légitime</p></div>
                <div className="flex gap-3"><span className="text-white/20 shrink-0">▸</span><p><strong className="text-white/55">Droit de limitation</strong> — demander la suspension temporaire d&apos;un traitement</p></div>
                <div className="flex gap-3"><span className="text-white/20 shrink-0">▸</span><p><strong className="text-white/55">Retrait du consentement</strong> — révoquer à tout moment votre consentement (localisation, voix) sans affecter la légalité des traitements antérieurs</p></div>
              </div>
              <p className="text-sm md:text-base text-white/40 leading-relaxed mt-4">
                Pour exercer ces droits, contactez-nous à <span className="text-white/60">contact@foreas.xyz</span>. Nous répondrons dans un délai maximum d&apos;un mois. Vous pouvez également adresser une réclamation auprès de la Commission Nationale de l&apos;Informatique et des Libertés (CNIL — cnil.fr).
              </p>
            </div>

            {/* Article 7 */}
            <div className="p-5 md:p-6 bg-white/[0.02] border border-white/[0.05] rounded-2xl">
              <h2 className="font-title text-lg md:text-xl font-semibold text-white mb-3">7. Sécurité des données</h2>
              <p className="text-sm md:text-base text-white/40 leading-relaxed">
                FOREAS met en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données contre tout accès non autorisé, perte, altération ou divulgation : chiffrement des données en transit (TLS 1.3) et au repos, authentification sécurisée, accès restreint aux données par les équipes internes, audits réguliers de sécurité.
              </p>
              <p className="text-sm md:text-base text-white/40 leading-relaxed mt-3">
                En cas de violation de données susceptible d&apos;engendrer un risque pour vos droits et libertés, FOREAS notifiera la CNIL dans les 72 heures et vous informera sans délai si le risque est élevé.
              </p>
            </div>

            {/* Article 8 */}
            <div className="p-5 md:p-6 bg-white/[0.02] border border-white/[0.05] rounded-2xl">
              <h2 className="font-title text-lg md:text-xl font-semibold text-white mb-3">8. Cookies et traceurs</h2>
              <p className="text-sm md:text-base text-white/40 leading-relaxed">
                L&apos;application mobile FOREAS n&apos;utilise pas de cookies publicitaires. Des traceurs techniques strictement nécessaires au fonctionnement du Service peuvent être utilisés (maintien de session, préférences). Le site web foreas.xyz peut utiliser des cookies d&apos;analyse anonyme de performance (sans identification personnelle).
              </p>
            </div>

            {/* Article 9 */}
            <div className="p-5 md:p-6 bg-white/[0.02] border border-white/[0.05] rounded-2xl">
              <h2 className="font-title text-lg md:text-xl font-semibold text-white mb-3">9. Mineurs</h2>
              <p className="text-sm md:text-base text-white/40 leading-relaxed">
                Le Service FOREAS est exclusivement destiné aux professionnels du transport de personnes âgés d&apos;au moins 18 ans. FOREAS ne collecte pas sciemment de données relatives à des personnes mineures.
              </p>
            </div>

            {/* Article 10 */}
            <div className="p-5 md:p-6 bg-white/[0.02] border border-white/[0.05] rounded-2xl">
              <h2 className="font-title text-lg md:text-xl font-semibold text-white mb-3">10. Modifications de la politique</h2>
              <p className="text-sm md:text-base text-white/40 leading-relaxed">
                FOREAS peut mettre à jour la présente Politique de Confidentialité pour refléter les évolutions légales, réglementaires ou techniques. La date de dernière mise à jour figure en haut de ce document. Les modifications substantielles vous seront notifiées par e-mail ou notification in-app avant leur entrée en vigueur.
              </p>
            </div>

            {/* Contact */}
            <div className="p-5 md:p-6 bg-white/[0.02] border border-white/[0.05] rounded-2xl">
              <h2 className="font-title text-lg md:text-xl font-semibold text-white mb-3">Contact & DPO</h2>
              <p className="text-sm md:text-base text-white/40 leading-relaxed">
                Pour toute question relative à vos données personnelles ou pour exercer vos droits :
              </p>
              <div className="mt-3 p-4 bg-white/[0.03] rounded-xl text-sm md:text-base text-white/50 leading-relaxed space-y-1">
                <p><span className="text-white/30">E-mail :</span> contact@foreas.xyz</p>
                <p><span className="text-white/30">Société :</span> FOREAS Labs — SIRET 940 879 281 — France</p>
                <p><span className="text-white/30">Autorité :</span> CNIL — 3 Place de Fontenoy, 75007 Paris — cnil.fr</p>
              </div>
            </div>

          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
