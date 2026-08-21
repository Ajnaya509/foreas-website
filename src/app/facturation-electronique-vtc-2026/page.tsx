/**
 * Landing SEO — foreas.xyz/facturation-electronique-vtc-2026
 *
 * Target query primaire : "facturation électronique VTC 2026"
 * Intent : informationnel → transactionnel (CTA → /tarifs2)
 *
 * Palette : Dark Sovereign site (#050508 / #00D4FF / #8C52FF / #10B981)
 * Guardrail légal : FOREAS = copilote compta, PAS expert-comptable
 * (ordonnance du 19 sept. 1945, art. 20).
 *
 * ⚠️ TOUT CE QUI CONCERNE LA PLATEFORME AGRÉÉE S'ÉCRIT AU FUTUR.
 * Mesure du 14/08/2026 : grep pennylane|iopole|tiime|pdp sur
 * /Users/chandlermilien/foreas-website/src ET sur /Users/chandlermilien/FOREAS-Clean/src
 * → aucune ligne de code d'intégration, uniquement ce texte marketing. Table
 * `invoices` (Supabase fihvdvlhftcxhlnocqiq) = 0 ligne, aucune autre table
 * facture/PDP. Il n'existe donc aucune plomberie branchée : la promesse est
 * réelle, mais elle est à venir.
 */

import type { Metadata } from 'next'
import { canonique, URL_SITE } from '@/lib/site'
import Link from 'next/link'
import { ESSAI_JOURS, PRIX_MENSUEL_CENTIMES, formaterEuros } from '@/lib/offre'

import MesureVue from '@/components/mesure/MesureVue'
const PRIX_MOIS = formaterEuros(PRIX_MENSUEL_CENTIMES)

/**
 * FAC-03 — le titre du CTA final disait « 4 mois avant l'échéance ». C'était vrai
 * le jour de la rédaction (datePublished 2026-04-21) et jamais recalculé depuis :
 * mesuré le 14/08/2026, il restait 18 jours, soit 0,59 mois. Un compte à rebours
 * écrit en dur se périme mécaniquement — celui-ci se recalcule à chaque rendu
 * depuis la seule date qui fait foi.
 * Source de l'échéance : impots.gouv.fr — réception obligatoire pour toutes les
 * entreprises au 1er septembre 2026.
 */
const DATE_ECHEANCE = new Date('2026-09-01T00:00:00+02:00')

/**
 * Page statique : sans ce revalidate, le compte à rebours ci-dessus gèlerait à la
 * date du build — exactement la panne qu'on répare.
 */
export const revalidate = 86400

/** Toujours arrondi vers le BAS : ne jamais annoncer plus de temps qu'il n'en reste. */
function compteARebours(maintenant: Date = new Date()): string {
  const jours = Math.ceil((DATE_ECHEANCE.getTime() - maintenant.getTime()) / 86_400_000)
  if (jours <= 0) return 'L’échéance du 1er septembre 2026 est passée.'
  if (jours === 1) return 'Plus qu’un jour avant l’échéance.'
  if (jours <= 14) return `Plus que ${jours} jours avant l’échéance.`
  const semaines = Math.floor(jours / 7)
  if (semaines <= 10) return `Plus que ${semaines} semaines avant l’échéance.`
  return `Plus que ${Math.floor(jours / 30.44)} mois avant l’échéance.`
}

/**
 * FAC-14 — le JSON-LD déclarait à Google dateModified 2026-04-23 alors que
 * git log sur ce fichier montrait ae81593 du 2026-07-31, puis cette révision.
 * À remettre à jour À CHAQUE modification du texte de cette page : une date
 * figée dans un JSON-LD se périme au premier commit.
 */
const DERNIERE_REVISION = '2026-08-14'

