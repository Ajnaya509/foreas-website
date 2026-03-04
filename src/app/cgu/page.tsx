'use client'

import { motion } from 'framer-motion'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function CGUPage() {
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
              Conditions Générales d&apos;Utilisation
            </h1>
            <p className="text-sm text-white/30 mb-8 md:mb-12">Dernière mise à jour : Mars 2026</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="space-y-6 md:space-y-8"
          >

            {/* Article 1 */}
            <div className="p-5 md:p-6 bg-white/[0.02] border border-white/[0.05] rounded-2xl">
              <h2 className="font-title text-lg md:text-xl font-semibold text-white mb-3">1. Objet</h2>
              <p className="text-sm md:text-base text-white/40 leading-relaxed">
                Les présentes Conditions Générales d&apos;Utilisation (ci-après « CGU ») régissent l&apos;accès et l&apos;utilisation de l&apos;application mobile FOREAS et de l&apos;ensemble des services associés (ci-après le « Service ») proposés par FOREAS Labs, société immatriculée sous le SIRET 940&nbsp;879&nbsp;281, dont le siège social est en France (ci-après « FOREAS »).
              </p>
              <p className="text-sm md:text-base text-white/40 leading-relaxed mt-3">
                Le Service est un assistant d&apos;aide à la décision destiné exclusivement aux professionnels du transport de personnes titulaires d&apos;une carte VTC, d&apos;une licence taxi ou d&apos;une autorisation équivalente délivrée par une autorité compétente (ci-après l&apos;« Utilisateur »).
              </p>
            </div>

            {/* Article 2 */}
            <div className="p-5 md:p-6 bg-white/[0.02] border border-white/[0.05] rounded-2xl">
              <h2 className="font-title text-lg md:text-xl font-semibold text-white mb-3">2. Acceptation des conditions</h2>
              <p className="text-sm md:text-base text-white/40 leading-relaxed">
                L&apos;accès au Service implique l&apos;acceptation pleine et entière des présentes CGU. En téléchargeant, installant ou utilisant l&apos;application FOREAS, l&apos;Utilisateur reconnaît avoir lu, compris et accepté sans réserve les présentes conditions.
              </p>
              <p className="text-sm md:text-base text-white/40 leading-relaxed mt-3">
                Si l&apos;Utilisateur n&apos;accepte pas les présentes CGU, il doit cesser immédiatement d&apos;utiliser le Service et désinstaller l&apos;application.
              </p>
            </div>

            {/* Article 3 */}
            <div className="p-5 md:p-6 bg-white/[0.02] border border-white/[0.05] rounded-2xl">
              <h2 className="font-title text-lg md:text-xl font-semibold text-white mb-3">3. Accès et inscription</h2>
              <p className="text-sm md:text-base text-white/40 leading-relaxed">
                L&apos;accès au Service nécessite la création d&apos;un compte personnel avec une adresse e-mail valide et un mot de passe. L&apos;Utilisateur s&apos;engage à fournir des informations exactes, complètes et à les maintenir à jour. Chaque compte est strictement personnel et non cessible.
              </p>
              <p className="text-sm md:text-base text-white/40 leading-relaxed mt-3">
                L&apos;Utilisateur est seul responsable de la confidentialité de ses identifiants de connexion. Toute utilisation du Service depuis son compte est réputée effectuée par l&apos;Utilisateur. En cas de compromission de son compte, il doit en informer FOREAS sans délai à l&apos;adresse contact@foreas.xyz.
              </p>
            </div>

            {/* Article 4 */}
            <div className="p-5 md:p-6 bg-white/[0.02] border border-white/[0.05] rounded-2xl">
              <h2 className="font-title text-lg md:text-xl font-semibold text-white mb-3">4. Description du Service</h2>
              <p className="text-sm md:text-base text-white/40 leading-relaxed">
                FOREAS est un assistant IA de pilotage pour chauffeurs professionnels. Le Service fournit notamment :
              </p>
              <ul className="mt-3 space-y-2 text-sm md:text-base text-white/40 leading-relaxed list-none">
                <li className="pl-4 border-l border-white/10">Des recommandations de zones et d&apos;horaires basées sur l&apos;analyse de données géographiques, temporelles et contextuelles ;</li>
                <li className="pl-4 border-l border-white/10">Des alertes et suggestions en temps réel via l&apos;assistant vocal Ajnaya ;</li>
                <li className="pl-4 border-l border-white/10">Des tableaux de bord de suivi de performance et de revenus ;</li>
                <li className="pl-4 border-l border-white/10">Des indicateurs d&apos;optimisation d&apos;itinéraires et de temps de repositionnement.</li>
              </ul>
              <p className="text-sm md:text-base text-white/40 leading-relaxed mt-3">
                Les recommandations fournies par le Service sont de nature indicative et ne constituent en aucun cas une obligation ou une garantie de résultat. Elles ne remplacent pas le jugement professionnel du chauffeur ni les obligations légales qui lui incombent.
              </p>
            </div>

            {/* Article 5 */}
            <div className="p-5 md:p-6 bg-white/[0.02] border border-white/[0.05] rounded-2xl">
              <h2 className="font-title text-lg md:text-xl font-semibold text-white mb-3">5. Obligations de l&apos;Utilisateur</h2>
              <p className="text-sm md:text-base text-white/40 leading-relaxed">
                L&apos;Utilisateur s&apos;engage à :
              </p>
              <ul className="mt-3 space-y-2 text-sm md:text-base text-white/40 leading-relaxed list-none">
                <li className="pl-4 border-l border-white/10">Utiliser le Service conformément à la réglementation en vigueur, notamment le Code des transports et les règles applicables à sa profession ;</li>
                <li className="pl-4 border-l border-white/10">Ne jamais utiliser l&apos;application de manière à mettre en danger sa sécurité ou celle des tiers — toute interaction avec l&apos;application pendant la conduite doit se limiter aux fonctions mains libres et aux commandes vocales ;</li>
                <li className="pl-4 border-l border-white/10">Ne pas reproduire, copier, vendre, revendre ou exploiter le Service à des fins commerciales sans autorisation écrite préalable de FOREAS ;</li>
                <li className="pl-4 border-l border-white/10">Ne pas tenter de contourner, désactiver ou interférer avec les mécanismes de sécurité du Service ;</li>
                <li className="pl-4 border-l border-white/10">Ne pas utiliser de systèmes automatisés (bots, scrapers) pour accéder au Service.</li>
              </ul>
            </div>

            {/* Article 6 */}
            <div className="p-5 md:p-6 bg-white/[0.02] border border-white/[0.05] rounded-2xl">
              <h2 className="font-title text-lg md:text-xl font-semibold text-white mb-3">6. Abonnement et facturation</h2>
              <p className="text-sm md:text-base text-white/40 leading-relaxed">
                L&apos;accès complet au Service est conditionné à la souscription d&apos;un abonnement payant. Les tarifs, modalités d&apos;abonnement, périodes d&apos;essai et conditions de renouvellement sont présentés sur le site foreas.xyz/tarifs et peuvent être mis à jour par FOREAS à tout moment, avec un préavis raisonnable.
              </p>
              <p className="text-sm md:text-base text-white/40 leading-relaxed mt-3">
                Les paiements sont traités par Stripe, prestataire de services de paiement conforme PCI-DSS. FOREAS ne stocke aucune donnée bancaire de l&apos;Utilisateur. En cas d&apos;échec de paiement, FOREAS se réserve le droit de suspendre l&apos;accès au Service jusqu&apos;à régularisation.
              </p>
              <p className="text-sm md:text-base text-white/40 leading-relaxed mt-3">
                Conformément à l&apos;article L. 221-28 du Code de la consommation, le droit de rétractation de 14 jours ne s&apos;applique pas dès lors que l&apos;Utilisateur a expressément consenti à l&apos;accès immédiat au Service numérique.
              </p>
            </div>

            {/* Article 7 */}
            <div className="p-5 md:p-6 bg-white/[0.02] border border-white/[0.05] rounded-2xl">
              <h2 className="font-title text-lg md:text-xl font-semibold text-white mb-3">7. Résiliation</h2>
              <p className="text-sm md:text-base text-white/40 leading-relaxed">
                L&apos;Utilisateur peut résilier son abonnement à tout moment depuis son espace personnel ou en contactant FOREAS à contact@foreas.xyz. La résiliation prend effet à l&apos;issue de la période d&apos;abonnement en cours ; aucun remboursement au prorata n&apos;est effectué sauf disposition légale contraire.
              </p>
              <p className="text-sm md:text-base text-white/40 leading-relaxed mt-3">
                FOREAS se réserve le droit de résilier ou de suspendre l&apos;accès d&apos;un Utilisateur sans préavis en cas de violation des présentes CGU, d&apos;utilisation frauduleuse ou de comportement préjudiciable aux intérêts de FOREAS ou des autres utilisateurs.
              </p>
            </div>

            {/* Article 8 */}
            <div className="p-5 md:p-6 bg-white/[0.02] border border-white/[0.05] rounded-2xl">
              <h2 className="font-title text-lg md:text-xl font-semibold text-white mb-3">8. Propriété intellectuelle</h2>
              <p className="text-sm md:text-base text-white/40 leading-relaxed">
                L&apos;ensemble des éléments constituant le Service — application, algorithmes, modèles d&apos;intelligence artificielle, interfaces, bases de données, contenus, marque FOREAS et logo — sont la propriété exclusive de FOREAS Labs et sont protégés par le droit de la propriété intellectuelle.
              </p>
              <p className="text-sm md:text-base text-white/40 leading-relaxed mt-3">
                L&apos;Utilisateur bénéficie d&apos;une licence d&apos;utilisation personnelle, non exclusive, non cessible et révocable, limitée à l&apos;utilisation du Service dans le cadre de son activité professionnelle de chauffeur. Toute reproduction, extraction, exploitation commerciale ou utilisation non autorisée est strictement interdite.
              </p>
            </div>

            {/* Article 9 */}
            <div className="p-5 md:p-6 bg-white/[0.02] border border-white/[0.05] rounded-2xl">
              <h2 className="font-title text-lg md:text-xl font-semibold text-white mb-3">9. Limitation de responsabilité</h2>
              <p className="text-sm md:text-base text-white/40 leading-relaxed">
                Le Service est fourni « en l&apos;état ». FOREAS s&apos;efforce d&apos;assurer la disponibilité et la fiabilité du Service, sans toutefois garantir une disponibilité ininterrompue ni l&apos;exactitude absolue des recommandations.
              </p>
              <p className="text-sm md:text-base text-white/40 leading-relaxed mt-3">
                FOREAS ne saurait être tenu responsable des décisions prises par l&apos;Utilisateur sur la base des recommandations de l&apos;application, des pertes de revenus ou manques à gagner résultant d&apos;une interruption de service, ni des dommages indirects ou consécutifs de quelque nature que ce soit.
              </p>
              <p className="text-sm md:text-base text-white/40 leading-relaxed mt-3">
                La responsabilité de FOREAS ne saurait excéder, pour quelque cause que ce soit, le montant des sommes effectivement versées par l&apos;Utilisateur au titre de son abonnement au cours des 3 derniers mois précédant le fait générateur.
              </p>
            </div>

            {/* Article 10 */}
            <div className="p-5 md:p-6 bg-white/[0.02] border border-white/[0.05] rounded-2xl">
              <h2 className="font-title text-lg md:text-xl font-semibold text-white mb-3">10. Droit applicable et juridiction</h2>
              <p className="text-sm md:text-base text-white/40 leading-relaxed">
                Les présentes CGU sont soumises au droit français. En cas de litige, les parties s&apos;efforceront de trouver une solution amiable. À défaut d&apos;accord, les tribunaux compétents du ressort de Paris seront seuls compétents, sous réserve des règles de compétence impératives applicables aux consommateurs.
              </p>
              <p className="text-sm md:text-base text-white/40 leading-relaxed mt-3">
                FOREAS se réserve le droit de modifier les présentes CGU à tout moment. Les modifications entrent en vigueur dès leur publication dans l&apos;application ou sur le site. L&apos;Utilisateur sera informé des modifications substantielles par notification in-app ou par e-mail.
              </p>
            </div>

            {/* Contact */}
            <div className="p-5 md:p-6 bg-white/[0.02] border border-white/[0.05] rounded-2xl">
              <h2 className="font-title text-lg md:text-xl font-semibold text-white mb-3">Contact</h2>
              <p className="text-sm md:text-base text-white/40 leading-relaxed">
                Pour toute question relative aux présentes CGU : <span className="text-white/60">contact@foreas.xyz</span>
              </p>
              <p className="text-sm md:text-base text-white/40 leading-relaxed mt-2">
                FOREAS Labs — SIRET 940&nbsp;879&nbsp;281 — France
              </p>
            </div>

          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
