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
  description: 'Ton net réel, commission déduite, avant d\'accepter la course. FOREAS lit Uber, Bolt, Heetch + 4 autres plateformes en direct. Tape ta zone, vois ce qui paie ce soir.',
  keywords: ['VTC', 'chauffeur', 'Uber', 'Bolt', 'Heetch', 'revenus', 'Ajnaya', 'net réel VTC', 'Paris'],
  authors: [{ name: 'FOREAS Labs' }],
  // www = domaine réellement servi (foreas.xyz 307-redirige vers www). og:image doit
  // pointer sur www sinon les scrapers (WhatsApp/Facebook) tombent sur la redirection
  // et n'affichent pas l'aperçu.
  metadataBase: new URL('https://www.foreas.xyz'),
  openGraph: {
    title: 'FOREAS — Gagne plus, roule moins',
    description: 'Les autres acceptent à l\'aveugle. Toi, tu vois ton net réel — commission déduite — avant d\'accepter. FOREAS lit les 7 plateformes en direct.',
    url: 'https://www.foreas.xyz',
    siteName: 'FOREAS',
    locale: 'fr_FR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FOREAS — Gagne plus, roule moins',
    description: 'Les autres acceptent à l\'aveugle. Toi, tu vois ton net réel — commission déduite — avant d\'accepter. FOREAS lit les 7 plateformes en direct.',
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
        {/* Tracking pixels — chargement conditionnel au consentement RGPD */}
        <TikTokPixel />
        <MetaPixel />
        <IdentityObserver />
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
