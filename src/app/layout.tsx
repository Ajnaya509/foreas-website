import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import localFont from 'next/font/local'
import dynamic from 'next/dynamic'
import './globals.css'
import Preloader from '@/components/Preloader'
import GrainOverlay from '@/components/GrainOverlay'

// Widget chat flottant (présent sur TOUTES les pages) → code-split : sort du bundle
// initial pour ne pas peser sur le 1er rendu. Se charge en chunk séparé après le paint.
const AjnayaWidget = dynamic(() => import('@/components/AjnayaWidget'))
import { ConsentBanner } from '@/components/ConsentBanner'
import { PostHogProvider } from '@/components/PostHogProvider'
import { TikTokPixel } from '@/components/TikTokPixel'
import { MetaPixel } from '@/components/MetaPixel'
import IdentityObserver from '@/components/IdentityObserver'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'

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
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[10000] focus:rounded-xl focus:bg-[#00D4FF] focus:px-5 focus:py-3 focus:text-sm focus:font-bold focus:text-[#05070F] focus:outline-none focus:ring-4 focus:ring-[#00D4FF]/35"
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
            [aria-hidden="true"].fixed.inset-0.z-\\[100\\] { display: none !important; }
          `}</style>
        </noscript>
        <Preloader />
        <PostHogProvider>{children}</PostHogProvider>
        <GrainOverlay />
        <AjnayaWidget />
        <ConsentBanner />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
