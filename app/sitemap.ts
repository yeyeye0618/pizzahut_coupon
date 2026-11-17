import type { MetadataRoute } from 'next'
import {
  DEFAULT_QUERY,
  PAGE_SIZE,
  couponHref,
  couponPath,
  getCoupons,
  landingTags,
  latestUpdate,
  tagHref,
} from '@/lib/coupons'
import { absoluteUrl } from '@/lib/site'

// Coupons change once per coupon_fetch cycle; an hourly rebuild is plenty.
export const revalidate = 3600

function pageCount(count: number) {
  return Math.max(1, Math.ceil(count / PAGE_SIZE))
}

/**
 * Only indexable pages go in: the unfiltered listing pages and every tag
 * landing page. Searched, filtered and favourites views are noindex and are
 * left out on purpose.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const coupons = await getCoupons()
  const lastModified = latestUpdate(coupons) ?? undefined

  const listing = Array.from({ length: pageCount(coupons.length) }, (_, i) => ({
    url: absoluteUrl(couponHref({ ...DEFAULT_QUERY, page: i + 1 })),
    lastModified,
    changeFrequency: 'weekly' as const,
    priority: i === 0 ? 1 : 0.5,
  }))

  const tags = landingTags(coupons).flatMap(({ tag, count }) =>
    Array.from({ length: pageCount(count) }, (_, i) => ({
      url: absoluteUrl(tagHref(tag, i + 1)),
      lastModified,
      changeFrequency: 'weekly' as const,
      priority: i === 0 ? 0.8 : 0.4,
    }))
  )

  const guide = {
    url: absoluteUrl('/guide'),
    lastModified,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }

  // One page per live coupon. coupon_fetch deletes codes Pizza Hut no longer
  // serves, so an expired coupon leaves the sitemap on the next regeneration.
  const couponPages = coupons.map((coupon) => {
    const updated = new Date(coupon.updated_at)
    return {
      url: absoluteUrl(couponPath(coupon.coupon_num)),
      lastModified: Number.isNaN(updated.getTime()) ? lastModified : updated,
      changeFrequency: 'weekly' as const,
      priority: 0.5,
    }
  })

  return [...listing, guide, ...tags, ...couponPages]
}
