import type { Metadata } from 'next'
import { URL_SITE, canonique } from '@/lib/site'
import { PRIX_MENSUEL_CENTIMES, ESSAI_JOURS, formaterEuros } from '@/lib/offre'
import { PLATEFORMES_PHRASES } from '@/lib/verite-commerciale'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import ZoneSearchBarHero from '@/components/zone/ZoneSearchBarHero'
import ZonePainCalculator from '@/components/zone/ZonePainCalculator'
import ZoneMechanismVisual from '@/components/zone/ZoneMechanismVisual'
import ZoneSocialProof from '@/components/zone/ZoneSocialProof'
import ZonePlanTimeline from '@/components/zone/ZonePlanTimeline'
import ZoneCapPartnerCTA from '@/components/zone/ZoneCapPartnerCTA'
import ZoneFinalCTAWithPS from '@/components/zone/ZoneFinalCTAWithPS'

/*
 * TITRE + DESCRIPTION — une seule source, lue par la <meta> ET par le JSON-LD.
 *
 * CE QUI ÉTAIT FAUX (mesuré le 14/08/2026) :
 *  · Le titre disait « Tarifs RÉELS par zone ». Mesure : curl anonyme sur
 *    https://www.foreas.xyz/api/home/zone-stats (Paris 8, Roissy, La Défense,
 *    Marseille) → has_data:false, courses_count:0 sur les quatre. Le nombre servi
 *    en repli sort d'une table de constantes par TYPE de zone écrite dans
 *    get_zone_stats (28 / 29 / 33 / 34,50 / 41,80), pas d'une course.
 *  · La description disait « ce qu'elle a vu passer là ». Mesure :
 *    `select count(*) from pieuvre_rides where created_at >= now()-interval '7 days'`
 *    → 0, et 0 zone sur 52 atteint le seuil de 5 courses certifiées sur 7 jours.
 *    Il n'y a rien « vu passer », nulle part.
 *
 * Ce que la page fait VRAIMENT dans 100 % des cas mesurés : elle bascule le
 * chauffeur vers Ajnaya sur WhatsApp. C'est ce qu'on promet — et c'est tenu.
 *
 * Les deux textes étaient dupliqués (meta + JSON-LD) et avaient déjà divergé :
 * la meta avait été corrigée, le JSON-LD servait encore l'ancienne phrase à
 * Google. Une constante unique rend cette divergence impossible.
 */
const TITRE_PAGE = 'Où ça paie ? — Tarif horaire par zone VTC · FOREAS'
const DESCRIPTION_PAGE =
  'Tape ta zone. Ajnaya te répond sur WhatsApp : le tarif horaire là où des courses sont mesurées — et quand elle ne sait pas encore, elle te le dit. Sans inscription.'

export const metadata: Metadata = {
  title: TITRE_PAGE,
  description: DESCRIPTION_PAGE,
  openGraph: {
    title: 'Où ça paie ? — FOREAS',
    // 14/08/2026 — disait « L'IA Ajnaya vous dit où aller ». Trois défauts en une
    // ligne, et c'est le texte que voient WhatsApp, LinkedIn et Google :
    //   · le mot « IA », banni (Ajnaya a un nom) ;
    //   · le vouvoiement, alors que la voix FOREAS est le tutoiement pro ;
    //   · « la flotte FOREAS réelle » — 30 chauffeurs inscrits, 9 marqués
    //     actifs, 0 actif sur 24 h : le mot « flotte » promet plus que ça.
    // Il avait échappé au vérificateur du dépôt parce que l'apostrophe est
    // ÉCHAPPÉE dans le code (L\'IA) : c'est la porte de sortie, qui lit le
    // HTML servi, qui l'a vu. Les deux contrôles se complètent, d'où les deux.
    //
    // 14/08/2026 (2ᵉ passe) — restait « ce qu'elle a vu passer là ». Mesure :
    // 0 course sur 7 jours dans pieuvre_rides, dernière course de toute la base
    // le 30/04/2026. Rien n'a été « vu passer ». Ce qui est vrai et vérifiable
    // en un clic : les trois plateformes réunies, et la réponse sur WhatsApp.
    description: `Tape ta zone, Ajnaya te répond sur WhatsApp. ${PLATEFORMES_PHRASES.honnete}.`,
    type: 'website',
    locale: 'fr_FR',
    url: canonique('/ou-ca-paie'),
  },
  alternates: {
    canonical: canonique('/ou-ca-paie'),
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
      // ── 20/08/2026 — L'IDENTIFIANT STRUCTURÉ SUIT LA MÊME RÈGLE QUE LA CANONIQUE ──
      // La balise de référence de cette page dit « www ». Ces lignes-ci disaient
      // l'adresse sans « www », qui redirige. Deux signaux qui se contredisent sur la
      // même page valent moins qu'un seul signal clair — et c'est exactement le
      // raisonnement déjà écrit dans src/lib/site.ts, simplement non appliqué ici.
      '@id': canonique('/ou-ca-paie'),
      url: canonique('/ou-ca-paie'),
      // 14/08/2026 — ce bloc servait encore à Google « Tapez votre zone. Ajnaya
      // vous dit où ça paie ce soir […] Données réelles flotte FOREAS », alors
      // que la <meta> avait déjà été corrigée : un chiffre faux dans un JSON-LD
      // est un chiffre faux revendiqué comme donnée structurée. Les deux lisent
      // maintenant la même constante et ne peuvent plus diverger.
      name: TITRE_PAGE,
      description: DESCRIPTION_PAGE,
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
      operatingSystem: 'Web, iOS, Android, WhatsApp',
      applicationCategory: 'BusinessApplication',
      // 14/08/2026 — disait « lit tes courses Uber, Bolt et Heetch » au présent,
      // donc une lecture continue. Mesure : driver_ride_features → 0 ligne, et
      // `select max(created_at) from rides` → 30/04/2026. Rien n'est lu en
      // continu. La formulation autorisée est PLATEFORMES_PHRASES.honnete.
      description: `Ajnaya, le copilote FOREAS des chauffeurs VTC. ${PLATEFORMES_PHRASES.honnete}, et elle te répond à la voix comme au clavier.`,
      offers: {
        '@type': 'Offer',
        // CE QUI ÉTAIT FAUX — `price: '0'`, servi en production (grep sur le HTML
        // de /ou-ca-paie → "price":"0"). Google pouvait donc présenter Ajnaya
        // comme gratuite, alors que PRIX_MENSUEL_CENTIMES = 2999 et que
        // verite-commerciale.ts ESSAI.abonnementCreeDesLInscription = true : un
        // abonnement Stripe est créé dès l'inscription, carte enregistrée.
        // Le prix vient maintenant de src/lib/offre.ts, jamais d'un littéral.
        price: (PRIX_MENSUEL_CENTIMES / 100).toFixed(2),
        priceCurrency: 'EUR',
        // 14/08/2026 — « sans carte » était faux (payment_method_collection:'always').
        description: `Abonnement ${formaterEuros(PRIX_MENSUEL_CENTIMES)} par mois. Essai de ${ESSAI_JOURS} jours : carte demandée, 0 € débité, annulation en un clic.`,
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
