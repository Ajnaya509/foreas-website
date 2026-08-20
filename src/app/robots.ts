import type { MetadataRoute } from 'next'
import { URL_SITE } from '@/lib/site'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/dashboard',
          '/login',
          '/509',
          '/success',
        ],
      },
    ],
    sitemap: `${URL_SITE}/sitemap.xml`,
    host: `${URL_SITE}`,
  }
}
