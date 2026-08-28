import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import localFont from 'next/font/local'
import dynamic from 'next/dynamic'
import './globals.css'
import Preloader from '@/components/Preloader'
import GrainOverlay from '@/components/GrainOverlay'

// Widget chat flottant (présent sur TOUTES les pages) → code-split : sort du bundle
// initial pour ne pas peser sur le 1er rendu. Se charge en chunk séparé après le paint.
/**
 * ⚠️ 22/08/2026 — LE WIDGET TRAVAILLAIT SUR L'ACCUEIL POUR NE RIEN AFFICHER.
 *
 * Il se retire lui-même de `/` (ligne 731 : `if (pathname === '/') return null`),
 * mais en React les crochets s'exécutent AVANT le premier `return` : 27 effets,
 * écouteurs et minuteries montaient quand même, depuis un fichier de 48 988 o.
 *
 * La décision de route vit désormais dans `PorteWidgetAjnaya`, un composant
 * minuscule. `dynamic()` ne télécharge qu'au premier RENDU réel : placé sous la
 * condition, le code du widget n'est plus demandé du tout sur l'accueil.
 */
const PorteWidgetAjnaya = dynamic(() => import('@/components/PorteWidgetAjnaya'))
import { TikTokPixel } from '@/components/TikTokPixel'
import { MetaPixel } from '@/components/MetaPixel'
import IdentityObserver from '@/components/IdentityObserver'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import DemarreurMesure from '@/components/DemarreurMesure'

// Site2026v50 — Configuration finale typographique :
// • Inter (next/font/google) : remplace Montserrat sur body + UI + h1-h6 réguliers
// • Genos (local TTF Variable + Italic) : logo + font-title stratégique
// → Pattern identique à l'app FOREAS Driver
const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
  variable: '--font-inter',
  weight: ['400', '500', '600', '700', '800', '900'],
  preload: true,
})

// ═══ Genos — police signature display + slogans + logo ═══════════════════════
// Variable Font (regular + italic) pour le rendu fluide géométrique signature
const genos = localFont({
  src: [
    {
      path: '../../public/fonts/Genos-VariableFont_wght.ttf',
      weight: '100 900',
      style: 'normal',
    },
    {
      path: '../../public/fonts/Genos-Italic-VariableFont_wght.ttf',
      weight: '100 900',
      style: 'italic',
    },
  ],
  variable: '--font-genos',
  display: 'swap',
  /**
   * ⚠️ 22/08/2026 — J'AI ESSAYÉ `preload: false` ICI, ET ÇA A EMPIRÉ.
   *
   * Raisonnement de départ : Genos (154 Ko) n'écrit aucun texte mesuré, elle ne
   * devrait pas voler de la bande passante au premier écran.
   *
   * Mesuré : LCP identique (5,2 s) et **FCP dégradé de 1,2 s à 2,1 s**. Sans
   * préchargement, le navigateur ne découvre la police qu'en calculant les
   * styles — donc plus tard, et au pire moment. Elle se télécharge quand même :
   * on a perdu la priorité sans rien gagner.
   *
   * → Annulé. Une idée de performance qui se tient sur le papier doit être
   * MESURÉE avant d'être gardée.
   */
  preload: true,
})

// ═══ Viewport Mobile-first (Wroblewski + Apple Web App spec) ═══════════════
// Required for proper mobile rendering — sans cela les mobiles zoom/dézoom
// de manière imprévisible. En Next.js 15+, séparé de metadata.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,           // accessibility : permet zoom jusqu'à 500%
  userScalable: true,         // WCAG 2.1.4.4 conformité
  themeColor: '#060610',      // status bar color iOS/Android (= obsidian body)
  colorScheme: 'dark',
}

