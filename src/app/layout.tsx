import type { Metadata } from 'next'
import './globals.css'
import Preloader from '@/components/Preloader'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'

// Preload critical fonts for immediate rendering
export const metadata: Metadata = {
  title: 'FOREAS | Optimisation intelligente pour chauffeurs VTC',
  description: 'FOREAS aide les chauffeurs VTC à gagner plus sur les plateformes grâce à l\'IA Ajnaya. +35% de revenus observés à Paris.',
  keywords: ['VTC', 'chauffeur', 'Uber', 'Bolt', 'optimisation', 'revenus', 'IA', 'Paris'],
  authors: [{ name: 'FOREAS Labs' }],
  metadataBase: new URL('https://foreas.xyz'),
  openGraph: {
    title: 'FOREAS | Même travail. Plus de revenus.',
    description: 'Optimisation intelligente de vos revenus VTC, pilotée par l\'IA Ajnaya.',
    url: 'https://foreas.xyz',
    siteName: 'FOREAS',
    locale: 'fr_FR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FOREAS | Même travail. Plus de revenus.',
    description: 'Optimisation intelligente de vos revenus VTC, pilotée par l\'IA Ajnaya.',
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
    <html lang="fr">
      <head>
        {/* Favicon */}
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/favicon.svg" />

        {/* Preconnect to critical third-party CDNs for faster resource loading */}
        <link rel="preconnect" href="https://image.mux.com" />
        <link rel="dns-prefetch" href="https://image.mux.com" />
        <link rel="preconnect" href="https://stream.mux.com" />
        <link rel="dns-prefetch" href="https://stream.mux.com" />

        {/* Preload Genos font for immediate rendering on preloader */}
        <link
          rel="preload"
          href="/fonts/Genos-VariableFont_wght.ttf"
          as="font"
          type="font/ttf"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/Genos-Italic-VariableFont_wght.ttf"
          as="font"
          type="font/ttf"
          crossOrigin="anonymous"
        />
      </head>
      <body className="bg-foreas-black text-foreas-light antialiased">
        <Preloader />
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
