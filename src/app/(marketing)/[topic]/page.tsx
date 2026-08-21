import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import LandingPageTemplate, { type LandingContent } from '@/components/landing/LandingPageTemplate'
import { canonique } from '@/lib/site'

import { SUJETS } from '@/lib/sujets'
export const revalidate = 3600 // ISR — revalide toutes les heures

// ─── Whitelist statique ───────────────────────────────────────────────────────
// La liste vient de src/lib/sujets.ts — elle vivait ici ET dans
// src/app/go/[topic]/route.ts, recopiée à la main.
const VALID_TOPICS = SUJETS as readonly string[]

// ─── Routes existantes à NE PAS écraser ───────────────────────────────────────
// Next.js résout les routes statiques en priorité sur les dynamiques.
// Ces routes n'apparaissent donc jamais ici :
// /, /chauffeurs, /partenaires, /tarifs, /tarifs2, /technologie, /a-propos,
// /contact, /cgu, /confidentialite, /mentions-legales, /dashboard, /login, /509

async function getContent(topic: string): Promise<LandingContent | null> {
  if (!VALID_TOPICS.includes(topic)) return null

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    // SELECT EXPLICITE — surtout pas `select('*')`.
    //
    // LandingPageTemplate est un composant `'use client'` : tout ce qu'on lui passe est
    // sérialisé par Next.js dans le payload RSC **embarqué dans le HTML public**. Avec
    // `select('*')`, les colonnes plates héritées partaient donc en ligne même si aucune
    // n'était affichée — lisibles dans « afficher la source », par Google, par n'importe
    // quel scraper.
    //
    // Constaté le 31/07/2026 sur la production : `desire_vs_reality` et `aha_moment`
    // servaient encore « tu franchis les 3500€/mois », « entre 1800 et 2200€/mois net »
    // (/revenus) et « top 10% des chauffeurs par revenu horaire » (/premium) — des gains
    // chiffrés inventés, sur une page dont le sujet est justement l'honnêteté des chiffres.
    // La réécriture du contenu avait nettoyé `content`, pas la ligne entière.
    //
    // Ce select ne prend que les 4 champs réellement rendus (cf. interface LandingContent).
    // Une colonne héritée ne peut plus fuiter, aujourd'hui ni après un futur ajout.
    const { data } = await supabase
      .from('landing_pages')
      .select('topic_slug, meta_title, meta_description, content')
      .eq('topic_slug', topic)
      .eq('active', true)
      .single()

    return data as LandingContent | null
  } catch {
    return null
  }
}

// ─── generateStaticParams ─────────────────────────────────────────────────────
export async function generateStaticParams() {
  return VALID_TOPICS.map(topic => ({ topic }))
}

// ─── Metadata ─────────────────────────────────────────────────────────────────
export async function generateMetadata(
  { params }: { params: Promise<{ topic: string }> }
): Promise<Metadata> {
  const { topic } = await params
  const data = await getContent(topic)

  if (!data) {
    return {
      title: 'FOREAS Driver — Optimise tes revenus VTC',
      description: 'Stratégies VTC intelligentes pilotées par Ajnaya.',
    }
  }

  return {
    title: data.meta_title || `${topic.charAt(0).toUpperCase() + topic.slice(1)} — Stratégie VTC par FOREAS Driver`,
    description: data.meta_description || 'Optimise tes revenus de chauffeur VTC avec FOREAS.',
    // ── ADRESSE DE RÉFÉRENCE — 20/08/2026, seconde passe ──────────────────
    //
    // Neuf pages écrites à la main avaient été canonisées le matin. Ces dix-là,
    // fabriquées en série depuis la base, n'avaient RIEN — alors qu'elles sont
    // dans le plan du site, indexables, et que ce sont précisément les pages
    // générées à la chaîne : celles qui se ressemblent le plus entre elles, et
    // qui souffrent le plus d'être servies sous deux adresses (avec et sans
    // « www »). Corriger neuf pages soignées et laisser dix pages fabriquées
    // sans rien, c'était traiter le symptôme visible.
    alternates: { canonical: canonique(`/${topic}`) },
    openGraph: {
      title: data.meta_title,
      description: data.meta_description,
      url: canonique(`/${topic}`),
    },
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function TopicLandingPage(
  { params }: { params: Promise<{ topic: string }> }
) {
  const { topic } = await params
  const data = await getContent(topic)

  if (!data) return notFound()

  return (
    <LandingPageTemplate content={data} />
  )
}
