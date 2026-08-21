/**
 * ⚠️ 21/08/2026 — CETTE PAGE ÉTAIT OFFERTE À GOOGLE, ET ELLE N'A RIEN À Y FAIRE.
 *
 * C'est le repli sur ordinateur du routeur vers les boutiques : un code à
 * scanner et deux boutons. Aucun contenu, aucune intention de recherche, aucune
 * raison d'apparaître dans un résultat.
 *
 * Indexée, elle ferait pire que rien : elle entrerait en concurrence avec les
 * vraies pages du site sur le nom de la marque, en proposant à un humain venu de
 * Google… un code à scanner avec son téléphone.
 *
 * ⚠️ Elle reste PUBLIQUE et répond 200 — le routeur en a besoin. On refuse
 * l'indexation, pas l'accès. Les deux sont différents.
 *
 * ⚠️ ET C'EST POURQUOI CE FICHIER EXISTE. La page porte « use client », or les
 * métadonnées ne s'exportent que depuis un composant serveur. Posé sur la page
 * elle-même, l'export aurait été silencieusement ignoré : un refus d'indexation
 * qu'on croirait en place et qui ne serait jamais parti.
 */
export const metadata = {
  robots: { index: false, follow: true },
}

export default function GoDesktopLayout({ children }: { children: React.ReactNode }) {
  return children
}
