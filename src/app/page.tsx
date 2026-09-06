import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { URL_SITE, canonique } from '@/lib/site'
import { PRIX_MENSUEL_CENTIMES, ESSAI_JOURS } from '@/lib/offre'
import MesureVue from '@/components/mesure/MesureVue'
import ExperienceClient from './experience/ExperienceClient'
import { estTelephone } from '@/lib/appareil'
import Ecran1Zone from './mobile/Ecran1Zone'
import PageVente from './mobile/PageVente'
import BarreCollante from './mobile/BarreCollante'

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
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * 06/09/2026 — L'ACCUEIL SERT DEUX PAGES, SELON L'APPAREIL.
 *
 * Décision Chandler : « il faut mettre le site www.foreas.xyz/mobile en version
 * mobile sur la page principale ». Un visiteur qui arrive avec un TÉLÉPHONE
 * reçoit donc ici la page qui vivait sur `/mobile` — hero de zone, page de
 * vente, barre sous le pouce. Sur ordinateur, rien ne change : le parcours
 * « téléphone vivant » reste l'accueil.
 *
 * ⚠️ CE N'EST PAS UNE MISE EN PAGE, CE SONT DEUX PAGES. Composants différents,
 * texte différent. Une bascule en CSS enverrait les deux et en cacherait une —
 * le visiteur paierait le poids des deux. Le choix se fait donc sur l'en-tête
 * `user-agent`, AVANT le premier octet : voir `src/lib/appareil.ts` et ses
 * seize agents de test dans `scripts/tests-accueil-telephone.mjs`.
 *
 * ⚠️ CE QUI RENDAIT LE PIÈGE DES DEUX CHATS POSSIBLE EST DÉJÀ FERMÉ.
 * `PorteWidgetAjnaya` masque la bulle flottante sur `/` ET sur `/mobile` : la
 * page mobile arrive ici avec ses cinq boutons vers Ajnaya sans qu'une bulle
 * vienne se poser par-dessus. Rien à changer de ce côté — mais si quelqu'un
 * retire `/` de cette liste un jour, deux portes apparaîtront sur la même page.
 *
 * ⚠️ `/mobile` RESTE `noindex`, ET C'EST LA BONNE DÉCISION. La page y est
 * désormais servie à la même adresse canonique que l'accueil : l'indexer aux
 * deux endroits créerait un doublon qui se ferait concurrence. L'adresse qui
 * compte est `/`, pour les deux appareils.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/**
 * ⚠️ NE PAS RENDRE CETTE PAGE STATIQUE.
 *
 * Le choix de l'appareil se lit dans l'en-tête de CHAQUE requête. Une page
 * mise en cache servirait la version du premier visiteur à tous les suivants —
 * la page mobile aux ordinateurs, ou l'inverse. La lecture de `headers()`
 * suffit déjà à rendre la page dynamique ; cette ligne le dit à voix haute,
 * pour que personne ne la « optimise » un jour sans voir ce qu'elle casse.
 */
export const dynamic = 'force-dynamic'
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
  // Fail-open, comme la ville : sans agent lisible, on sert l'accueil
  // ordinateur — c'est la version qui s'adapte déjà à un écran étroit.
  const surTelephone = estTelephone(h.get('user-agent'))


  /**
   * ⚠️ 22/08/2026, SECONDE PASSE — LA v150 FUITAIT LE BADGE APPAREIL.
   *
   * Cette page lisait le cookie `foreas_vid` ici et le descendait en propriété
   * jusqu'au lien WhatsApp, pour que le message porte la référence « (réf …) ».
   * Mon compte rendu affirmait « pas de miroir lisible côté navigateur ».
   *
   * **C'était faux.** Mesuré sur le HTML servi :
   *
   *   occurrences BRUTES du badge dans le HTML : 3
   *   le nom de la propriété `refVisite` :        1
   *
   * Une propriété passée d'un composant serveur à un composant client est
   * sérialisée dans la charge React. Et la valeur était de toute façon en clair
   * dans l'adresse du lien, dans le DOM. Le cookie est `httpOnly` précisément
   * pour qu'un script injecté ne puisse pas le lire — le publier annulait cette
   * protection.
   *
   * ⚠️ LA LEÇON : « le navigateur ne peut pas LIRE le cookie » et « la valeur du
   * cookie n'arrive pas au navigateur » sont deux affirmations DIFFÉRENTES. J'ai
   * prouvé la première et rapporté la seconde.
   *
   * Le badge ne quitte plus le serveur : les liens pointent vers `/wa`, qui lit
   * le cookie au clic. Voir `src/app/wa/route.ts`.
   */

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
          canonique dans leurs propriétés.

          La `variante` distingue les deux pages servies à la MÊME adresse.
          Sans elle, les deux parcours se mélangeraient dans un seul chiffre et
          on ne saurait jamais lequel convertit. */}
      {surTelephone ? (
        <>
          <MesureVue
            page="/"
            intention="ajnaya"
            audience="chauffeur"
            variante="mobile"
          />
          {/* Les trois pièces de l'ancienne `/mobile`, dans l'ordre : il tape sa
              zone et la réponse s'affiche, puis la vente, puis UNE porte sous le
              pouce dès que le hero est passé. */}
          <Ecran1Zone lienWhatsApp="/wa?s=hero_zone" />
          <PageVente />
          <BarreCollante />
        </>
      ) : (
        <>
          <MesureVue
            page="/"
            intention="ajnaya"
            audience="chauffeur"
            variante="ordinateur"
          />
          <ExperienceClient geoCity={geoCity} />
        </>
      )}
    </>
  )
}
