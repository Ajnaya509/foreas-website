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
            <p className="font-title text-xs font-semibold tracking-widest uppercase text-white/40 mb-3">Légal</p>
            <h1 className="font-title text-3xl md:text-4xl font-bold text-white mb-2">
              Politique de Confidentialité
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
              <h2 className="font-title text-lg md:text-xl font-semibold text-white/90 mb-3">Introduction</h2>
              <p className="font-sans text-sm md:text-base text-white/65 leading-relaxed">
                FOREAS Labs (SIRET 940&nbsp;879&nbsp;281) accorde une importance primordiale à la protection de vos données personnelles. La présente Politique de Confidentialité décrit de manière transparente les données collectées via l&apos;application FOREAS, les finalités de leur traitement, les bases juridiques, les destinataires, les durées de conservation et vos droits, conformément au Règlement Général sur la Protection des Données (RGPD — UE 2016/679) et à la loi française Informatique et Libertés.
              </p>
            </div>

            <div className="p-5 md:p-6 bg-white/[0.02] border border-white/[0.06] rounded-2xl">
              <h2 className="font-title text-lg md:text-xl font-semibold text-white/90 mb-3">1. Responsable du traitement</h2>
              <div className="mt-1 p-4 bg-white/[0.03] rounded-xl space-y-1.5">
                <p className="font-sans text-sm md:text-base text-white/65 leading-relaxed"><span className="text-white/45">Société :</span> <span className="text-white/80">FOREAS Labs</span></p>
                <p className="font-sans text-sm md:text-base text-white/65 leading-relaxed"><span className="text-white/45">SIRET :</span> <span className="text-white/80">940 879 281</span></p>
                <p className="font-sans text-sm md:text-base text-white/65 leading-relaxed"><span className="text-white/45">Pays :</span> France</p>
                <p className="font-sans text-sm md:text-base text-white/65 leading-relaxed"><span className="text-white/45">Contact :</span> <span className="text-white/80">contact@foreas.xyz</span></p>
              </div>
            </div>

            <div className="p-5 md:p-6 bg-white/[0.02] border border-white/[0.06] rounded-2xl">
              <h2 className="font-title text-lg md:text-xl font-semibold text-white/90 mb-4">2. Données collectées et autorisations requises</h2>

              <div className="space-y-5">
                <div>
                  <p className="font-title italic text-sm font-semibold text-white/75 mb-2">a) Données de compte</p>
                  <p className="font-sans text-sm md:text-base text-white/65 leading-relaxed">
                    Prénom, nom, adresse e-mail, numéro de téléphone (optionnel), statut professionnel (VTC / taxi), informations de facturation traitées exclusivement par Stripe — non stockées par FOREAS.
                  </p>
                </div>

                <div>
                  <p className="font-title italic text-sm font-semibold text-white/75 mb-2">
                    b) Géolocalisation — <code className="font-sans text-xs bg-white/[0.08] px-1.5 py-0.5 rounded not-italic text-white/60">ACCESS_FINE_LOCATION</code>
                  </p>
                  <p className="font-sans text-sm md:text-base text-white/65 leading-relaxed">
                    Votre position GPS précise est utilisée pour générer des recommandations de zones, calculer les temps de repositionnement, détecter les zones à forte demande et analyser vos parcours. La localisation est collectée uniquement lorsque l&apos;application est active et avec votre consentement explicite. Aucune donnée de localisation brute n&apos;est partagée avec des tiers à des fins publicitaires.
                  </p>
                </div>

                <div>
                  <p className="font-title italic text-sm font-semibold text-white/75 mb-2">
                    c) Données vocales — <code className="font-sans text-xs bg-white/[0.08] px-1.5 py-0.5 rounded not-italic text-white/60">RECORD_AUDIO</code>
                  </p>
                  <p className="font-sans text-sm md:text-base text-white/65 leading-relaxed">
                    Le microphone est utilisé exclusivement pour les commandes vocales adressées à l&apos;assistant Ajnaya. Les séquences audio sont transmises en temps réel au service ElevenLabs pour génération de réponse, puis immédiatement supprimées. <strong className="text-white/80 font-semibold">Aucun enregistrement vocal n&apos;est conservé par FOREAS ni par ElevenLabs.</strong> Le microphone n&apos;est jamais activé en arrière-plan sans action explicite de l&apos;Utilisateur.
                  </p>
                </div>

                <div>
                  <p className="font-title italic text-sm font-semibold text-white/75 mb-2">d) Données comportementales et opérationnelles</p>
                  <p className="font-sans text-sm md:text-base text-white/65 leading-relaxed">
                    Historique des sessions actives, zones fréquentées (agrégées et anonymisées), horaires d&apos;activité, interactions avec les recommandations (acceptation / refus), durée et fréquence d&apos;utilisation. Ces données servent à améliorer la pertinence des recommandations et à entraîner les modèles d&apos;IA propriétaires FOREAS.
                  </p>
                </div>

                <div>
                  <p className="font-title italic text-sm font-semibold text-white/75 mb-2">e) Données techniques</p>
                  <p className="font-sans text-sm md:text-base text-white/65 leading-relaxed">
                    Identifiant de l&apos;appareil, système d&apos;exploitation, version de l&apos;application, journaux d&apos;erreurs à des fins de diagnostic et de stabilité.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5 md:p-6 bg-white/[0.02] border border-white/[0.06] rounded-2xl">
              <h2 className="font-title text-lg md:text-xl font-semibold text-white/90 mb-3">3. Finalités et bases juridiques</h2>
              <div className="space-y-3">
                <div className="flex gap-3">
                  <span className="text-white/35 shrink-0 mt-0.5">▸</span>
                  <p className="font-sans text-sm md:text-base text-white/65 leading-relaxed"><strong className="text-white/80 font-semibold">Fourniture du Service</strong> — exécution du contrat d&apos;abonnement (art. 6.1.b RGPD)</p>
                </div>
                <div className="flex gap-3">
                  <span className="text-white/35 shrink-0 mt-0.5">▸</span>
                  <p className="font-sans text-sm md:text-base text-white/65 leading-relaxed"><strong className="text-white/80 font-semibold">Recommandations IA de zones et d&apos;horaires</strong> — exécution du contrat / intérêt légitime</p>
                </div>
                <div className="flex gap-3">
                  <span className="text-white/35 shrink-0 mt-0.5">▸</span>
                  <p className="font-sans text-sm md:text-base text-white/65 leading-relaxed"><strong className="text-white/80 font-semibold">Géolocalisation pour suggestions</strong> — consentement explicite (art. 6.1.a RGPD) — révocable à tout moment</p>
                </div>
                <div className="flex gap-3">
                  <span className="text-white/35 shrink-0 mt-0.5">▸</span>
                  <p className="font-sans text-sm md:text-base text-white/65 leading-relaxed"><strong className="text-white/80 font-semibold">Commandes vocales Ajnaya</strong> — consentement explicite (art. 6.1.a RGPD)</p>
                </div>
                <div className="flex gap-3">
                  <span className="text-white/35 shrink-0 mt-0.5">▸</span>
                  <p className="font-sans text-sm md:text-base text-white/65 leading-relaxed"><strong className="text-white/80 font-semibold">Entraînement des modèles IA internes</strong> — intérêt légitime (art. 6.1.f) — données agrégées et anonymisées</p>
                </div>
                <div className="flex gap-3">
                  <span className="text-white/35 shrink-0 mt-0.5">▸</span>
                  <p className="font-sans text-sm md:text-base text-white/65 leading-relaxed"><strong className="text-white/80 font-semibold">Facturation et prévention de la fraude</strong> — obligation légale / exécution du contrat</p>
                </div>
              </div>
            </div>

            <div className="p-5 md:p-6 bg-white/[0.02] border border-white/[0.06] rounded-2xl">
              <h2 className="font-title text-lg md:text-xl font-semibold text-white/90 mb-3">4. Durées de conservation</h2>
              <div className="space-y-3">
                <div className="flex gap-3 items-start">
                  <span className="text-white/35 shrink-0 mt-0.5">▸</span>
                  <p className="font-sans text-sm md:text-base text-white/65 leading-relaxed"><strong className="text-white/80 font-semibold">Données de compte</strong> — durée du contrat, puis 3 ans après résiliation</p>
                </div>
                <div className="flex gap-3 items-start">
                  <span className="text-white/35 shrink-0 mt-0.5">▸</span>
                  <p className="font-sans text-sm md:text-base text-white/65 leading-relaxed"><strong className="text-white/80 font-semibold">Géolocalisation brute</strong> — non conservée au-delà de la session active. Données agrégées anonymisées : 5 ans</p>
                </div>
                <div className="flex gap-3 items-start">
                  <span className="text-white/35 shrink-0 mt-0.5">▸</span>
                  <p className="font-sans text-sm md:text-base text-white/65 leading-relaxed"><strong className="text-white/80 font-semibold">Enregistrements vocaux</strong> — <span className="text-white/80">aucune conservation</span>. Suppression immédiate après traitement</p>
                </div>
                <div className="flex gap-3 items-start">
                  <span className="text-white/35 shrink-0 mt-0.5">▸</span>
                  <p className="font-sans text-sm md:text-base text-white/65 leading-relaxed"><strong className="text-white/80 font-semibold">Données comportementales agrégées</strong> — 5 ans (anonymisées après 12 mois)</p>
                </div>
                <div className="flex gap-3 items-start">
                  <span className="text-white/35 shrink-0 mt-0.5">▸</span>
                  <p className="font-sans text-sm md:text-base text-white/65 leading-relaxed"><strong className="text-white/80 font-semibold">Journaux techniques</strong> — 12 mois</p>
                </div>
                <div className="flex gap-3 items-start">
                  <span className="text-white/35 shrink-0 mt-0.5">▸</span>
                  <p className="font-sans text-sm md:text-base text-white/65 leading-relaxed"><strong className="text-white/80 font-semibold">Données de facturation</strong> — 10 ans (obligation comptable légale)</p>
                </div>
              </div>
            </div>

            <div className="p-5 md:p-6 bg-white/[0.02] border border-white/[0.06] rounded-2xl">
              <h2 className="font-title text-lg md:text-xl font-semibold text-white/90 mb-4">5. Sous-traitants</h2>
              <p className="font-sans text-sm md:text-base text-white/65 leading-relaxed mb-4">
                FOREAS ne vend pas vos données personnelles. Les données peuvent être transmises aux sous-traitants techniques suivants :
              </p>
              <div className="space-y-3">
                {[
                  { name: 'Supabase', desc: 'Base de données et authentification — Hébergement dans l\'Union Européenne (Frankfurt, AWS eu-central-1) — Conformité RGPD' },
                  { name: 'Stripe', desc: 'Traitement des paiements — Certifié PCI-DSS niveau 1 — Données de facturation uniquement, non transmises à FOREAS' },
                  { name: 'ElevenLabs', desc: 'Synthèse vocale pour l\'assistant Ajnaya — Traitement en temps réel, aucune rétention audio' },
                  { name: 'Railway', desc: 'Infrastructure backend et déploiement des services IA — Hébergement sécurisé' },
                  { name: 'Vercel', desc: 'Hébergement du site web foreas.xyz — Aucune donnée utilisateur applicative' },
                ].map((item) => (
                  <div key={item.name} className="p-3.5 bg-white/[0.03] rounded-xl">
                    <p className="font-title italic text-sm font-semibold text-white/75 mb-1">{item.name}</p>
                    <p className="font-sans text-xs text-white/55 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
              <p className="font-sans text-sm md:text-base text-white/65 leading-relaxed mt-4">
                En cas de transfert hors UE, FOREAS s&apos;assure que des garanties appropriées sont en place (clauses contractuelles types de la Commission européenne).
              </p>
            </div>

            <div className="p-5 md:p-6 bg-white/[0.02] border border-white/[0.06] rounded-2xl">
              <h2 className="font-title text-lg md:text-xl font-semibold text-white/90 mb-3">6. Vos droits</h2>
              <p className="font-sans text-sm md:text-base text-white/65 leading-relaxed mb-4">Conformément au RGPD, vous disposez des droits suivants :</p>
              <div className="space-y-2.5">
                {[
                  ['Droit d\'accès', 'obtenir une copie de vos données traitées par FOREAS'],
                  ['Droit de rectification', 'corriger des données inexactes ou incomplètes'],
                  ['Droit à l\'effacement', 'demander la suppression de vos données (« droit à l\'oubli »)'],
                  ['Droit à la portabilité', 'recevoir vos données dans un format structuré lisible par machine'],
                  ['Droit d\'opposition', 'vous opposer aux traitements fondés sur l\'intérêt légitime'],
                  ['Droit de limitation', 'demander la suspension temporaire d\'un traitement'],
                  ['Retrait du consentement', 'révoquer à tout moment votre consentement (localisation, voix)'],
                ].map(([right, desc]) => (
                  <div key={right} className="flex gap-3">
                    <span className="text-white/35 shrink-0 mt-0.5">▸</span>
                    <p className="font-sans text-sm md:text-base text-white/65 leading-relaxed"><strong className="text-white/80 font-semibold">{right}</strong> — {desc}</p>
                  </div>
                ))}
              </div>
              <p className="font-sans text-sm md:text-base text-white/65 leading-relaxed mt-4">
                Pour exercer ces droits : <span className="text-white/80">contact@foreas.xyz</span>. Délai de réponse maximum : 1 mois. Vous pouvez également saisir la <span className="text-white/80">CNIL</span> (cnil.fr).
              </p>
            </div>

            <div className="p-5 md:p-6 bg-white/[0.02] border border-white/[0.06] rounded-2xl">
              <h2 className="font-title text-lg md:text-xl font-semibold text-white/90 mb-3">7. Sécurité</h2>
              <p className="font-sans text-sm md:text-base text-white/65 leading-relaxed">
                FOREAS met en œuvre des mesures techniques et organisationnelles appropriées : chiffrement en transit (TLS 1.3) et au repos, authentification sécurisée, accès restreint aux données en interne, audits réguliers. En cas de violation à risque élevé, la CNIL est notifiée dans les 72 heures et vous en êtes informé sans délai.
              </p>
            </div>

            <div className="p-5 md:p-6 bg-white/[0.02] border border-white/[0.06] rounded-2xl">
              <h2 className="font-title text-lg md:text-xl font-semibold text-white/90 mb-3">8. Cookies</h2>
              <p className="font-sans text-sm md:text-base text-white/65 leading-relaxed">
                L&apos;application mobile FOREAS n&apos;utilise pas de cookies publicitaires. Des traceurs techniques strictement nécessaires au fonctionnement du Service peuvent être utilisés (maintien de session, préférences). Le site web foreas.xyz peut utiliser des cookies d&apos;analyse de performance anonyme.
              </p>
            </div>

            <div className="p-5 md:p-6 bg-white/[0.02] border border-white/[0.06] rounded-2xl">
              <h2 className="font-title text-lg md:text-xl font-semibold text-white/90 mb-3">9. Mineurs</h2>
              <p className="font-sans text-sm md:text-base text-white/65 leading-relaxed">
                Le Service est exclusivement destiné aux professionnels du transport de personnes âgés d&apos;au moins 18 ans. FOREAS ne collecte pas sciemment de données relatives à des personnes mineures.
              </p>
            </div>

            <div className="p-5 md:p-6 bg-white/[0.02] border border-white/[0.06] rounded-2xl">
              <h2 className="font-title text-lg md:text-xl font-semibold text-white/90 mb-3">10. Modifications</h2>
              <p className="font-sans text-sm md:text-base text-white/65 leading-relaxed">
                FOREAS peut mettre à jour la présente Politique pour refléter les évolutions légales, réglementaires ou techniques. La date de dernière mise à jour figure en haut de ce document. Les modifications substantielles vous seront notifiées par e-mail ou notification in-app.
              </p>
            </div>

            <div className="p-5 md:p-6 bg-white/[0.02] border border-white/[0.06] rounded-2xl">
              <h2 className="font-title text-lg md:text-xl font-semibold text-white/90 mb-3">Contact & DPO</h2>
              <div className="mt-1 p-4 bg-white/[0.03] rounded-xl space-y-1.5">
                <p className="font-sans text-sm md:text-base text-white/65"><span className="text-white/45">E-mail :</span> <span className="text-white/80">contact@foreas.xyz</span></p>
                <p className="font-sans text-sm md:text-base text-white/65"><span className="text-white/45">Société :</span> FOREAS Labs — SIRET 940 879 281 — France</p>
                <p className="font-sans text-sm md:text-base text-white/65"><span className="text-white/45">Autorité :</span> CNIL — 3 Place de Fontenoy, 75007 Paris — cnil.fr</p>
              </div>
            </div>

          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
