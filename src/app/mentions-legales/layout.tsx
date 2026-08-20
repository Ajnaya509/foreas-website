import type { Metadata } from 'next'
import { canonique } from '@/lib/site'

/**
 * Métadonnées de /mentions-legales.
 *
 * ⚠️ CE FICHIER EXISTE POUR UNE SEULE RAISON : `page.tsx` est un composant
 * client (`'use client'`), et un composant client ne peut pas exporter de
 * métadonnées. Sans ce layout, la page n'a AUCUNE balise canonique — vérifié en
 * production le 20/08/2026 sur les 9 pages du sitemap : aucune n'en avait.
 *
 * Or le sitemap les déclare, et l'apex redirige vers `www`. Sans canonique,
 * Google choisit seul entre les deux versions d'une même page, et les deux se
 * concurrencent. L'adresse vient de src/lib/site.ts, seul endroit où elle vit.
 */
export const metadata: Metadata = {
  alternates: { canonical: canonique('/mentions-legales') },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
