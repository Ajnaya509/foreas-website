/**
 * Landing SEO — foreas.xyz/facturation-electronique-vtc-2026
 *
 * Déployer dans : /app/facturation-electronique-vtc-2026/page.tsx (Next.js 13+ App Router)
 * Stack attendue : Next.js + Tailwind + Lucide Icons
 *
 * SEO target :
 *  - Query primaire : "facturation électronique VTC 2026"
 *  - Query secondaires : "e-invoice chauffeur VTC", "PDP VTC", "URSSAF facture électronique auto-entrepreneur"
 *  - Intent : informationnel → transactionnel (CTA inscription FOREAS)
 *
 * Structure E-E-A-T (Google Helpful Content) :
 *  - Experience : "FOREAS accompagne déjà 1000+ chauffeurs VTC"
 *  - Expertise : timeline exacte + sources officielles DGFiP / URSSAF linkées
 *  - Authority : mentions partenaires (Pennylane/Iopole en "Plateformes Agréées")
 *  - Trust : email contact@foreas.net + mentions légales
 */

import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Facturation électronique VTC 2026 — Ce que tu dois savoir (et ce que FOREAS gère pour toi)',
  description:
    'Au 1er septembre 2026, tous les chauffeurs VTC auto-entrepreneurs doivent pouvoir recevoir des factures électroniques. FOREAS t\'accompagne avec une Plateforme Agréée DGFiP intégrée — tu continues à travailler, on branche la plomberie.',
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
    canonical: 'https://foreas.xyz/facturation-electronique-vtc-2026',
  },
  openGraph: {
    title: 'Facturation électronique VTC — Sept 2026 | FOREAS',
    description:
      'Guide clair + solution prête pour les chauffeurs VTC. Réception dès sept 2026, émission B2B sept 2027.',
    url: 'https://foreas.xyz/facturation-electronique-vtc-2026',
    siteName: 'FOREAS',
    locale: 'fr_FR',
    type: 'article',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Facturation électronique VTC 2026 — FOREAS',
    description: 'Ce qui change, quand, et ce que FOREAS gère pour toi.',
  },
};

// Structured data (Schema.org Article + FAQPage)
const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Article',
      headline: 'Facturation électronique VTC 2026 — Guide et solution FOREAS',
      datePublished: '2026-04-21',
      dateModified: '2026-04-21',
      author: { '@type': 'Organization', name: 'FOREAS Labs' },
      publisher: { '@type': 'Organization', name: 'FOREAS', url: 'https://foreas.xyz' },
      mainEntityOfPage: 'https://foreas.xyz/facturation-electronique-vtc-2026',
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
            text: 'C\'est un logiciel certifié par la DGFiP qui transmet les factures électroniques entre entreprises et l\'administration. 112 plateformes étaient immatriculées en mars 2026. FOREAS intègre une PA partenaire pour toi.',
          },
        },
        {
          '@type': 'Question',
          name: 'Que dois-je faire d\'ici le 1er septembre 2026 ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Rien de complexe : active ton compte FOREAS, on branche la Plateforme Agréée en arrière-plan. Tu continues à travailler normalement. La compliance est invisible.',
          },
        },
        {
          '@type': 'Question',
          name: 'Et après septembre 2026 ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Au 1er septembre 2027, tu devras émettre tes factures B2B (hôtels, entreprises) au format électronique via une PA. FOREAS gère aussi l\'émission dès cette date.',
          },
        },
      ],
    },
  ],
};

