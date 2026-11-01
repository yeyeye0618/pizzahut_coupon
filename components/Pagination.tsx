import Link from 'next/link'
import { CouponQuery, couponHref, withQuery } from '@/lib/coupons'

/** How many numbered links to show either side of the current page. */
const WINDOW = 2

function pageNumbers(page: number, pageCount: number): number[] {
  const start = Math.max(1, Math.min(page - WINDOW, pageCount - WINDOW * 2))
  const end = Math.min(pageCount, Math.max(page + WINDOW, WINDOW * 2 + 1))
  const pages: number[] = []
  for (let i = start; i <= end; i += 1) pages.push(i)
  return pages
}

/**
 * Real anchors, because crawlers follow links and not IntersectionObserver.
 * This is the only path by which coupons past the first page get indexed.
 */
export function Pagination({ query, page, pageCount }: { query: CouponQuery; page: number; pageCount: number }) {
  if (pageCount <= 1) return null

  const pages = pageNumbers(page, pageCount)

  return (
    <nav className="pagination" aria-label="分頁導覽">
      {page > 1 && (
        <Link className="page-link" href={couponHref(withQuery(query, { page: page - 1 }))} rel="prev">
          上一頁
        </Link>
      )}

      {pages[0] > 1 && (
        <>
          <Link className="page-link" href={couponHref(withQuery(query, { page: 1 }))}>
            1
          </Link>
          {pages[0] > 2 && <span className="page-gap">…</span>}
        </>
      )}

      {pages.map((n) =>
        n === page ? (
          <span key={n} className="page-link active" aria-current="page">
            {n}
          </span>
        ) : (
          <Link key={n} className="page-link" href={couponHref(withQuery(query, { page: n }))}>
            {n}
          </Link>
        )
      )}

      {pages[pages.length - 1] < pageCount && (
        <>
          {pages[pages.length - 1] < pageCount - 1 && <span className="page-gap">…</span>}
          <Link className="page-link" href={couponHref(withQuery(query, { page: pageCount }))}>
            {pageCount}
          </Link>
        </>
      )}

      {page < pageCount && (
        <Link className="page-link" href={couponHref(withQuery(query, { page: page + 1 }))} rel="next">
          下一頁
        </Link>
      )}
    </nav>
  )
}
