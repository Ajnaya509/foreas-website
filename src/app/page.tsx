import type { Metadata } from 'next'
import dynamic from 'next/dynamic'
// ─── Above-the-fold (critique pour le 1er rendu) : statique ───
import HomeHeaderCream from '@/components/home2026/HomeHeaderCream'
import HomeHeroCream from '@/components/home2026/HomeHeroCream'
import LiveEngineBar from '@/components/home2026/LiveEngineBar'
import HomeProofStrip from '@/components/home2026/HomeProofStrip'
import HomeBigDomino from '@/components/home2026/HomeBigDomino'

// ─── Below-the-fold : code-split (SSR conservé pour le SEO, JS client à la demande) ───
// → allège fortement le bundle initial = 1er rendu mobile ultra-rapide.
const ZoneMechanismVisual = dynamic(() => import('@/components/zone/ZoneMechanismVisual'))
const ZoneSocialProof = dynamic(() => import('@/components/zone/ZoneSocialProof')) // Mux vidéo + embla (le + lourd)
const ZonePainCalculator = dynamic(() => import('@/components/zone/ZonePainCalculator'))
const ZonePlanTimeline = dynamic(() => import('@/components/zone/ZonePlanTimeline'))
const ZoneCapPartnerCTA = dynamic(() => import('@/components/zone/ZoneCapPartnerCTA'))
const ZoneFinalCTAWithPS = dynamic(() => import('@/components/zone/ZoneFinalCTAWithPS'))
const Footer = dynamic(() => import('@/components/Footer'))
// Overlays non critiques (timés / sur interaction) → chargés à la demande
const LiveSocialProofToasts = dynamic(() => import('@/components/home2026/LiveSocialProofToasts'))
const ExitIntentModal = dynamic(() => import('@/components/home2026/ExitIntentModal'))

export const metadata: Metadata = {
  title: 'FOREAS — Gagne plus, roule moins. L\'IA des chauffeurs VTC.',
  description:
    'L\'IA Ajnaya te dit où aller en temps réel. Tarif horaire moyen, demande, pool optimal — sur 51 zones VTC. Tape ta zone, vois combien ça paie ce soir.',
  openGraph: {
    title: 'FOREAS — Gagne plus, roule moins',
    description:
      'L\'IA Ajnaya te dit où aller. Tape ta zone, vois combien ça paie ce soir — avant de démarrer.',
    type: 'website',
    locale: 'fr_FR',
    url: 'https://foreas.xyz/',
  },
  alternates: {
    canonical: 'https://foreas.xyz/',
  },
}

// ─── Structured data SEO (WebPage + SoftwareApplication + FAQPage) ───
const JSON_LD = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebPage',
      '@id': 'https://foreas.xyz/',
      url: 'https://foreas.xyz/',
      name: 'FOREAS — Gagne plus, roule moins',
      description:
        'L\'IA Ajnaya pour chauffeurs VTC : où aller, quand, et combien gagner.',
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
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web, iOS, Android, WhatsApp',
      description:
        'L\'IA FOREAS pour chauffeurs VTC indépendants — analyse 7 plateformes en temps réel, dit où aller avant les autres.',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'EUR',
        description: 'Essai 7 jours gratuit, sans inscription, sans carte.',
      },
      // aggregateRating retiré : pas d'avis vérifiables. Un faux rich-snippet de notation
      // = risque pénalité Google + pratique commerciale trompeuse. À remettre quand de
      // vrais avis (source auditable) existeront.
    },
  ],
}

/**
 * Home `/` — Page d'acquisition principale chauffeur B2C
 *
 * Architecture (Site2026v68) :
 *  1. Hero CRÈME (rupture chaleur humaine) avec barre de recherche
 *     → tap → modal Ajnaya conversationnel 3-tours → push WhatsApp
 *  2. Big Domino (transition cinématique crème → noir absolu)
 *     "247 chauffeurs FOREAS savent où aller ce soir. Vous, vous tâtonnez encore ?"
 *  3. Section Mécanisme Ajnaya (CAPTE / ANALYSE / PARLE)
 *  4. Carrousel témoignages vidéo Mux (6 chauffeurs swipe + auto-play)
 *  5. Section Douleur (calculator commission Uber)
 *  6. Section Plan en 3 étapes (Miller SB7)
 *  7. Section CAP partenaires (variant warm)
 *  8. Final CTA + PS Halbert signé Chandler
 *
 * + Bouton flottant <AjnayaFloatingBubble /> présent partout au scroll
 *
 * L'ancienne home B2B est préservée à `/professionnels` (mockups intacts).
 */
export default function HomePage() {
  return (
    <main
      className="min-h-screen overflow-x-hidden"
      style={{ backgroundColor: 'var(--bg-cream-warm)' }}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
      />

      {/* Header crème transparent → glass au scroll */}
      <HomeHeaderCream />

      {/* SECTION 1 — Hero crème + barre de recherche → modal Ajnaya */}
      <HomeHeroCream />

      {/* SECTION 1.2 — Bandeau "moteur en direct" : preuve dynamique (mécanisme vrai, 0 chiffre inventé) */}
      <LiveEngineBar />

      {/* SECTION 1.5 — Mini-band preuve sociale (anti-objection chauffeur méfiant) */}
      <HomeProofStrip />

      {/* SECTION 2 — Big Domino transition crème → noir */}
      <HomeBigDomino />

      {/* À partir d'ici : tout est sur fond noir Apple absolu */}
      <div className="bg-black text-[#F8FAFC]">
        {/* SECTION 3 — Mécanisme Ajnaya */}
        <ZoneMechanismVisual />

        {/* SECTION 4 — Carrousel témoignages vidéo Mux (6 chauffeurs) */}
        <ZoneSocialProof />

        {/* SECTION 5 — Douleur (commission Uber calculator) */}
        <ZonePainCalculator />

        {/* SECTION 6 — Plan en 3 étapes Miller SB7 */}
        <ZonePlanTimeline />

        {/* SECTION 7 — CAP partenaires variant warm */}
        <ZoneCapPartnerCTA />

        {/* SECTION 8 — Final CTA + PS signature humaine */}
        <ZoneFinalCTAWithPS />

        <Footer />
      </div>

      {/* AjnayaFloatingBubble désactivée Site2026v74 — focus sur funnel hero unique
          Ré-activer en uncommentant l'import + la ligne ci-dessous quand on aura
          décidé d'une stratégie scroll-aware (afficher SEULEMENT après le hero,
          masquer si modal déjà ouvert ou WhatsApp déjà cliqué). */}
      {/* <AjnayaFloatingBubble /> */}

      {/* ─── Marketing UX (Site2026v77) ───────────────────────────────────── */}
      <LiveSocialProofToasts />
      {/* Exit-intent : mouseleave top (desktop) + back button (universel) */}
      <ExitIntentModal />
    </main>
  )
}
