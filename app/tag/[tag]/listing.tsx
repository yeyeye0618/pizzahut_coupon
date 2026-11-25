import type { Metadata } from 'next'
import Link from 'next/link'
import { CouponGrid } from '@/components/CouponGrid'
import { JsonLd } from '@/components/JsonLd'
import { Pagination } from '@/components/Pagination'
import { SiteFooter } from '@/components/SiteFooter'
import { ThemeSwitcher } from '@/components/ThemeSwitcher'
import {
  DEFAULT_QUERY,
  PAGE_SIZE,
  couponHref,
  couponsWithTag,
  currentMonthLabel,
  formatUpdateDate,
  getCoupons,
  landingTags,
  latestUpdate,
  lowestPrice,
  paginate,
  tagFromSlug,
  tagHref,
  TAG_SLUGS,
} from '@/lib/coupons'
import { normalizeFacets } from '@/lib/facets'

/*
 * Shared by /tag/[tag] (page 1) and /tag/[tag]/[page] (pages 2+). They used to
 * be one optional catch-all route, /tag/[tag]/[[...page]]; on Vercel its
 * notFound() answered 500 and a regeneration could leave a page stuck on a
 * stale copy. Two plain dynamic routes avoid both.
 *
 * The [tag] segment is an ASCII slug (TAG_SLUGS): on Vercel a Chinese path
 * that wasn't built at deploy answered 500, even for notFound().
 */

/** Static params for every landing tag, with page 1 or pages 2..N. */
export async function tagPageParams(which: 'first' | 'rest') {
  const coupons = await getCoupons()
  return landingTags(coupons).flatMap(({ tag, count }) => {
    const pageCount = Math.ceil(count / PAGE_SIZE)
    const slug = TAG_SLUGS[tag]
    if (which === 'first') return [{ tag: slug }]
    return Array.from({ length: Math.max(0, pageCount - 1) }, (_, i) => ({
      tag: slug,
      page: String(i + 2),
    }))
  })
}

export type TagData = NonNullable<Awaited<ReturnType<typeof resolveTag>>>

/**
 * The tag and page as a landing page, or null for anything that isn't one:
 * an unknown or too-small tag, or a page past the end.
 */
export async function resolveTag(slug: string, page: number) {
  const tag = tagFromSlug(slug)
  if (!tag) return null
  const coupons = await getCoupons()
  const allTags = landingTags(coupons)
  if (!allTags.some((t) => t.tag === tag)) return null

  const tagged = couponsWithTag(coupons, tag)
  const slice = paginate(tagged, page)
  if (page > slice.pageCount) return null

  return {
    tag,
    page,
    slice,
    lowest: lowestPrice(tagged),
    updated: latestUpdate(coupons),
    allTags,
  }
}

export function tagMetadata(data: TagData | null): Metadata {
  if (!data) return { robots: { index: false } }

  const { tag, page, slice, lowest } = data
  const suffix = page > 1 ? `（第 ${page} 頁）` : ''
  const from = lowest != null ? `，$${lowest} 起` : ''
  const canonical = tagHref(tag, page)

  return {
    title: { absolute: `必勝客${tag}優惠券 ${currentMonthLabel()}｜${slice.total} 組優惠代碼${from}${suffix}` },
    description: `整理必勝客（Pizza Hut）${tag}相關的 ${slice.total} 組優惠代碼${
      lowest != null ? `，最低 $${lowest}` : ''
    }，依價格由低到高排列，點選即可帶入代碼訂餐。`,
    alternates: { canonical },
    openGraph: { url: canonical },
  }
}

export function TagListing({ data }: { data: TagData }) {
  const { tag, page, slice, lowest, updated, allTags } = data
  const query = { ...DEFAULT_QUERY, tags: normalizeFacets([tag]) }

  return (
    <main className="container">
      <JsonLd
        coupons={slice.items}
        path={tagHref(tag, page)}
        name={`必勝客${tag}優惠券`}
        dateModified={updated}
      />

      <section className="hero">
        <div className="hero-top">
          <nav className="breadcrumb" aria-label="麵包屑">
            <Link href="/">必勝客折價券大全</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{tag}</span>
          </nav>
          <ThemeSwitcher />
        </div>

        <h1>必勝客{tag}優惠券</h1>
        <p className="subtitle">
          目前共有 {slice.total} 組含「{tag}」的必勝客優惠代碼
          {lowest != null && <>，最低 ${lowest} 起</>}
          ，依價格由低到高排列。點「跳轉訂餐」會直接帶入代碼開啟官網訂餐頁。
        </p>

        <div className="tag-page-meta">
          <div className="pill">
            優惠數 <span>{slice.total}</span>
          </div>
          {lowest != null && (
            <div className="pill">
              最低價 <span>${lowest}</span>
            </div>
          )}
          <Link className="tag-page-filter" href={couponHref(query)} rel="nofollow">
            在完整列表搭配其他條件篩選 →
          </Link>
        </div>

        {updated && (
          <p className="status">
            資料更新：<time dateTime={updated.toISOString()}>{formatUpdateDate(updated)}</time>
          </p>
        )}
      </section>

      <section>
        <CouponGrid query={query} coupons={slice.items} />
        <Pagination
          page={slice.page}
          pageCount={slice.pageCount}
          hrefFor={(n) => tagHref(tag, n)}
        />
        {slice.pageCount > 1 && (
          <p className="result-summary">
            共 {slice.total} 筆，第 {slice.page} / {slice.pageCount} 頁
          </p>
        )}
      </section>

      <SiteFooter tags={allTags} updated={updated} currentTag={tag} />
    </main>
  )
}
