import type { Metadata } from 'next'
import { headers, cookies } from 'next/headers'
import { URL_SITE, canonique } from '@/lib/site'
import { PRIX_MENSUEL_CENTIMES, ESSAI_JOURS } from '@/lib/offre'
import MesureVue from '@/components/mesure/MesureVue'
import ExperienceClient from './experience/ExperienceClient'

/**
 * FOREAS — L'ACCUEIL.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * 22/08/2026 — CETTE PAGE EST DEVENUE LE PARCOURS « TÉLÉPHONE VIVANT ».
 *
 * Décision Chandler : le contenu qui vivait sur `/experience` devient l'accueil.
 * L'ancienne home ivoire sort du chemin public — elle n'est ni republiée
 * ailleurs, ni fusionnée ici. L'historique du dépôt suffit comme retour arrière.
 *
 * ⚠️ CE N'EST PAS UN DÉPLACEMENT DE PIXELS. Le contenu Experience était relié à
 * son ancienne adresse par SIX fils, écrits en dur à six endroits différents :
 *   · `MesureVue page="/experience"` — la vue comptée ;
 *   · `LivePhone` → `pageSource` et `url_pre_landing` — la reprise WhatsApp ;
 *   · le texte de reprise qui cite « foreas.xyz/experience » à voix haute ;
 *   · `ajnayaChatCore` et l'API de chat — deux descriptions concurrentes du
 *     contexte de la page, dont une qui décrivait `/` comme une page B2B ;
 *   · `AjnayaWidget` — la bulle flottante masquée sur la seule route Experience ;
 *   · `PARCOURS` — le manifeste des cinq parcours.
 * Basculer l'affichage sans les suivre aurait cassé la mesure, la reprise de
 * conversation, et fait apparaître DEUX chats sur la même page.
 *
 * ⚠️ `robots: noindex` A ÉTÉ RETIRÉ. Il était posé « tant que les sections sont
 * des placeholders », et la checklist de bascule était écrite dans l'ancien
 * fichier. Une page d'accueil non indexable est une porte d'entrée invisible.
 *
 * ⚠️ LA VILLE EST LUE CÔTÉ SERVEUR (`x-vercel-ip-city`), sans permission ni
 * appel réseau : elle ne fait que biaiser l'ordre des zones proposées. Repli
 * immédiat et honnête si l'en-tête manque — jamais d'écran d'attente, jamais de
 * service tiers pour deviner.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export const metadata: Metadata = {
  title: 'FOREAS — Discute avec Ajnaya. Gagne plus, roule moins.',
  description:
    "Écris ta zone, Ajnaya te répond en direct. Ce qu'il te reste, ta commission déduite, avant d'accepter la course. Uber, Bolt, Heetch au même endroit.",
  alternates: { canonical: canonique('/') },
  openGraph: {
    title: 'FOREAS — Discute avec Ajnaya',
    description:
      "Pas une démo : le vrai chat qui aide les chauffeurs VTC à savoir où ça paie ce soir. Tape ta zone, vois par toi-même.",
    type: 'website',
    locale: 'fr_FR',
    url: canonique('/'),
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FOREAS — Discute avec Ajnaya',
    description:
      "Écris ta zone, Ajnaya te répond en direct. Gratuitement, sans compte.",
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
        // ── 21/08/2026 — CE CHAMP DÉCLARAIT LE PRODUIT GRATUIT ──
        // Il valait '0'. La phrase juste en dessous précise bien qu'il s'agit
        // de l'essai — mais Google ne lit pas la phrase, il lit CE champ. Un
        // abonnement à 29,99 €/mois s'annonçait donc « gratuit » dans les
        // données indexées, avec le risque d'être affiché comme tel dans les
        // résultats de recherche.
        //
        // Le prix récurrent va ici, l'essai reste dans la description. Et il
        // vient du catalogue : écrire « 29.99 » à la main aurait créé un
        // neuvième endroit à corriger le jour où le prix bouge.
        price: (PRIX_MENSUEL_CENTIMES / 100).toFixed(2),
        priceCurrency: 'EUR',
        priceSpecification: {
          '@type': 'UnitPriceSpecification',
          price: (PRIX_MENSUEL_CENTIMES / 100).toFixed(2),
          priceCurrency: 'EUR',
          billingIncrement: 1,
          unitCode: 'MON',
        },
        // 14/08/2026 — disait « sans carte ». Faux : api/checkout crée la session avec
            // payment_method_collection:'always', la carte EST enregistrée. Cette phrase
            // vit dans les données structurées lues par Google : une promesse fausse
            // qui s'indexe et qu'on ne voit jamais à l'écran.
            description: `Essai ${ESSAI_JOURS} jours à 0 € — carte demandée, rien débité, annulation en un clic.`,
      },
      // aggregateRating retiré : pas d'avis vérifiables. Un faux rich-snippet de notation
      // = risque pénalité Google + pratique commerciale trompeuse. À remettre quand de
      // vrais avis (source auditable) existeront.
    },
  ],
}

export default async function AccueilPage() {
  // Fail-open : sans en-tête (dev local, hôte non-Vercel), ordre national par défaut.
  const h = await headers()
  const geoCity = h.get('x-vercel-ip-city') || null

  /**
   * ⚠️ 22/08/2026 — LES DEUX SORTIES WHATSAPP DE L'ACCUEIL PARTAIENT NUES.
   *
   * WhatsApp est le chemin PRINCIPAL de FOREAS : Ajnaya → discussion → WhatsApp
   * → paiement quand le chauffeur est convaincu. Or le lien servi était :
   *
   *   https://wa.me/33780732216?text=Salut%20Ajnaya.%20Je%20démarre…
   *
   * Rien d'autre. Un chauffeur venu d'une publicité arrivait chez Ajnaya en
   * parfait inconnu : ni la campagne, ni la page, ni le parrain.
   *
   * ⚠️ LE MÉCANISME EXISTAIT DÉJÀ, ET PERSONNE NE LE FOURNISSAIT.
   * `buildWAUrl` accepte une option `ref` depuis le début. Son commentaire dit
   * mot pour mot : « Sans lui, le prospect arrive sur WhatsApp en parfait
   * inconnu. » Deux sites d'appel sur douze la passaient.
   *
   * ⚠️ ET LA CLÉ NE POUVAIT PAS VENIR DU NAVIGATEUR.
   * La bonne clé est `foreas_vid`, le badge appareil posé par le middleware —
   * c'est LUI que `/api/mesure` écrit dans `events.session_id`, à côté de
   * l'origine (campagne, parrain, page). Mais il est `httpOnly` : le JavaScript
   * de la page ne peut pas le lire. D'où la lecture ici, côté serveur, et la
   * descente en propriété.
   *
   * Résultat : le message WhatsApp porte « (réf <badge>) », la Pieuvre le lit en
   * `/réf ([\w-]+)/` et retrouve dans `events` d'où vient la personne.
   *
   * Si le cookie manque, `null` — le lien reste identique à avant. On n'invente
   * pas de valeur : une référence fabriquée pointerait vers la mauvaise visite.
   */
  const badgeAppareil = (await cookies()).get('foreas_vid')?.value ?? null

  return (
    <>
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
      />
      {/* ⚠️ La vue est comptée sous « / », pas sous l'ancienne adresse. Les
          événements `experience_*` gardent leurs noms — la continuité historique
          vaut plus qu'un renommage cosmétique — mais ils portent la route
          canonique dans leurs propriétés. */}
      <MesureVue page="/" intention="ajnaya" audience="chauffeur" />
      <ExperienceClient geoCity={geoCity} refVisite={badgeAppareil} />
    </>
  )
}
