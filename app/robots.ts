import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'

export default function robots(): MetadataRoute.Robots {
  return {
    // Filtered views are allowed to be crawled (so their links are followed)
    // and opt out of the index with their own noindex meta instead; blocking
    // them here would hide that meta from crawlers.
    rules: { userAgent: '*', allow: '/' },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