export default function FacturationElectroniqueVTC2026() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <main className="min-h-screen bg-[#080C18] text-white">
        {/* ── HERO ─────────────────────────────────────── */}
        <section className="relative overflow-hidden px-6 py-16 md:py-24">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-violet-500/5 to-transparent pointer-events-none" />
          <div className="relative mx-auto max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-orange-500/10 border border-orange-500/30 px-4 py-1 text-xs font-semibold tracking-wide uppercase text-orange-400 mb-6">
              <span className="h-2 w-2 rounded-full bg-orange-400 animate-pulse" />
              Échéance officielle — 1er septembre 2026
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-[1.05] mb-6">
              La facturation électronique devient obligatoire.
              <br />
              <span className="text-cyan-400">Tranquille — FOREAS t'accompagne.</span>
            </h1>
            <p className="text-lg md:text-xl text-white/70 leading-relaxed max-w-3xl mb-8">
              Au 1<sup>er</sup> septembre 2026, tous les chauffeurs VTC — même auto-entrepreneurs en franchise de TVA — doivent pouvoir <strong className="text-white">recevoir des factures électroniques</strong> de leurs fournisseurs. FOREAS intègre une <strong className="text-white">Plateforme Agréée DGFiP</strong> directement dans l'app : tu continues à travailler, on branche la plomberie.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/signup?utm_source=seo&utm_campaign=einvoice2026"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 transition px-6 py-4 text-base font-bold text-black"
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
            <p className="mt-4 text-sm text-white/50">
              Pas de carte bancaire · Essai 7 jours offert · 13€/semaine abo complet
            </p>
          </div>
        </section>

        {/* ── TIMELINE ─────────────────────────────────── */}
        <section className="px-6 py-16 border-t border-white/5">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-2">Le calendrier officiel DGFiP</h2>
            <p className="text-white/60 mb-12">
              Source :{' '}
              <a
                href="https://www.impots.gouv.fr/professionnel/je-decouvre-la-facturation-electronique"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 hover:underline"
              >
                impots.gouv.fr
              </a>
              {' — '}
              <a
                href="https://www.urssaf.fr/accueil/actualites/facturation-electronique.html"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 hover:underline"
              >
                urssaf.fr
              </a>
            </p>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6">
                <div className="text-emerald-400 text-xs font-bold uppercase tracking-widest mb-2">Aujourd'hui</div>
                <div className="text-2xl font-black mb-3">Rien à faire</div>
                <p className="text-white/70 text-sm leading-relaxed">
                  Tu travailles normalement. FOREAS te prépare l'intégration Plateforme Agréée en arrière-plan.
                </p>
              </div>
              <div className="rounded-2xl border border-orange-500/30 bg-orange-500/5 p-6">
                <div className="text-orange-400 text-xs font-bold uppercase tracking-widest mb-2">1<sup>er</sup> sept 2026</div>
                <div className="text-2xl font-black mb-3">Réception obligatoire</div>
                <p className="text-white/70 text-sm leading-relaxed">
                  Tu dois pouvoir recevoir des e-factures de tes fournisseurs (assurance, carburant, leasing, Uber/Bolt relevés commission).
                </p>
              </div>
              <div className="rounded-2xl border border-violet-500/30 bg-violet-500/5 p-6">
                <div className="text-violet-400 text-xs font-bold uppercase tracking-widest mb-2">1<sup>er</sup> sept 2027</div>
                <div className="text-2xl font-black mb-3">Émission B2B obligatoire</div>
                <p className="text-white/70 text-sm leading-relaxed">
                  Tes factures B2B (hôtels, entreprises, TPMR) doivent être émises en format électronique Factur-X via une PA.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── WHAT FOREAS DOES ─────────────────────────── */}
        <section className="px-6 py-16 bg-gradient-to-b from-transparent to-violet-500/5 border-t border-white/5">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-12">Ce que FOREAS fait pour toi</h2>

            <div className="space-y-6">
              {[
                {
                  icon: '📥',
                  title: 'Réception automatique de tes e-factures',
                  desc: "Toutes tes factures fournisseurs arrivent dans l'onglet E-Factures de l'app. Pas de boîte mail qui déborde, pas de PDF perdus.",
                },
                {
                  icon: '🎯',
                  title: 'Ta tirelire URSSAF déjà calculée',
                  desc: "Chaque course → calcul auto des 24,6% BNC à mettre de côté. Tu vois toujours exactement ce qui reste dans ta poche.",
                },
                {
                  icon: '📄',
                  title: 'Export PDF en un clic',
                  desc: "Bilan, déclaration URSSAF, récap frais : trois boutons, trois PDF prêts pour ton comptable ou ta déclaration trimestrielle.",
                },
                {
                  icon: '🗣️',
                  title: 'Ajnaya, ton copilote compta IA',
                  desc: "Une question ? Tu lui parles en vocal ou en texte. Elle te répond en moins de 3 secondes, à ton niveau, sans jargon.",
                },
                {
                  icon: '🔗',
                  title: 'Plateforme Agréée DGFiP invisible',
                  desc: "FOREAS branche une PA officielle (Pennylane, Iopole ou Tiime — toutes certifiées DGFiP) en arrière-plan. Tu n'as rien à configurer.",
                },
                {
                  icon: '🧑\u200d💼',
                  title: "Mise en relation avec un expert-comptable",
                  desc: "Pour les cas qui demandent une signature officielle (contrôle fiscal, optimisation tax), FOREAS te met en contact avec un expert partenaire certifié.",
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
            <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-12">Questions fréquentes</h2>

            <div className="space-y-6">
              {[
                {
                  q: 'Suis-je concerné en tant que chauffeur VTC auto-entrepreneur ?',
                  a: "Oui. Tous les chauffeurs VTC auto-entrepreneurs sont concernés, même en franchise de TVA. Au 1er septembre 2026, tu dois pouvoir recevoir des factures électroniques de tes fournisseurs (assurance, carburant, leasing, plateformes Uber/Bolt). Il n'y a pas de seuil de chiffre d'affaires qui te dispense.",
                },
                {
                  q: 'Qu\'est-ce qu\'une Plateforme Agréée (PA, ex-PDP) ?',
                  a: "C'est un logiciel certifié par la DGFiP qui transmet les factures électroniques entre entreprises et à l'administration fiscale. 112 plateformes étaient immatriculées en mars 2026. FOREAS intègre une PA partenaire pour toi — tu n'as pas à en choisir une toi-même.",
                },
                {
                  q: 'Que dois-je faire d\'ici le 1er septembre 2026 ?',
                  a: "Rien de complexe : active ton compte FOREAS, on branche la Plateforme Agréée en arrière-plan avec tes informations (nom, SIRET, activité VTC). Tu continues à travailler normalement. La compliance est invisible pour toi.",
                },
                {
                  q: 'Est-ce que Uber et Bolt vont m\'envoyer des factures électroniques ?',
                  a: "Oui. Dès septembre 2026, Uber, Bolt, Heetch et les autres plateformes devront t'envoyer tes relevés de commission au format e-invoice. FOREAS les ingère automatiquement dans ton onglet E-Factures.",
                },
                {
                  q: 'Et si je reste en PDF simple par email avec mes clients B2B ?',
                  a: "À partir du 1er septembre 2026 (pour la réception) et du 1er septembre 2027 (pour l'émission B2B), le PDF simple par email n'est plus valable juridiquement en B2B domestique. Il faut passer par une Plateforme Agréée.",
                },
                {
                  q: 'FOREAS est-il lui-même Plateforme Agréée ?',
                  a: "Non — FOREAS est un Opérateur de Dématérialisation qui utilise une Plateforme Agréée officielle en backend. C'est le modèle recommandé : pas besoin de se noyer dans 112 plateformes, FOREAS te fournit l'intégration clé en main.",
                },
                {
                  q: 'FOREAS est-il mon expert-comptable ?',
                  a: "Non — FOREAS est un copilote compta IA, pas un expert-comptable. On t'aide à gérer au quotidien (tirelire URSSAF, scan tickets, bilan PDF, alertes échéances), et pour tout besoin de certification officielle on te met en contact avec un expert-comptable partenaire certifié Ordre.",
                },
                {
                  q: 'Combien coûte l\'ajout du module E-Factures ?',
                  a: "Le module est inclus dans l'abonnement FOREAS (13€/semaine) pour tous les chauffeurs existants à partir de septembre 2026. Pas de surprise, pas de surcoût.",
                },
              ].map((faq) => (
                <details
                  key={faq.q}
                  className="group rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden"
                >
                  <summary className="cursor-pointer list-none p-5 flex justify-between items-start gap-4 hover:bg-white/[0.03] transition">
                    <h3 className="font-bold text-base md:text-lg leading-tight">{faq.q}</h3>
                    <span className="text-cyan-400 text-xl group-open:rotate-45 transition flex-shrink-0">+</span>
                  </summary>
                  <p className="px-5 pb-5 text-white/70 text-sm md:text-base leading-relaxed">{faq.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA FINAL ────────────────────────────────── */}
        <section className="px-6 py-24 border-t border-white/5 bg-gradient-to-br from-cyan-500/5 to-violet-500/10">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-6">
              4 mois avant l'échéance.
              <br />
              <span className="text-cyan-400">Zéro stress avec FOREAS.</span>
            </h2>
            <p className="text-lg text-white/70 mb-10 max-w-xl mx-auto">
              Active ton compte en 90 secondes. FOREAS s'occupe de la compliance septembre 2026 pendant que tu te concentres sur tes courses.
            </p>
            <Link
              href="/signup?utm_source=seo&utm_campaign=einvoice2026&utm_content=cta_final"
              className="inline-flex items-center gap-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 transition px-8 py-5 text-lg font-bold text-black"
            >
              Je prépare ma conformité →
            </Link>
            <p className="mt-4 text-sm text-white/50">
              7 jours gratuits · Sans carte bancaire · Résiliable à tout moment
            </p>
          </div>
        </section>

        {/* ── FOOTER légal ────────────────────────────── */}
        <footer className="px-6 py-12 border-t border-white/10 text-sm text-white/50">
          <div className="mx-auto max-w-4xl space-y-4">
            <p>
              <strong className="text-white/80">FOREAS Labs</strong> — contact@foreas.net — FOREAS est un copilote IA, pas un
              cabinet d'expertise comptable. Pour toute certification officielle (déclaration fiscale signée, contrôle, conseil
              juridique), nous orientons vers un expert-comptable partenaire inscrit à l'Ordre.
            </p>
            <p>
              Sources officielles citées :{' '}
              <a href="https://www.impots.gouv.fr/professionnel/je-decouvre-la-facturation-electronique" className="underline">
                impots.gouv.fr
              </a>
              ,{' '}
              <a href="https://www.urssaf.fr/accueil/actualites/facturation-electronique.html" className="underline">
                urssaf.fr
              </a>
              ,{' '}
              <a href="https://www.economie.gouv.fr/tout-savoir-sur-la-facturation-electronique-pour-les-entreprises" className="underline">
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
  );
}
