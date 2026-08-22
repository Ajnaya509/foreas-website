import type { NextConfig } from 'next'
import path from 'node:path'

const nextConfig: NextConfig = {
  /**
   * ⚠️ 21/08/2026 — NEXT PRENAIT LE DOSSIER PERSONNEL POUR LA RACINE DU PROJET.
   *
   * Message exact à chaque assemblage :
   *   « We detected multiple lockfiles and selected the directory of
   *     /Users/chandlermilien/package-lock.json as the root directory. »
   *
   * Il existe un fichier de dépendances égaré dans le dossier personnel. Next
   * remonte l'arborescence pour deviner la racine de l'espace de travail, le
   * trouve, et considère TOUT le dossier personnel comme la racine.
   *
   * Ce n'est pas qu'un avertissement : c'est depuis cette racine que Next trace
   * les fichiers à embarquer dans le paquet serveur. Une racine trop haute fait
   * remonter des fichiers étrangers au projet — y compris ceux des autres
   * projets de Chandler.
   *
   * ⚠️ ON NE SUPPRIME PAS le fichier égaré : il n'appartient pas à ce dépôt, et
   * un autre projet en dépend peut-être. On déclare simplement notre racine.
   */
  outputFileTracingRoot: path.join(__dirname),
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
      // ⚠️ 22/08/2026 — /experience EST DEVENU L'ACCUEIL.
      //
      // Le contenu « téléphone vivant » a été promu sur `/` (décision Chandler).
      // L'ancienne adresse redirige en PERMANENT et en UN SEUL SAUT. Next
      // conserve la chaîne de requête : `/experience?utm_source=x&ref=ABC`
      // arrive sur `/?utm_source=x&ref=ABC` — campagne et parrainage survivent.
      //
      // ⚠️ CETTE LIGNE VA DANS LA LISTE EXISTANTE, PAS DANS UN SECOND
      // `redirects()`. Premier jet : j'en ai déclaré un deuxième dans le même
      // objet. TypeScript a crié « Duplicate identifier » — mais en JavaScript
      // pur, la seconde déclaration aurait SILENCIEUSEMENT écrasé les cinq
      // redirections précédentes, dont /tarifs et /checkout.
      { source: '/experience', destination: '/', permanent: true },
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
