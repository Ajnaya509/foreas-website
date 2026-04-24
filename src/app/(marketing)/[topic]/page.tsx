import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import type { Metadata } from 'next'
import LandingPageTemplate, { type LandingContent } from '@/components/landing/LandingPageTemplate'

export const revalidate = 3600 // ISR — revalide toutes les heures

// ─── Whitelist statique ───────────────────────────────────────────────────────
const VALID_TOPICS = [
  'airbnb', 'surge', 'premium', 'optimisation', 'revenus',
  'flotte', 'charges', 'aeroport', 'evenements', 'clients',
]

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
    const { data } = await supabase
      .from('landing_pages')
      .select('*')
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
    openGraph: {
      title: data.meta_title,
      description: data.meta_description,
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
    <Suspense fallback={<div className="bg-[#050508] min-h-screen" />}>
      <LandingPageTemplate content={data} />
    </Suspense>
  )
}
