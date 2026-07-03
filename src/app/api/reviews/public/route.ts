import { NextRequest, NextResponse } from 'next/server'
import { getPublishedReviews } from '@/lib/reviews'

export const runtime = 'nodejs'

/**
 * GET /api/reviews/public?slug={site_slug}
 * Renvoie les avis PUBLIÉS d'un chauffeur (note ≥ 4, prénom seul), + moyenne + total.
 * Lecture serveur (clé service) — le client ne voit que les champs sûrs. Brief AJNAYA_AFFICHAGE_AVIS_SITE.md.
 */
export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get('slug') || ''
  const data = await getPublishedReviews(slug)
  return NextResponse.json(data, {
    headers: { 'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=600' },
  })
}
