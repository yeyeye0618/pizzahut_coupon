import { unstable_cache } from 'next/cache'
import { Coupon, getSupabase } from './supabase'
import { normalizeTags } from './coupon-utils'
import { TAG_SLUGS, TAGS_BY_SLUG } from './tag-slugs'

export { TAG_SLUGS }

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
  /**
   * Favourites view: the coupon codes to restrict to, or null when the view
   * is not active. The list travels in the URL (the favourites themselves live
   * in localStorage), so the server can render it like any other filter.
   */
  fav: string[] | null
}

export const DEFAULT_QUERY: CouponQuery = {
  q: '',
  tags: [],
  mode: 'union',
  sort: 'price-asc',
  page: 1,
  fav: null,
}

/** Upper bound on codes read from ?fav=, so a crafted URL cannot get huge. */
const MAX_FAV_CODES = 500
const COUPON_CODE = /^[A-Za-z0-9_-]{1,32}$/

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
    fav: parseFav(params.fav),
  }
}

function parseFav(value: string | string[] | undefined): string[] | null {
  if (value === undefined) return null
  const codes = String(firstValue(value) ?? '')
    .split(',')
    .map((code) => code.trim())
    .filter((code) => COUPON_CODE.test(code))
  return [...new Set(codes)].slice(0, MAX_FAV_CODES)
}

/** Serialise a query back to a URL, omitting anything that is still the default. */
export function couponHref(query: CouponQuery, pathname = '/'): string {
  const params = new URLSearchParams()
  if (query.q) params.set('q', query.q)
  if (query.tags.length) params.set('tags', query.tags.join(','))
  if (query.mode !== DEFAULT_QUERY.mode) params.set('mode', query.mode)
  if (query.sort !== DEFAULT_QUERY.sort) params.set('sort', query.sort)
  if (query.page > 1) params.set('page', String(query.page))
  if (query.fav) params.set('fav', query.fav.join(','))
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
  return (
    Boolean(query.q) ||
    query.tags.length > 0 ||
    query.sort !== DEFAULT_QUERY.sort ||
    query.fav !== null
  )
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
    (coupon.name ?? '').toLowerCase().includes(key) ||
    (coupon.description ?? '').toLowerCase().includes(key) ||
    normalizeTags(coupon.tags).some((tag) => tag.toLowerCase().includes(key))
  )
}

