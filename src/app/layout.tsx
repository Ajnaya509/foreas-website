import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.css'
import Preloader from '@/components/Preloader'
import GrainOverlay from '@/components/GrainOverlay'
import AjnayaWidget from '@/components/AjnayaWidget'
import { ConsentBanner } from '@/components/ConsentBanner'
import { TikTokPixel } from '@/components/TikTokPixel'
import { MetaPixel } from '@/components/MetaPixel'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'

// Site2026v49 — Geist Sans (Vercel premium font 2026)
// Geist = supérieure à Inter base : x-height optimisée, formes plus chaudes,
// optical sizing variable axis natif, conçue pour interfaces tech modernes.
// Utilisée par : Vercel, Next.js, v0.dev, Sandpack, Geist UI.
// CSS var auto : --font-geist-sans / --font-geist-mono

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
    <html lang="fr" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <head>
        {/* Favicon */}
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/favicon.svg" />

        {/* Preconnect to critical third-party CDNs for faster resource loading */}
        <link rel="preconnect" href="https://image.mux.com" />
        <link rel="dns-prefetch" href="https://image.mux.com" />
        <link rel="preconnect" href="https://stream.mux.com" />
        <link rel="dns-prefetch" href="https://stream.mux.com" />

        {/* Genos = logo + grands titres déco uniquement (Inter prend le relais sur le reste) */}
        <link
          rel="preload"
          href="/fonts/Genos-VariableFont_wght.ttf"
          as="font"
          type="font/ttf"
          crossOrigin="anonymous"
        />
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
