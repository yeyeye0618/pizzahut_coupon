import { NavLink } from './NavLink'

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
export function Pagination({
  page,
  pageCount,
  hrefFor,
}: {
  page: number
  pageCount: number
  /** URL of a given page; the listing and the tag pages number pages differently. */
  hrefFor: (page: number) => string
}) {
  if (pageCount <= 1) return null

  const pages = pageNumbers(page, pageCount)

  return (
    <nav className="pagination" aria-label="分頁導覽">
      {page > 1 && (
        <NavLink className="page-link" href={hrefFor(page - 1)} rel="prev">
          上一頁
        </NavLink>
      )}

      {pages[0] > 1 && (
        <>
          <NavLink className="page-link" href={hrefFor(1)}>
            1
          </NavLink>
          {pages[0] > 2 && <span className="page-gap">…</span>}
        </>
      )}

      {pages.map((n) =>
        n === page ? (
          <span key={n} className="page-link active" aria-current="page">
            {n}
          </span>
        ) : (
          <NavLink key={n} className="page-link" href={hrefFor(n)}>
            {n}
          </NavLink>
        )
      )}

      {pages[pages.length - 1] < pageCount && (
        <>
          {pages[pages.length - 1] < pageCount - 1 && <span className="page-gap">…</span>}
          <NavLink className="page-link" href={hrefFor(pageCount)}>
            {pageCount}
          </NavLink>
        </>
      )}

      {page < pageCount && (
        <NavLink className="page-link" href={hrefFor(page + 1)} rel="next">
          下一頁
        </NavLink>
      )}
    </nav>
  )
}
