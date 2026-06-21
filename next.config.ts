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
