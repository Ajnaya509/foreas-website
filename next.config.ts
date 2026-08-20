import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
  async redirects() {
    // Pages archivées (déplacées dans /archive) → redirection 308 vers la page vivante.
    // Évite tout 404 / perte de SEO sur d'anciens liens ou index Google.
    return [
      { source: '/tarifs', destination: '/tarifs2', permanent: true },
      { source: '/partenaires', destination: '/professionnels', permanent: true },
      { source: '/entreprises', destination: '/professionnels', permanent: true },
      { source: '/2', destination: '/', permanent: true },
      // 20/08/2026 — /checkout redirige vers /tarifs2 : UN SEUL chemin commercial.
      //
      // Cette page avait sa propre grille (97 € / Elite 247 €) pendant que /tarifs2
      // vendait 29,99 €. Le prix a été aligné le 14/08, mais le vrai problème n'est
      // pas le prix : c'est qu'un second chemin avec sa propre copie, sa propre
      // modale de sortie et ses propres montants DÉRIVE. Il a dérivé une fois, il
      // dérivera encore — ce dépôt a produit trois fois le même piège cette semaine.
      //
      // 308 et non 301 : la redirection permanente qui PRÉSERVE la méthode. Next.js
      // conserve la chaîne de requête, donc `?plan=`, `?ref=` et les UTM d'une
      // campagne survivent au saut et l'attribution n'est pas perdue.
      //
      // ⚠️ ARBITRAGE ASSUMÉ : une campagne qui pointait sur /checkout amenait à un
      // formulaire de paiement direct ; elle amène maintenant à la page de tarifs,
      // donc un clic de plus. On échange un peu de conversion contre un seul
      // discours. C'est le sens de la décision — et c'est réversible en une ligne.
      { source: '/checkout', destination: '/tarifs2', permanent: true },
    ]
  },
  async headers() {
    return [
      {
        source: '/.well-known/apple-app-site-association',
        headers: [
          { key: 'Content-Type', value: 'application/json' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
        ],
      },
      {
        source: '/.well-known/assetlinks.json',
        headers: [
          { key: 'Content-Type', value: 'application/json' },
        ],
      },
    ]
  },
}

export default nextConfig
