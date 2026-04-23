import type { MetadataRoute } from 'next'

const BASE = 'https://foreas.xyz'

// Landing topics dynamiques (src/app/(marketing)/[topic]/page.tsx)
const MARKETING_TOPICS = [
  'airbnb', 'surge', 'premium', 'optimisation', 'revenus',
  'flotte', 'charges', 'aeroport', 'evenements', 'clients',
]

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${BASE}/`,                                 lastModified: now, changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${BASE}/chauffeurs`,                       lastModified: now, changeFrequency: 'weekly',  priority: 0.9 },
    { url: `${BASE}/partenaires`,                      lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/tarifs`,                           lastModified: now, changeFrequency: 'weekly',  priority: 0.9 },
    { url: `${BASE}/tarifs2`,                          lastModified: now, changeFrequency: 'weekly',  priority: 0.9 },
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

  const topicPages: MetadataRoute.Sitemap = MARKETING_TOPICS.map((topic) => ({
    url: `${BASE}/${topic}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  return [...staticPages, ...topicPages]
}