export const metadata: Metadata = {
  title: 'FOREAS — Gagne plus, roule moins. Pour les chauffeurs VTC.',
  description: 'Ce qu\'il te reste, ta commission déduite, avant d\'accepter la course. FOREAS réunit tes courses Uber, Bolt et Heetch. Tape ta zone, vois ce qui paie ce soir.',
  keywords: ['VTC', 'chauffeur', 'Uber', 'Bolt', 'Heetch', 'revenus', 'Ajnaya', 'revenu net VTC', 'Paris'],
  authors: [{ name: 'FOREAS Labs' }],
  // www = domaine réellement servi (foreas.xyz 307-redirige vers www). og:image doit
  // pointer sur www sinon les scrapers (WhatsApp/Facebook) tombent sur la redirection
  // et n'affichent pas l'aperçu.
  metadataBase: new URL('https://www.foreas.xyz'),
  openGraph: {
    title: 'FOREAS — Gagne plus, roule moins',
    description: 'Les autres acceptent à l\'aveugle. Toi, tu vois ce qu\'il te reste — ta commission déduite — avant d\'accepter. Uber, Bolt, Heetch au même endroit.',
    url: 'https://www.foreas.xyz',
    siteName: 'FOREAS',
    locale: 'fr_FR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FOREAS — Gagne plus, roule moins',
    description: 'Les autres acceptent à l\'aveugle. Toi, tu vois ce qu\'il te reste — ta commission déduite — avant d\'accepter. Uber, Bolt, Heetch au même endroit.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className={`${inter.variable} ${genos.variable}`}>
      <head>
        {/* Favicon */}
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/favicon.svg" />

        {/* Preconnect critical CDNs (Site2026v77 nano-detail #3) */}
        <link rel="preconnect" href="https://image.mux.com" />
        <link rel="dns-prefetch" href="https://image.mux.com" />
        <link rel="preconnect" href="https://stream.mux.com" />
        <link rel="dns-prefetch" href="https://stream.mux.com" />
        {/* Supabase — fetch zone-by-coords + RPC widget */}
        <link rel="preconnect" href="https://fihvdvlhftcxhlnocqiq.supabase.co" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://fihvdvlhftcxhlnocqiq.supabase.co" />
        {/* Railway backend — TTS Koraly + handoff tokens */}
        <link rel="preconnect" href="https://foreas-stripe-backend-production.up.railway.app" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://foreas-stripe-backend-production.up.railway.app" />
        {/* Genos chargée via next/font/local (variable --font-genos) */}
      </head>
      <body className="bg-foreas-obsidian text-text-primary antialiased font-sans">
        {/* ⚠️ 22/08/2026 — AUCUNE PAGE DU SITE N'AVAIT DE LIEN D'ACCÈS DIRECT.
            Au clavier, il fallait traverser tout l'en-tête — logo, cinq liens,
            bouton d'essai — avant d'atteindre le contenu, sur CHAQUE page.
            Invisible tant qu'il n'a pas le focus, parfaitement visible ensuite. */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[10001] focus:rounded-xl focus:bg-[#00D4FF] focus:px-5 focus:py-3 focus:text-sm focus:font-bold focus:text-[#05070F] focus:outline-none focus:ring-4 focus:ring-[#00D4FF]/35"
        >
          Aller au contenu
        </a>
        {/* Tracking pixels — chargement conditionnel au consentement RGPD */}
        <TikTokPixel />
        <MetaPixel />
        <IdentityObserver />
        {/*
          ⚠️ 21/08/2026 — LE FILET SANS JAVASCRIPT.

          Le voile de marque est rendu par le serveur et ne part que par un
          effet React. Sans JavaScript, il restait à l'écran pour toujours,
          opaque, par-dessus la page entière.

          Ce `noscript` est lu par TOUS les navigateurs, anciens compris, et
          seulement quand les scripts sont désactivés ou en échec. Deux règles :
          la seconde couvre le cas où le voile aurait changé de balise.

          ⚠️ On utilise `display: none` et pas `opacity: 0` : un élément à
          opacité nulle occupe toujours la place et reste dans le flux.
        */}
        {/*
          ⚠️ 21/08/2026, SECONDE PASSE — LE TEXTE ÉTAIT LÀ, ET INVISIBLE.

          J'avais annoncé « texte visible 28 → 5 690 caractères » après avoir
          retiré les frontières d'attente. Ce chiffre comptait le texte PRÉSENT
          dans le document, pas le texte LISIBLE.

          Mesuré par un vérificateur adverse : sur /revenus, 2 400 des 2 495
          caractères sont sous un ancêtre à opacité nulle. Sur les dix pages, il
          ne restait de lisible que le pied de page.

          La cause : les enveloppes d'apparition démarrent à opacité nulle et ne
          remontent que par JavaScript. Le serveur écrit donc une opacité nulle,
          et rien ne la relève.

          ⚠️ ET C'ÉTAIT ÉCRIT DANS MA PROPRE MÉMOIRE, le matin même : « après
          correction la page reste invisible SANS JavaScript — opacité nulle et
          voile, deux corrections distinctes ». J'ai fait la première et déclaré
          la seconde faite.

          ⚠️ ET LE COMMENTAIRE LUI-MÊME A DÛ SORTIR DU BLOC CSS : écrit dans le
          gabarit, il partait entier dans le HTML de chaque page. Deux fois le
          même réflexe à corriger dans la même journée.

          La règle ne s'applique QUE sans JavaScript : elle ne peut pas casser
          l'animation de ceux qui l'ont.
        */}
        <noscript>
          <style>{`
            .voile-de-marque { display: none !important; }

            /* Sans JavaScript, tout ce qui attend une animation reste visible. */
            [style*="opacity:0"], [style*="opacity: 0"] { opacity: 1 !important; }
            /* ⚠️ 27/08 — CETTE RÈGLE VISAIT z-[100], ET LE RIDEAU EST PASSÉ À
               z-[10000] (il devait couvrir le bandeau de consentement, lui-même
               à 9999). Elle ne correspondait donc plus à rien : une ceinture qui
               ne tenait plus la ceinture, mais qui en avait toujours l'air.
               C'est « .voile-de-marque » juste au-dessus qui fait le vrai travail ;
               ⚠️ Et pas d'accent grave dans ce commentaire : il est DANS un
               gabarit JavaScript, où l'accent grave ferme la chaîne. Le premier
               jet en contenait deux et le site ne compilait plus.
               celle-ci reste la seconde chance, et il faut qu'elle vise juste. */
            [aria-hidden="true"].fixed.inset-0.z-\\[10000\\] { display: none !important; }
          `}</style>
        </noscript>
        <Preloader />
        {/*
          ⚠️ 22/08/2026 — LE FOURNISSEUR REACT POSTHOG A ÉTÉ RETIRÉ.
          Il ne fournissait rien : aucun `usePostHog`, aucun `PostHogFeature`,
          aucun `useFeatureFlag` dans le dépôt. `posthog-js/react` n'était
          importé que par lui. Il ne restait que le démarrage — et ce démarrage
          embarquait la bibliothèque dans le paquet de départ, où elle partait
          chez un tiers AVANT toute réponse au bandeau.
        */}
        {children}
        <DemarreurMesure />
        <GrainOverlay />
        <PorteWidgetAjnaya />
        {/* ── 28/08/2026 — LE BANDEAU DE CONSENTEMENT EST RETIRÉ ─────────
            Décision de Chandler : « c'est notre site, notre territoire ».
            La mesure d'audience tourne pour tout le monde (conditions de la
            dispense CNIL tenues dans src/lib/mesureProduit.ts).

            ⚠️ CONSÉQUENCE À CONNAÎTRE, ET ELLE N'EST PAS ANODINE :
            le bandeau était le SEUL endroit qui appelait `loadTrackingPixels()`.
            Sans lui, `foreas_consent` n'est jamais posé, donc les pixels META
            et TIKTOK ne partiront PLUS JAMAIS. Ce n'est pas un oubli : envoyer
            les données d'un visiteur à Facebook sans son accord est une autre
            catégorie juridique que mesurer son propre site.
            Le jour où une campagne Meta démarre, il faudra rouvrir une demande
            d'accord POUR LA PUBLICITÉ SEULEMENT — pas pour la mesure. */}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