export function filterCoupons(coupons: Coupon[], query: CouponQuery): Coupon[] {
  const favs = query.fav ? new Set(query.fav) : null
  return coupons.filter(
    (coupon) =>
      (!favs || favs.has(coupon.coupon_num)) &&
      matchesKeyword(coupon, query.q) &&
      matchesTags(normalizeTags(coupon.tags), query)
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

// ---------- tag landing pages ----------

/**
 * A tag gets its own indexable page only with at least this many coupons; a
 * page listing one coupon is thin content, not a landing page.
 */
export const MIN_TAG_PAGE_COUPONS = 3

/** The tag a /tag/<slug> URL names, or null. */
export function tagFromSlug(slug: string): string | null {
  return TAGS_BY_SLUG.get(slug) ?? null
}

/** /tag/6-inch, /tag/6-inch/2 … Page 1 never carries a number, so it has one URL. */
export function tagHref(tag: string, page = 1): string {
  const base = `/tag/${TAG_SLUGS[tag] ?? encodeURIComponent(tag)}`
  return page > 1 ? `${base}/${page}` : base
}

/** Tags that have a landing page, most coupons first. */
export function landingTags(coupons: Coupon[]): { tag: string; count: number }[] {
  return collectTags(coupons).filter(
    ({ tag, count }) => count >= MIN_TAG_PAGE_COUPONS && tag in TAG_SLUGS
  )
}

export function couponsWithTag(coupons: Coupon[], tag: string): Coupon[] {
  return sortCoupons(
    coupons.filter((coupon) => normalizeTags(coupon.tags).includes(tag)),
    'price-asc'
  )
}

export function lowestPrice(coupons: Coupon[]): number | null {
  const prices = coupons.map((c) => c.price).filter((p): p is number => p != null)
  return prices.length ? Math.min(...prices) : null
}

// ---------- freshness ----------

/** Newest updated_at in the data: when coupon_fetch last wrote anything. */
export function latestUpdate(coupons: Coupon[]): Date | null {
  let latest: Date | null = null
  for (const coupon of coupons) {
    const updated = new Date(coupon.updated_at)
    if (Number.isNaN(updated.getTime())) continue
    if (!latest || updated > latest) latest = updated
  }
  return latest
}

/** 2026/10/29, in Taiwan time whatever timezone the server runs in. */
export function formatUpdateDate(date: Date): string {
  return new Intl.DateTimeFormat('zh-TW', {
    timeZone: 'Asia/Taipei',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

// ---------- deal value ----------

/**
 * Price as a fraction of the stated 最高價值, in the 折 notation people read
 * at a glance: 399 / 861 -> 4.6. Null when either figure is missing or the
 * "deal" is not cheaper. 最高價值 is the most the bundle could be worth, so
 * this is the best case, not a guaranteed saving.
 */
export function discountOf(coupon: Pick<Coupon, 'price' | 'original_price'>): number | null {
  const { price, original_price: value } = coupon
  if (price == null || value == null || value <= 0 || price >= value) return null
  const tenths = Math.round((price / value) * 100) / 10
  return tenths > 0 && tenths < 10 ? tenths : null
}

// ---------- coupon pages ----------

/** /coupon/26707. Coupon codes are ASCII, so no encoding is needed. */
export function couponPath(code: string): string {
  return `/coupon/${encodeURIComponent(code)}`
}

export function findCoupon(coupons: Coupon[], code: string): Coupon | undefined {
  return coupons.find((coupon) => coupon.coupon_num === code)
}

/**
 * What a coupon actually contains, as coarse product groups. Read from the
 * name and items only: the full description carries boilerplate such as
 * 「此套餐比薩餅皮升級…」 that would make a pasta deal look like a pizza deal.
 */
const PRODUCT_GROUPS: [string, RegExp][] = [
  ['麵飯', /麵|燉飯/],
  ['濃湯', /濃湯/],
  ['QQ球', /QQ球/],
  ['薯類', /薯金幣|薯條|薯球/],
  ['雞軟骨', /雞軟骨/],
  ['炸烤雞', /腿排|雞柳|雞球|雞翅|烤雞|BBQ/],
  ['芝心腸', /芝心腸/],
  ['海鮮點心', /鱈魚|蝦球/],
  ['甜點', /起司塔|蛋塔|可頌|布朗尼|麻糬/],
  ['飲料', /可樂|七喜|雪碧|紅茶|綠茶|柚茶|飲料/],
  ['大比薩', /大比薩|13吋|鬆厚大/],
  ['小比薩', /小比薩|9吋|10吋/],
  ['個人比薩', /個人比薩|6吋/],
  ['買一送一', /買一送一|買1送1/],
]

function productGroups(coupon: Coupon): Set<string> {
  const items = coupon.items?.filter(Boolean) ?? []
  // Unparsed rows fall back to the description, minus its boilerplate lines.
  const text = [coupon.name ?? '', ...(items.length ? items : [coupon.description ?? ''])]
    .join(' ')
    .replace(/此套餐比[薩蕯]餅皮升級[^。]*/g, '')
  return new Set(PRODUCT_GROUPS.filter(([, pattern]) => pattern.test(text)).map(([group]) => group))
}

/**
 * Up to `limit` other coupons most like this one, to give each coupon page
 * useful onward links. Selection: shared contents (pasta with pasta, QQ球 with
 * QQ球) count three times as much as a shared tag; ties go to the closest
 * price. Display: the chosen few are then listed cheapest first, priceless
 * ones last.
 */
export function relatedCoupons(coupons: Coupon[], coupon: Coupon, limit = 6): Coupon[] {
  const ownTags = new Set(normalizeTags(coupon.tags))
  const ownGroups = productGroups(coupon)
  const price = coupon.price ?? Number.POSITIVE_INFINITY
  return coupons
    .filter((other) => other.coupon_num !== coupon.coupon_num)
    .map((other) => {
      const groups = [...productGroups(other)].filter((group) => ownGroups.has(group)).length
      const tags = normalizeTags(other.tags).filter((tag) => ownTags.has(tag)).length
      return {
        other,
        score: groups * 3 + tags,
        gap: Math.abs((other.price ?? Number.POSITIVE_INFINITY) - price),
      }
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.gap - b.gap || a.other.coupon_num.localeCompare(b.other.coupon_num))
    .slice(0, limit)
    .map(({ other }) => other)
    .sort(
      (a, b) =>
        (a.price ?? Number.POSITIVE_INFINITY) - (b.price ?? Number.POSITIVE_INFINITY) ||
        a.coupon_num.localeCompare(b.coupon_num)
    )
}

// ---------- titles ----------

/** "2026年11月" in Taiwan time, for "this month's coupons" titles. */
export function currentMonthLabel(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('zh-TW', {
    timeZone: 'Asia/Taipei',
    year: 'numeric',
    month: 'numeric',
  }).formatToParts(now)
  const year = parts.find((p) => p.type === 'year')?.value
  const month = parts.find((p) => p.type === 'month')?.value
  return `${year}年${month}月`
}
