import type { MetadataRoute } from 'next'
import { DEFAULT_QUERY, PAGE_SIZE, couponHref, getCoupons } from '@/lib/coupons'
import { absoluteUrl } from '@/lib/site'

// Coupons change once per coupon_fetch cycle; an hourly rebuild is plenty.
export const revalidate = 3600

/**
 * Only the indexable listing goes in: the unfiltered pages 1..N. Searched or
 * tag-filtered views are noindex and are left out on purpose.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const coupons = await getCoupons()
  const pageCount = Math.max(1, Math.ceil(coupons.length / PAGE_SIZE))

  const lastModified = coupons.reduce<Date | undefined>((latest, coupon) => {
    const updated = new Date(coupon.updated_at)
    if (Number.isNaN(updated.getTime())) return latest
    return !latest || updated > latest ? updated : latest
  }, undefined)

  return Array.from({ length: pageCount }, (_, i) => ({
    url: absoluteUrl(couponHref({ ...DEFAULT_QUERY, page: i + 1 })),
    lastModified,
    changeFrequency: 'weekly' as const,
    priority: i === 0 ? 1 : 0.6,
  }))
}
