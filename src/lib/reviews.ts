import { createClient } from '@supabase/supabase-js'

/**
 * Lecture des VRAIS avis chauffeur (table `driver_reviews`, RLS service_role only).
 * Le site public (clé anon) ne peut pas lire la table → on lit côté SERVEUR avec la clé service
 * (jamais exposée au client). On ne renvoie QUE les champs publics sûrs (0 PII : prénom seul).
 *
 * Brief : FOREAS-SHARED/briefs/AJNAYA_AFFICHAGE_AVIS_SITE.md
 * Un avis n'est public que si `is_published = true` (auto pour note ≥ 4 ; < 4 = privé chauffeur).
 */

export interface PublicReview {
  rating: number
  first_name: string | null
  comment: string | null
  created_at: string
}

export interface ReviewsResult {
  reviews: PublicReview[]
  average: number | null
  count: number
}

const EMPTY: ReviewsResult = { reviews: [], average: null, count: 0 }

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

export async function getPublishedReviews(slug: string, limit = 10): Promise<ReviewsResult> {
  const s = (slug || '').trim()
  if (!s) return EMPTY
  const sb = serviceClient()
  if (!sb) return EMPTY

  const { data, error } = await sb
    .from('driver_reviews')
    .select('rating, client_first_name, comment, created_at')
    .eq('site_slug', s)
    .eq('is_published', true)
    .eq('verified', true)
    .gte('rating', 4) // garde-fou : jamais un avis < 4 (le brief : note ≥ 4 seulement)
    .order('created_at', { ascending: false })

  if (error || !data || data.length === 0) return EMPTY

  const count = data.length
  const average = Math.round((data.reduce((a, r) => a + (r.rating || 0), 0) / count) * 10) / 10
  const reviews: PublicReview[] = data.slice(0, limit).map((r) => ({
    rating: r.rating,
    first_name: r.client_first_name,
    comment: r.comment,
    created_at: r.created_at,
  }))
  return { reviews, average, count }
}