export const metadata: Metadata = {
  // FAC-13 — « Plateforme Agréée DGFiP intégrée » : présent de l'indicatif pour une
  // intégration qui n'existe dans aucun des deux dépôts (0 ligne de code PA,
  // `invoices` = 0 ligne le 14/08/2026). C'est la description que Google sert en
  // résultat de recherche sur la requête cible : elle se corrige en premier.
  title: 'Facturation électronique VTC 2026 — Ce que tu dois savoir (et ce que FOREAS prépare pour toi)',
  description:
    'Au 1er septembre 2026, tous les chauffeurs VTC auto-entrepreneurs doivent pouvoir recevoir des factures électroniques. FOREAS branchera pour toi une Plateforme Agréée DGFiP — tu continues à travailler, on s\'occupe de la plomberie.',
  keywords: [
    'facturation électronique VTC',
    'facturation électronique 2026',
    'e-invoice VTC',
    'VTC auto-entrepreneur facture électronique',
    'PDP VTC',
    'plateforme agréée DGFiP VTC',
    'URSSAF facture électronique',
    'réforme DGFiP 2026 VTC',
  ],
  alternates: {
    canonical: canonique('/facturation-electronique-vtc-2026'),
  },
  openGraph: {
    title: 'Facturation électronique VTC — Sept 2026 | FOREAS',
    // FAC-13 (jumeau Open Graph) — « solution prête » affirmait la même intégration
    // inexistante. C'est le texte que voient WhatsApp et LinkedIn au partage :
    // corrigé d'un côté et oublié dans le jumeau, le mensonge survit.
    description:
      'Guide clair pour les chauffeurs VTC : réception obligatoire dès sept 2026, émission B2B sept 2027, et ce que FOREAS prépare pour toi.',
    url: `${URL_SITE}/facturation-electronique-vtc-2026`,
    siteName: 'FOREAS',
    locale: 'fr_FR',
    type: 'article',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Facturation électronique VTC 2026 — FOREAS',
    // FAC-13 (jumeau Twitter) — même correction : « gère » → ce qui est préparé.
    description: 'Ce qui change, quand, et ce que FOREAS prépare pour toi.',
  },
}

// Structured data (Schema.org Article + FAQPage) — rich snippets Google
const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Article',
      headline: 'Facturation électronique VTC 2026 — Guide et solution FOREAS',
      datePublished: '2026-04-21',
      // FAC-14 — figé à 2026-04-23 alors que le fichier avait déjà été modifié le
      // 2026-07-31 (commit ae81593). On déclarait à Google une fraîcheur fausse de
      // plus de 3 mois. Voir DERNIERE_REVISION ci-dessus.
      dateModified: DERNIERE_REVISION,
      author: { '@type': 'Organization', name: 'FOREAS Labs' },
      publisher: { '@type': 'Organization', name: 'FOREAS', url: URL_SITE },
      mainEntityOfPage: `${URL_SITE}/facturation-electronique-vtc-2026`,
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Suis-je concerné en tant que chauffeur VTC auto-entrepreneur ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Oui. Tous les chauffeurs VTC auto-entrepreneurs sont concernés, même en franchise de TVA. Au 1er septembre 2026, tu dois pouvoir recevoir des factures électroniques de tes fournisseurs (assurance, carburant, leasing, plateformes Uber/Bolt).',
          },
        },
        {
          '@type': 'Question',
          name: 'Qu\'est-ce qu\'une Plateforme Agréée (PA, ex-PDP) ?',
          acceptedAnswer: {
            '@type': 'Answer',
            // FAC-05/FAC-07 (jumeau JSON-LD) — « intègre » au présent : 0 ligne de
            // code PA dans les deux dépôts, `invoices` = 0 ligne. Google indexe
            // cette réponse en rich snippet, elle doit dire la même vérité que la page.
            text: 'C\'est un logiciel certifié par la DGFiP qui transmet les factures électroniques entre entreprises et l\'administration. 112 plateformes étaient immatriculées en mars 2026. FOREAS prépare l\'intégration d\'une PA partenaire pour toi.',
          },
        },
        {
          '@type': 'Question',
          name: 'Que dois-je faire d\'ici le 1er septembre 2026 ?',
          acceptedAnswer: {
            '@type': 'Answer',
            // FAC-12 (jumeau JSON-LD) — « rien de complexe, on branche » disait à un
            // chauffeur légalement tenu dans 18 jours qu'il n'avait rien à faire, en
            // s'appuyant sur une plomberie qui n'existe pas. On lui rend l'action.
            text: 'Assure-toi que tu peux recevoir des factures électroniques au 1er septembre : c\'est ça, l\'obligation. Côté FOREAS, l\'intégration d\'une Plateforme Agréée est en préparation — quand elle sera livrée, tu n\'auras rien à configurer.',
          },
        },
        {
          '@type': 'Question',
          name: 'Et après septembre 2026 ?',
          acceptedAnswer: {
            '@type': 'Answer',
            // FAC-05 (jumeau JSON-LD) — « FOREAS gère aussi l'émission » au présent
            // pour un module qui n'a pas une ligne de code (`invoices` = 0 ligne).
            text: 'Au 1er septembre 2027, tu devras émettre tes factures B2B (hôtels, entreprises) au format électronique via une PA. L\'émission fait partie de ce que FOREAS prépare.',
          },
        },
      ],
    },
  ],
}

