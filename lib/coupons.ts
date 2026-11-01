import { unstable_cache } from 'next/cache'
import { Coupon, getSupabase } from './supabase'
import { normalizeTags } from './coupon-utils'

export const PAGE_SIZE = 48

/** Cache tag so a coupon_fetch run can invalidate everything with revalidateTag(). */
export const COUPONS_CACHE_TAG = 'coupons'

export type SortMode = 'price-asc' | 'price-desc'
export type MatchMode = 'union' | 'intersection'

export type CouponQuery = {
  q: string
  tags: string[]
  mode: MatchMode
  sort: SortMode
  page: number
}

export const DEFAULT_QUERY: CouponQuery = {
  q: '',
  tags: [],
  mode: 'union',
  sort: 'price-asc',
  page: 1,
}

/**
 * Every coupon, cached across requests. The data behind this changes once per
 * coupon_fetch cycle (~14 days), so rendering stays cheap even though the page
 * itself is rendered per request once a filter is applied.
 */
export const getCoupons = unstable_cache(
  async (): Promise<Coupon[]> => {
    const { data, error } = await getSupabase().from('coupons').select('*')
    if (error) {
      throw new Error(`Failed to load coupons from Supabase: ${error.message}`)
    }
    return data ?? []
  },
  ['coupons'],
  { revalidate: 3600, tags: [COUPONS_CACHE_TAG] }
)

type RawSearchParams = Record<string, string | string[] | undefined>

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export function parseCouponQuery(params: RawSearchParams): CouponQuery {
  const rawTags = params.tags
  const tags = (Array.isArray(rawTags) ? rawTags : String(rawTags ?? '').split(','))
    .map((tag) => tag.trim())
    .filter(Boolean)

  const page = Number.parseInt(firstValue(params.page) ?? '1', 10)

  return {
    q: (firstValue(params.q) ?? '').trim(),
    tags: [...new Set(tags)],
    mode: firstValue(params.mode) === 'intersection' ? 'intersection' : 'union',
    sort: firstValue(params.sort) === 'price-desc' ? 'price-desc' : 'price-asc',
    page: Number.isFinite(page) && page > 0 ? page : 1,
  }
}

/** Serialise a query back to a URL, omitting anything that is still the default. */
export function couponHref(query: CouponQuery, pathname = '/'): string {
  const params = new URLSearchParams()
  if (query.q) params.set('q', query.q)
  if (query.tags.length) params.set('tags', query.tags.join(','))
  if (query.mode !== DEFAULT_QUERY.mode) params.set('mode', query.mode)
  if (query.sort !== DEFAULT_QUERY.sort) params.set('sort', query.sort)
  if (query.page > 1) params.set('page', String(query.page))
  const search = params.toString()
  return search ? `${pathname}?${search}` : pathname
}

/** A query change always returns to page 1 unless the change *is* the page. */
export function withQuery(query: CouponQuery, patch: Partial<CouponQuery>): CouponQuery {
  const next = { ...query, ...patch }
  if (patch.page === undefined) {
    next.page = 1
  }
  return next
}

export function toggleTag(query: CouponQuery, tag: string): CouponQuery {
  const tags = query.tags.includes(tag)
    ? query.tags.filter((t) => t !== tag)
    : [...query.tags, tag]
  return withQuery(query, { tags })
}

/**
 * True when the view is a user-driven slice rather than a canonical listing.
 * These get noindex so 2^n filter combinations never enter the index.
 */
export function isFilteredView(query: CouponQuery): boolean {
  return Boolean(query.q) || query.tags.length > 0 || query.sort !== DEFAULT_QUERY.sort
}

export function collectTags(coupons: Coupon[]): { tag: string; count: number }[] {
  const counter = new Map<string, number>()
  for (const coupon of coupons) {
    for (const tag of normalizeTags(coupon.tags)) {
      counter.set(tag, (counter.get(tag) ?? 0) + 1)
    }
  }
  return [...counter.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag, 'zh-Hant'))
}

function matchesTags(couponTags: string[], query: CouponQuery): boolean {
  if (!query.tags.length) return true
  const owned = new Set(couponTags)
  return query.mode === 'intersection'
    ? query.tags.every((tag) => owned.has(tag))
    : query.tags.some((tag) => owned.has(tag))
}

function matchesKeyword(coupon: Coupon, keyword: string): boolean {
  if (!keyword) return true
  const key = keyword.toLowerCase()
  return (
    coupon.coupon_num.toLowerCase().includes(key) ||
    (coupon.description ?? '').toLowerCase().includes(key) ||
    normalizeTags(coupon.tags).some((tag) => tag.toLowerCase().includes(key))
  )
}

export function filterCoupons(coupons: Coupon[], query: CouponQuery): Coupon[] {
  return coupons.filter(
    (coupon) =>
      matchesKeyword(coupon, query.q) && matchesTags(normalizeTags(coupon.tags), query)
  )
}

export function sortCoupons(coupons: Coupon[], sort: SortMode): Coupon[] {
  return [...coupons].sort((a, b) => {
    // Coupons without a price sort last in both directions rather than
    // pretending to be the cheapest or the most expensive.
    const priceA = a.price ?? Number.POSITIVE_INFINITY
    const priceB = b.price ?? Number.POSITIVE_INFINITY
    if (priceA !== priceB) {
      if (!Number.isFinite(priceA)) return 1
      if (!Number.isFinite(priceB)) return -1
      return sort === 'price-desc' ? priceB - priceA : priceA - priceB
    }
    return a.coupon_num.localeCompare(b.coupon_num, 'zh-Hant')
  })
}

export type CouponPage = {
  items: Coupon[]
  total: number
  page: number
  pageCount: number
}

export function paginate(coupons: Coupon[], page: number): CouponPage {
  const pageCount = Math.max(1, Math.ceil(coupons.length / PAGE_SIZE))
  const current = Math.min(page, pageCount)
  const start = (current - 1) * PAGE_SIZE
  return {
    items: coupons.slice(start, start + PAGE_SIZE),
    total: coupons.length,
    page: current,
    pageCount,
  }
}
