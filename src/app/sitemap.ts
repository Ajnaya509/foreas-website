import type { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'

const BASE = 'https://foreas.xyz'

// Repli si la base est injoignable — JAMAIS un sitemap vide (ce serait pire que
// quelques URLs de trop : Google interpréterait une disparition du site).
// Les slugs listés ici correspondent aux lignes actives de `landing_pages`.
const FALLBACK_TOPICS = [
  'airbnb', 'surge', 'premium', 'optimisation', 'revenus',
  'flotte', 'charges', 'aeroport', 'evenements', 'clients',
]

/**
 * Les topics annoncés à Google DÉRIVENT de la base, plus d'une liste en dur.
 *
 * Le 31/07/2026, cette liste en dur déclarait 10 topics alors que `landing_pages`
 * n'en contenait que 5 exploitables : /flotte, /charges, /aeroport, /evenements et
 * /clients renvoyaient 404 EN PRODUCTION tout en étant soumis à Google (vérifié en
 * direct par requête HTTP). Une liste en dur ne peut pas savoir ce que contient la
 * base — elle finit toujours par mentir dans un sens ou dans l'autre.
 *
 * Effet de bord voulu, et c'est le principal : pour publier une nouvelle landing,
 * il suffit désormais d'insérer une ligne active dans `landing_pages`. La page ET
 * son entrée au sitemap suivent toutes seules. C'est ce qui rend tenable une
 * stratégie à 30-50 pages sans oublier la moitié en route.
 *
 * `notFound()` reste la seule autorité sur ce qui existe réellement : ce filtre ne
 * fait qu'éviter d'ANNONCER une page qui n'a pas encore de contenu.
 */
async function getActiveTopics(): Promise<string[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  // Pas de clé (build local, preview sans secrets) → repli, jamais d'exception :
  // une erreur ici ferait échouer le build entier, comme /free-signup l'a déjà fait.
  if (!url || !key) {
    console.warn('[sitemap] Supabase non configuré — repli sur la liste statique.')
    return FALLBACK_TOPICS
  }
  try {
    const { data, error } = await createClient(url, key)
      .from('landing_pages')
      .select('topic_slug')
      .eq('active', true)
    if (error) {
      console.error(`[sitemap] landing_pages KO (${error.code || 'no-code'}) — repli statique : ${error.message}`)
      return FALLBACK_TOPICS
    }
    const slugs = (data ?? []).map((r) => r.topic_slug as string)
    // `go` est une page d'atterrissage publicitaire volontairement hors sitemap :
    // elle sert de destination à des campagnes payantes, pas à la recherche.
    const publics = slugs.filter((s) => s !== 'go')
    return publics.length ? publics : FALLBACK_TOPICS
  } catch (e) {
    console.error('[sitemap] lecture landing_pages impossible — repli statique.', e)
    return FALLBACK_TOPICS
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${BASE}/`,                                 lastModified: now, changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${BASE}/chauffeurs`,                       lastModified: now, changeFrequency: 'weekly',  priority: 0.9 },
    { url: `${BASE}/professionnels`,                   lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/tarifs2`,                          lastModified: now, changeFrequency: 'weekly',  priority: 0.9 },
    // /ou-ca-paie — Hero Search Bar Ajnaya v1 (Site2026v65)
    { url: `${BASE}/ou-ca-paie`,                       lastModified: now, changeFrequency: 'daily',   priority: 0.95 },
    { url: `${BASE}/technologie`,                      lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/a-propos`,                         lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/contact`,                          lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    // Landing SEO — facturation électronique VTC 2026
    { url: `${BASE}/facturation-electronique-vtc-2026`, lastModified: now, changeFrequency: 'weekly',  priority: 0.95 },
    // Pages légales
    { url: `${BASE}/cgu`,                              lastModified: now, changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${BASE}/confidentialite`,                  lastModified: now, changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${BASE}/mentions-legales`,                 lastModified: now, changeFrequency: 'yearly',  priority: 0.3 },
  ]

  const topicPages: MetadataRoute.Sitemap = (await getActiveTopics()).map((topic) => ({
    url: `${BASE}/${topic}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  return [...staticPages, ...topicPages]
}