export default function FacturationElectroniqueVTC2026() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        {/* La vue de cette page est comptée. Avant le 21/08/2026, aucune des
            dix pages commerciales n'avait de compteur : on connaissait les
            abonnements, jamais la page qui les avait produits. */}
        <MesureVue page="/facturation-electronique-vtc-2026" intention="rentabilite" audience="chauffeur" />

      <main className="min-h-screen bg-[#050508] text-white">
        {/* ── HERO ─────────────────────────────────────── */}
        <section className="relative overflow-hidden px-6 py-16 md:py-24">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-[#8C52FF]/5 to-transparent pointer-events-none" />
          <div className="relative mx-auto max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-orange-500/10 border border-orange-500/30 px-4 py-1 text-xs font-semibold tracking-wide uppercase text-orange-400 mb-6">
              <span className="h-2 w-2 rounded-full bg-orange-400 animate-pulse" />
              Échéance officielle — 1<sup>er</sup> septembre 2026
            </div>
            <h1
              className="text-4xl md:text-6xl font-black tracking-tight leading-[1.05] mb-6"
              style={{ fontFamily: 'Genos, sans-serif' }}
            >
              La facturation électronique devient obligatoire.
              <br />
              <span className="text-[#00D4FF]">Tranquille — FOREAS t&apos;accompagne.</span>
            </h1>
            {/* FAC-05 — « FOREAS intègre une Plateforme Agréée DGFiP directement dans
                l'app » : présent de l'indicatif pour ce qui n'existe pas. Mesures du
                14/08/2026 — table `invoices` = 0 ligne, aucune table facture/PDP en
                base, et grep pennylane|iopole|tiime|pdp sur foreas-website/src comme
                sur FOREAS-Clean/src ne renvoie que ce texte marketing lui-même. */}
            <p className="text-lg md:text-xl text-white/70 leading-relaxed max-w-3xl mb-8">
              Au 1<sup>er</sup> septembre 2026, tous les chauffeurs VTC — même auto-entrepreneurs en franchise de TVA — doivent pouvoir{' '}
              <strong className="text-white">recevoir des factures électroniques</strong> de leurs fournisseurs. FOREAS branchera une{' '}
              <strong className="text-white">Plateforme Agréée DGFiP</strong> dans l&apos;app — l&apos;intégration est en préparation, et le jour où elle est livrée, tu n&apos;as rien à configurer.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/tarifs2?utm_source=seo&utm_campaign=einvoice2026"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#00D4FF] hover:bg-cyan-300 transition px-6 py-4 text-base font-bold text-[#050508] shadow-[0_0_30px_rgba(0,212,255,0.3)]"
              >
                Je prépare ma conformité avec FOREAS →
              </Link>
              <Link
                href="#faq"
                className="inline-flex items-center justify-center rounded-xl border border-white/20 hover:border-white/40 transition px-6 py-4 text-base font-semibold"
              >
                Lire le guide complet
              </Link>
            </div>
            {/* Montants et durée d'essai : jamais en dur. src/lib/offre.ts est la seule
                source (le site a déjà encaissé DEUX prix différents pour le même
                produit). Et la carte EST demandée — payment_method_collection:'always'
                dans api/checkout : le dire vaut mieux que le laisser découvrir. */}
            <p className="mt-4 text-sm text-white/50">
              {ESSAI_JOURS} jours d&apos;essai · carte demandée, 0 € prélevé · {PRIX_MOIS}/mois ensuite
            </p>
          </div>
        </section>

        {/* ── TIMELINE ─────────────────────────────────── */}
        <section className="px-6 py-16 border-t border-white/5">
          <div className="mx-auto max-w-4xl">
            <h2
              className="text-3xl md:text-4xl font-black tracking-tight mb-2"
              style={{ fontFamily: 'Genos, sans-serif' }}
            >
              Le calendrier officiel DGFiP
            </h2>
            <p className="text-white/60 mb-12">
              Source :{' '}
              <a
                href="https://www.impots.gouv.fr/professionnel/je-decouvre-la-facturation-electronique"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#00D4FF] hover:underline"
              >
                impots.gouv.fr
              </a>
              {' — '}
              <a
                href="https://www.urssaf.fr/accueil/actualites/facturation-electronique.html"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#00D4FF] hover:underline"
              >
                urssaf.fr
              </a>
            </p>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="rounded-2xl border border-[#10B981]/30 bg-[#10B981]/5 p-6">
                {/* FAC-12 — « Rien à faire » était la phrase la plus coûteuse de la page :
                    elle disait à un chauffeur légalement tenu au 1er septembre qu'il pouvait
                    ne rien faire, en s'appuyant sur une intégration qui n'existe pas (0 ligne
                    de code PA dans les deux dépôts, `invoices` = 0 ligne le 14/08/2026).
                    On lui rend l'action qui le protège vraiment. */}
                <div className="text-[#10B981] text-xs font-bold uppercase tracking-widest mb-2">Aujourd&apos;hui</div>
                <div className="text-2xl font-black mb-3">Ce qui est prévu</div>
                <p className="text-white/70 text-sm leading-relaxed">
                  FOREAS prépare l&apos;intégration d&apos;une Plateforme Agréée. Tant qu&apos;elle n&apos;est pas livrée, vérifie de ton côté que tu pourras recevoir des factures électroniques au 1<sup>er</sup> septembre.
                </p>
              </div>
              <div className="rounded-2xl border border-orange-500/30 bg-orange-500/5 p-6">
                <div className="text-orange-400 text-xs font-bold uppercase tracking-widest mb-2">
                  1<sup>er</sup> sept 2026
                </div>
                <div className="text-2xl font-black mb-3">Réception obligatoire</div>
                <p className="text-white/70 text-sm leading-relaxed">
                  Tu dois pouvoir recevoir des e-factures de tes fournisseurs (assurance, carburant, leasing, Uber/Bolt relevés commission).
                </p>
              </div>
              <div className="rounded-2xl border border-[#8C52FF]/30 bg-[#8C52FF]/5 p-6">
                <div className="text-[#8C52FF] text-xs font-bold uppercase tracking-widest mb-2">
                  1<sup>er</sup> sept 2027
                </div>
                <div className="text-2xl font-black mb-3">Émission B2B obligatoire</div>
                <p className="text-white/70 text-sm leading-relaxed">
                  Tes factures B2B (hôtels, entreprises, TPMR) doivent être émises en format électronique Factur-X via une PA.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── WHAT FOREAS DOES ─────────────────────────── */}
        <section className="px-6 py-16 bg-gradient-to-b from-transparent to-[#8C52FF]/5 border-t border-white/5">
          <div className="mx-auto max-w-4xl">
            <h2
              className="text-3xl md:text-4xl font-black tracking-tight mb-12"
              style={{ fontFamily: 'Genos, sans-serif' }}
            >
              Ce que FOREAS fait déjà, et ce qu&apos;on branche pour septembre
            </h2>

            <div className="space-y-6">
              {[
                {
                  icon: '📥',
                  // FAC-06 — l'onglet « E-Factures » n'existe pas : grep -riE "e-?factures?"
                  // sur FOREAS-Clean/src (*.ts, *.tsx) → 0 occurrence. L'écran compta réel est
                  // GatedComptabiliteScreen, et src/screens/compta/ ne contient que
                  // AjnayaChatZone, DeclarationCard, DepensesCard, ReformeEInvoiceBanner,
                  // SimulateurCard. Table `invoices` = 0 ligne : aucune facture n'arrive nulle part.
                  title: 'Réception de tes e-factures — en préparation',
                  desc: "Tes factures fournisseurs arriveront dans un onglet E-Factures dédié dans l'app. Plus de boîte mail qui déborde, plus de PDF perdus.",
                },
                {
                  icon: '🎯',
                  // FAC-01 — « tirelire URSSAF » est un mot explicitement interdit
                  // (verite-commerciale.ts §6, ordonnance du 19 sept. 1945 art. 20) : le filtre
                  // wallet|cagnotte|tirelire|escrow|cantonn|savings|provision sur
                  // information_schema.tables renvoie 0 table. Aucun compte de cantonnement,
                  // aucun mouvement d'argent : rien n'est mis de côté, l'URSSAF SE CALCULE.
                  // Le taux « 24,6 % BNC » part avec : aucune mesure ne l'appuie, et un VTC
                  // auto-entrepreneur relève des prestations de services, pas du BNC.
                  title: 'Ce que tu devras à l’URSSAF, déjà calculé',
                  desc: "Course après course, FOREAS calcule ce que tu devras. Rien n'est prélevé ni bloqué : c'est un calcul, ton argent reste sur ton compte — tu sais juste toujours ce qui est vraiment à toi.",
                },
                {
                  icon: '📄',
                  title: 'Export PDF en un clic',
                  desc: 'Bilan, déclaration URSSAF, récap frais : trois boutons, trois PDF prêts pour ton comptable ou ta déclaration trimestrielle.',
                },
                {
                  icon: '🗣️',
                  // FAC-11 — le titre affichait « ton copilote compta IA ». Le mot est banni du
                  // site (Ajnaya a un nom, on l'emploie) et « Compta IA » figure nommément dans
                  // la liste ❌ INTERDIT de verite-commerciale.ts §6. Le délai « moins de
                  // 3 secondes » part aussi : aucune mesure de latence ne l'appuie, et c'est le
                  // genre de chiffre que le premier chauffeur venu dément en une question.
                  title: 'Ajnaya, ton copilote compta',
                  desc: 'Une question ? Tu lui parles en vocal ou en texte. Elle te répond à ton niveau, sans jargon.',
                },
                {
                  icon: '🔗',
                  // FAC-07 — la phrase nommait Pennylane, Iopole et Tiime au présent, comme si
                  // un contrat existait. Aucune trace : `partners` = 3 lignes, toutes internes,
                  // et les seules occurrences de ces trois noms dans les deux dépôts sont ce
                  // texte marketing et son jumeau app ReformeEInvoiceBanner.tsx:107. On ne
                  // nomme aucun partenaire tant qu'aucun contrat n'est signé.
                  title: 'Plateforme Agréée DGFiP invisible — en préparation',
                  desc: "FOREAS branchera une Plateforme Agréée officielle en arrière-plan — tu n'auras rien à configurer, ni à en choisir une toi-même.",
                },
                {
                  icon: '🧑\u200d💼',
                  // FAC-08 — « FOREAS te met en contact » au présent pour un réseau qui n'existe
                  // pas : select company_name, company_type from partners → 3 lignes, toutes
                  // internes (FOREAS HQ Paris, FOREAS Test, Apple Review Partenaire), zéro
                  // expert-comptable ; partner_referrals = 0 ligne, partner_applications =
                  // 0 ligne. verite-commerciale.ts PAS_ENCORE liste « réseau de partenaires actif ».
                  title: 'Mise en relation avec un expert-comptable',
                  desc: "Pour les cas qui demandent une signature officielle (contrôle fiscal, redressement), FOREAS t'orientera vers un expert-comptable partenaire inscrit à l'Ordre — ce réseau est en cours de constitution.",
                },
              ].map((item) => (
                <div key={item.title} className="flex gap-4 rounded-xl border border-white/10 bg-white/[0.02] p-5">
                  <div className="text-3xl flex-shrink-0">{item.icon}</div>
                  <div>
                    <h3 className="font-bold text-lg mb-1">{item.title}</h3>
                    <p className="text-white/70 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FAQ ──────────────────────────────────────── */}
        <section id="faq" className="px-6 py-16 border-t border-white/5">
          <div className="mx-auto max-w-4xl">
            <h2
              className="text-3xl md:text-4xl font-black tracking-tight mb-12"
              style={{ fontFamily: 'Genos, sans-serif' }}
            >
              Questions fréquentes
            </h2>

            <div className="space-y-6">
              {[
                {
                  q: 'Suis-je concerné en tant que chauffeur VTC auto-entrepreneur ?',
                  a: "Oui. Tous les chauffeurs VTC auto-entrepreneurs sont concernés, même en franchise de TVA. Au 1er septembre 2026, tu dois pouvoir recevoir des factures électroniques de tes fournisseurs (assurance, carburant, leasing, plateformes Uber/Bolt). Il n'y a pas de seuil de chiffre d'affaires qui te dispense.",
                },
                {
                  q: "Qu'est-ce qu'une Plateforme Agréée (PA, ex-PDP) ?",
                  // FAC-05/FAC-07 — « FOREAS intègre » au présent : 0 ligne de code PA dans
                  // foreas-website/src comme dans FOREAS-Clean/src, `invoices` = 0 ligne.
                  a: "C'est un logiciel certifié par la DGFiP qui transmet les factures électroniques entre entreprises et à l'administration fiscale. 112 plateformes étaient immatriculées en mars 2026. FOREAS prépare l'intégration d'une PA partenaire — l'objectif est que tu n'aies jamais à en choisir une toi-même.",
                },
                {
                  q: "Que dois-je faire d'ici le 1er septembre 2026 ?",
                  // FAC-12 — « rien de complexe, on branche la Plateforme Agréée » disait à un
                  // chauffeur légalement tenu dans 18 jours (mesure du 14/08/2026) qu'il n'avait
                  // rien à faire, en s'appuyant sur une plomberie qui n'existe pas. On lui rend
                  // la seule action qui le protège vraiment aujourd'hui.
                  a: "Assure-toi que tu peux recevoir des factures électroniques au 1er septembre : c'est ça, l'obligation, et elle pèse sur toi. Côté FOREAS, l'intégration d'une Plateforme Agréée est en préparation — le jour où elle est livrée, tu n'as rien à configurer et on te prévient dans l'app.",
                },
                {
                  q: "Est-ce que Uber et Bolt vont m'envoyer des factures électroniques ?",
                  // FAC-09 — le calendrier est exact (vérifié sur impots.gouv.fr) ; c'est la
                  // promesse produit qui était fausse : aucun onglet E-Factures dans l'app
                  // (0 occurrence de « e-facture » dans FOREAS-Clean/src), `invoices` = 0 ligne,
                  // aucun code d'ingestion de relevés de commission.
                  a: "Oui. Dès septembre 2026, Uber, Bolt, Heetch et les autres plateformes devront t'envoyer tes relevés de commission au format e-invoice. FOREAS les ingérera automatiquement dans ton onglet E-Factures.",
                },
                {
                  q: 'Et si je reste en PDF simple par email avec mes clients B2B ?',
                  a: "À partir du 1er septembre 2026 (pour la réception) et du 1er septembre 2027 (pour l'émission B2B), le PDF simple par email n'est plus valable juridiquement en B2B domestique. Il faut passer par une Plateforme Agréée.",
                },
                {
                  q: 'FOREAS est-il lui-même Plateforme Agréée ?',
                  // FAC-05 — « utilise une PA en backend » au présent : il n'y a pas de backend
                  // PA (aucune table facture/PDP en base, `invoices` = 0 ligne). Le rôle
                  // d'Opérateur de Dématérialisation est le plan, pas l'état actuel.
                  a: "Non, et FOREAS ne le sera pas : le plan est de s'appuyer sur une Plateforme Agréée officielle en arrière-plan et de te fournir l'intégration clé en main, pour que tu n'aies pas à te noyer dans 112 plateformes. Tant qu'elle n'est pas livrée, c'est toi qui restes responsable de pouvoir recevoir tes factures — autant te le dire franchement.",
                },
                {
                  q: 'FOREAS est-il mon expert-comptable ?',
                  // FAC-08 — « on te met en contact » au présent : partners = 3 lignes internes,
                  // zéro expert-comptable, partner_referrals = 0 ligne.
                  a: "Non — FOREAS est un copilote de gestion, pas un expert-comptable (ordonnance du 19 septembre 1945, art. 20). On t'aide à gérer au quotidien (URSSAF calculée, scan tickets, bilan PDF, alertes échéances), et pour tout besoin de certification officielle on t'orientera vers un expert-comptable partenaire inscrit à l'Ordre — ce réseau est en cours de constitution.",
                },
                {
                  q: "Combien coûte l'ajout du module E-Factures ?",
                  // Prix jamais en dur : src/lib/offre.ts est la seule source (le site a déjà
                  // encaissé deux prix différents pour le même produit). Et « le module est
                  // inclus » au présent pour un module qui n'existe pas encore : futur.
                  a: `Rien de plus. Quand il sortira, le module E-Factures sera inclus dans l'abonnement FOREAS (${PRIX_MOIS}/mois), sans supplément, pour tous les chauffeurs déjà abonnés.`,
                },
              ].map((faq) => (
                <details
                  key={faq.q}
                  className="group rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden"
                >
                  <summary className="cursor-pointer list-none p-5 flex justify-between items-start gap-4 hover:bg-white/[0.03] transition">
                    <h3 className="font-bold text-base md:text-lg leading-tight">{faq.q}</h3>
                    <span className="text-[#00D4FF] text-xl group-open:rotate-45 transition flex-shrink-0">+</span>
                  </summary>
                  <p className="px-5 pb-5 text-white/70 text-sm md:text-base leading-relaxed">{faq.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA FINAL ────────────────────────────────── */}
        <section className="px-6 py-24 border-t border-white/5 bg-gradient-to-br from-[#00D4FF]/5 to-[#8C52FF]/10">
          <div className="mx-auto max-w-3xl text-center">
            <h2
              className="text-3xl md:text-5xl font-black tracking-tight mb-6"
              style={{ fontFamily: 'Genos, sans-serif' }}
            >
              {/* FAC-03 — « 4 mois avant l'échéance » : vrai à la rédaction (21/04/2026),
                  faux depuis. Le 14/08/2026 il restait 18 jours, soit 0,59 mois. Recalculé
                  à chaque rendu depuis DATE_ECHEANCE, arrondi vers le bas. */}
              {compteARebours()}
              <br />
              <span className="text-[#00D4FF]">FOREAS te prépare le terrain.</span>
            </h2>
            <p className="text-lg text-white/70 mb-10 max-w-xl mx-auto">
              Prends ton compte maintenant : tu commences à voir ce que tu dois à l&apos;URSSAF dès ta prochaine course, et le jour où la Plateforme Agréée est branchée, tu n&apos;as rien à faire — on te prévient dans l&apos;app.
            </p>
            <Link
              href="/tarifs2?utm_source=seo&utm_campaign=einvoice2026&utm_content=cta_final"
              className="inline-flex items-center gap-3 rounded-2xl bg-[#00D4FF] hover:bg-cyan-300 transition px-8 py-5 text-lg font-bold text-[#050508] shadow-[0_0_50px_rgba(0,212,255,0.4)]"
            >
              Je prépare ma conformité →
            </Link>
            {/* Jumeau de la ligne du hero : durée et montant viennent de src/lib/offre.ts,
                et la carte EST demandée (payment_method_collection:'always' dans
                api/checkout). « Résiliable à tout moment » devient l'action exacte. */}
            <p className="mt-4 text-sm text-white/50">
              {ESSAI_JOURS} jours d&apos;essai · carte demandée, 0 € prélevé · tu annules en un clic avant la fin
            </p>
          </div>
        </section>

        {/* ── FOOTER légal ────────────────────────────── */}
        <footer className="px-6 py-12 border-t border-white/10 text-sm text-white/50">
          <div className="mx-auto max-w-4xl space-y-4">
            {/* FAC-11 + FAC-08 (footer légal) — « copilote IA » contenait le mot banni,
                et « nous orientons » au présent promettait un réseau qui n'existe pas
                (partners = 3 lignes internes, zéro expert-comptable, partner_referrals =
                0 ligne). C'est la mention légale : elle doit être la plus exacte de la page. */}
            <p>
              <strong className="text-white/80">FOREAS Labs</strong> — contact@foreas.net — FOREAS est un copilote de gestion, pas un cabinet d&apos;expertise comptable (ordonnance du 19 septembre 1945, art. 20). Pour toute certification officielle (déclaration fiscale signée, contrôle, conseil juridique), nous orienterons vers un expert-comptable partenaire inscrit à l&apos;Ordre — ce réseau est en cours de constitution.
            </p>
            <p>
              Sources officielles citées :{' '}
              <a
                href="https://www.impots.gouv.fr/professionnel/je-decouvre-la-facturation-electronique"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-white"
              >
                impots.gouv.fr
              </a>
              ,{' '}
              <a
                href="https://www.urssaf.fr/accueil/actualites/facturation-electronique.html"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-white"
              >
                urssaf.fr
              </a>
              ,{' '}
              <a
                href="https://www.economie.gouv.fr/tout-savoir-sur-la-facturation-electronique-pour-les-entreprises"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-white"
              >
                economie.gouv.fr
              </a>
              .
            </p>
            <div className="flex gap-4">
              <Link href="/cgu" className="hover:text-white transition">CGU</Link>
              <Link href="/confidentialite" className="hover:text-white transition">Confidentialité</Link>
              <Link href="/mentions-legales" className="hover:text-white transition">Mentions légales</Link>
            </div>
            <p className="text-white/40">© 2026 FOREAS Labs. Tous droits réservés.</p>
          </div>
        </footer>
      </main>
    </>
  )
}
