import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { CouponFilters } from '@/components/CouponFilters'
import { CouponGrid } from '@/components/CouponGrid'
import { JsonLd } from '@/components/JsonLd'
import { SITE_DESCRIPTION, SITE_TITLE } from '@/lib/site'
import { Pagination } from '@/components/Pagination'
import { SiteFooter } from '@/components/SiteFooter'
import {
  DEFAULT_QUERY,
  collectTags,
  couponHref,
  filterCoupons,
  getCoupons,
  isFilteredView,
  landingTags,
  latestUpdate,
  paginate,
  parseCouponQuery,
  sortCoupons,
  withQuery,
} from '@/lib/coupons'

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const query = parseCouponQuery(await searchParams)
  const filtered = isFilteredView(query)
  const suffix = query.page > 1 ? `（第 ${query.page} 頁）` : ''
  const canonical = filtered ? '/' : couponHref({ ...DEFAULT_QUERY, page: query.page })

  return {
    // absolute: the layout's "%s｜必勝客折價券大全" template would repeat the name.
    title: { absolute: `${SITE_TITLE}${suffix}` },
    description: SITE_DESCRIPTION,
    // A searched or tag-filtered view is a user-facing slice, not a listing we
    // want in the index; the paginated listing itself is indexable.
    robots: filtered ? { index: false, follow: true } : { index: true, follow: true },
    alternates: { canonical },
    openGraph: { url: canonical },
  }
}

export default async function HomePage({ searchParams }: PageProps) {
  const query = parseCouponQuery(await searchParams)
  const allCoupons = await getCoupons()

  const updated = latestUpdate(allCoupons)
  const matched = sortCoupons(filterCoupons(allCoupons, query), query.sort)
  const { items, total, page, pageCount } = paginate(matched, query.page)

  // A page number past the end is a dead URL, not the last page under a
  // different address.
  if (query.page > pageCount && matched.length > 0) {
    notFound()
  }

  return (
    <main className="container">
      {!isFilteredView(query) && (
        <JsonLd
          coupons={items}
          path={couponHref({ ...DEFAULT_QUERY, page })}
          dateModified={updated}
        />
      )}
      <CouponFilters
        query={query}
        tags={collectTags(allCoupons)}
        total={allCoupons.length}
        showing={items.length}
        matched={total}
        updated={updated}
      />

      <section>
        <CouponGrid query={query} coupons={items} />
        <Pagination
          page={page}
          pageCount={pageCount}
          hrefFor={(n) => couponHref(withQuery(query, { page: n }))}
        />
        {total > 0 && (
          <p className="result-summary">
            共 {total} 筆，第 {page} / {pageCount} 頁
          </p>
        )}
      </section>

      <SiteFooter tags={landingTags(allCoupons)} updated={updated} />
    </main>
  )
}
