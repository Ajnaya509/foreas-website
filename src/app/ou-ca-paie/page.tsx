import type { Metadata } from 'next'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import ZoneSearchBarHero from '@/components/zone/ZoneSearchBarHero'
import ZonePainCalculator from '@/components/zone/ZonePainCalculator'
import ZoneMechanismVisual from '@/components/zone/ZoneMechanismVisual'
import ZoneSocialProof from '@/components/zone/ZoneSocialProof'
import ZonePlanTimeline from '@/components/zone/ZonePlanTimeline'
import ZoneCapPartnerCTA from '@/components/zone/ZoneCapPartnerCTA'
import ZoneFinalCTAWithPS from '@/components/zone/ZoneFinalCTAWithPS'

export const metadata: Metadata = {
  title: 'Où ça paie ? — Tarifs réels par zone VTC · FOREAS',
  description:
    'Tapez votre zone. Ajnaya vous dit où ça paie ce soir — tarif horaire moyen, demande relative, pool optimal. Données réelles flotte FOREAS, sans inscription.',
  openGraph: {
    title: 'Où ça paie ? — FOREAS',
    description: 'Gagnez plus. Roulez moins. L\'IA Ajnaya vous dit où aller — basé sur la flotte FOREAS réelle.',
    type: 'website',
    locale: 'fr_FR',
    url: 'https://foreas.xyz/ou-ca-paie',
  },
  alternates: {
    canonical: 'https://foreas.xyz/ou-ca-paie',
  },
}

/**
 * /ou-ca-paie — Hero Search Bar Ajnaya v1
 *
 * Page B2C chauffeur VTC avec :
 * - Search bar interactive type Google → tarif horaire approximatif par zone
 * - Sarcastic guard 3 niveaux (1ʳᵉ visite générosité Cialdini → 6+ autorité)
 * - Handoff WhatsApp pour tarif EXACT (point de bascule conversion)
 * - Scroll narratif : douleur → plan → CTA + PS humain
 *
 * Phase 1 : 4 sections (Hero / Pain / Plan / Final)
 * Phase 2 : ajout Mechanism + SocialProof + CAP
 *
 * Voir : FOREAS-SHARED/HOME_HERO_SEARCH_v1_SPEC.md
 */
// ─── Structured data SEO (WebApplication + FAQPage style) ──────────
const JSON_LD = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebPage',
      '@id': 'https://foreas.xyz/ou-ca-paie',
      url: 'https://foreas.xyz/ou-ca-paie',
      name: 'Où ça paie ? — Tarifs réels par zone VTC · FOREAS',
      description:
        'Tapez votre zone. Ajnaya vous dit où ça paie ce soir — tarif horaire moyen, demande relative, pool optimal. Données réelles flotte FOREAS, sans inscription.',
      inLanguage: 'fr-FR',
      isPartOf: {
        '@type': 'WebSite',
        name: 'FOREAS',
        url: 'https://foreas.xyz',
      },
    },
    {
      '@type': 'SoftwareApplication',
      name: 'Ajnaya',
      operatingSystem: 'Web, iOS, Android, WhatsApp',
      applicationCategory: 'BusinessApplication',
      description:
        "L'IA FOREAS qui dit aux chauffeurs VTC où aller — analyse 7 plateformes en temps réel, anticipe la demande, parle vocal et texte.",
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'EUR',
        description: 'Essai gratuit 7 jours, sans inscription, sans carte.',
      },
      // aggregateRating retiré : pas d'avis vérifiables. Un faux rich-snippet de notation
      // = risque pénalité Google + pratique commerciale trompeuse. À remettre quand de
      // vrais avis (source auditable) existeront.
    },
  ],
}

export default function OuCaPaiePage() {
  return (
    <main className="min-h-screen bg-black text-[#F8FAFC] overflow-x-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
      />
      <Header />

      {/* SECTION 1 — Hero search bar */}
      <ZoneSearchBarHero />

      {/* SECTION 2 — Douleur (commission Uber) */}
      <ZonePainCalculator />

      {/* SECTION 3 — Mécanisme Ajnaya */}
      <ZoneMechanismVisual />

      {/* SECTION 4 — Preuve sociale */}
      <ZoneSocialProof />

      {/* SECTION 5 — Plan en 3 étapes */}
      <ZonePlanTimeline />

      {/* SECTION 6 — CAP / Partenaires (variant warm) */}
      <ZoneCapPartnerCTA />

      {/* SECTION 7 — Final CTA + PS signature humaine */}
      <ZoneFinalCTAWithPS />

      <Footer />
    </main>
  )
}
