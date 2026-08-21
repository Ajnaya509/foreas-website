import type { Metadata } from 'next'
import { URL_SITE, canonique } from '@/lib/site'
import dynamic from 'next/dynamic'
// ─── Above-the-fold (critique pour le 1er rendu) : statique ───
import MesureVue from '@/components/mesure/MesureVue'
import HomeHeaderCream from '@/components/home2026/HomeHeaderCream'
import HomeHeroCream from '@/components/home2026/HomeHeroCream'
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
  title: 'FOREAS — Gagne plus, roule moins. Pour les chauffeurs VTC.',
  description:
    'Ce qu\'il te reste, ta commission déduite, avant d\'accepter la course. Tarif horaire, demande et pool optimal sur 52 zones VTC. Tape ta zone, vois ce qui paie ce soir.',
  openGraph: {
    title: 'FOREAS — Gagne plus, roule moins',
    description:
      'Les autres acceptent à l\'aveugle. Toi, tu vois ce qu\'il te reste — ta commission déduite — avant d\'accepter. Uber, Bolt, Heetch au même endroit.',
    type: 'website',
    locale: 'fr_FR',
    url: 'https://www.foreas.xyz/',
  },
  alternates: {
    canonical: canonique('/'),
  },
}

// ─── Structured data SEO (WebPage + SoftwareApplication + FAQPage) ───
const JSON_LD = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebPage',
      // ── 20/08/2026 — L'IDENTIFIANT STRUCTURÉ SUIT LA MÊME RÈGLE QUE LA CANONIQUE ──
      // La balise de référence de cette page dit « www ». Ces lignes-ci disaient
      // l'adresse sans « www », qui redirige. Deux signaux qui se contredisent sur la
      // même page valent moins qu'un seul signal clair — et c'est exactement le
      // raisonnement déjà écrit dans src/lib/site.ts, simplement non appliqué ici.
      '@id': canonique('/'),
      url: canonique('/'),
      name: 'FOREAS — Gagne plus, roule moins',
      description:
        'FOREAS pour chauffeurs VTC : ce qu\'il te reste avant d\'accepter, où aller, quand, et ce que la journée a vraiment donné.',
      inLanguage: 'fr-FR',
      isPartOf: {
        '@type': 'WebSite',
        name: 'FOREAS',
        url: URL_SITE,
      },
    },
    {
      '@type': 'SoftwareApplication',
      name: 'Ajnaya',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web, iOS, Android, WhatsApp',
      description:
        'FOREAS pour chauffeurs VTC indépendants — rassemble tes courses Uber, Bolt et Heetch et affiche ce qu\'il te reste, ta commission déduite, avant que t\'acceptes.',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'EUR',
        // 14/08/2026 — disait « sans carte ». Faux : api/checkout crée la session avec
            // payment_method_collection:'always', la carte EST enregistrée. Cette phrase
            // vit dans les données structurées lues par Google : une promesse fausse
            // qui s'indexe et qu'on ne voit jamais à l'écran.
            description: 'Essai 3 jours à 0 € — carte demandée, rien débité, annulation en un clic.',
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
      {/* La vue de l'accueil se compte enfin. Sans elle, aucun taux de
          conversion n'est calculable : on connaissait les abonnements, jamais
          le nombre de personnes passées devant. */}
      <MesureVue page="/" intention="general" audience="chauffeur" />
      <HomeHeaderCream />

      {/* SECTION 1 — Hero crème + barre de recherche → modal Ajnaya */}
      <HomeHeroCream />

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
