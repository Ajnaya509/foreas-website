import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import localFont from 'next/font/local'
import './globals.css'
import Preloader from '@/components/Preloader'
import GrainOverlay from '@/components/GrainOverlay'
import AjnayaWidget from '@/components/AjnayaWidget'
import { ConsentBanner } from '@/components/ConsentBanner'
import { TikTokPixel } from '@/components/TikTokPixel'
import { MetaPixel } from '@/components/MetaPixel'
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
  title: 'FOREAS | Pilote ton activité VTC avec Ajnaya',
  description: 'Ajnaya aide les chauffeurs VTC à gagner plus sur Uber, Bolt et Heetch. +35% de revenus visés à Paris.',
  keywords: ['VTC', 'chauffeur', 'Uber', 'Bolt', 'Heetch', 'revenus', 'Ajnaya', 'IA chauffeur', 'Paris'],
  authors: [{ name: 'FOREAS Labs' }],
  metadataBase: new URL('https://foreas.xyz'),
  openGraph: {
    title: 'FOREAS | Même travail. Plus de revenus.',
    description: 'Tes revenus VTC pilotés par Ajnaya. Zéro friction. +35% visés à Paris.',
    url: 'https://foreas.xyz',
    siteName: 'FOREAS',
    locale: 'fr_FR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FOREAS | Même travail. Plus de revenus.',
    description: 'Tes revenus VTC pilotés par Ajnaya. Zéro friction. +35% visés à Paris.',
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

        {/* Preconnect critical CDNs */}
        <link rel="preconnect" href="https://image.mux.com" />
        <link rel="dns-prefetch" href="https://image.mux.com" />
        <link rel="preconnect" href="https://stream.mux.com" />
        <link rel="dns-prefetch" href="https://stream.mux.com" />
        {/* Genos chargée via next/font/local (variable --font-genos) */}
      </head>
      <body className="bg-foreas-obsidian text-text-primary antialiased font-sans">
        {/* Tracking pixels — chargement conditionnel au consentement RGPD */}
        <TikTokPixel />
        <MetaPixel />
        <Preloader />
        {children}
        <GrainOverlay />
        <AjnayaWidget />
        <ConsentBanner />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
