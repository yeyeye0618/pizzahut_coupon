import { CouponQuery, formatUpdateDate } from '@/lib/coupons'
import type { FacetCount, FacetGroup } from '@/lib/facets'
import { SearchBox } from './SearchBox'
import { TagFilters } from './TagFilters'
import { ThemeSwitcher } from './ThemeSwitcher'

type CouponFiltersProps = {
  query: CouponQuery
  facets: Record<FacetGroup, FacetCount[]>
  total: number
  showing: number
  matched: number
  /** Newest updated_at in the data, shown so visitors can judge freshness. */
  updated: Date | null
}

/**
 * Server component. Filter state lives in the URL rather than in React state;
 * the controls themselves are anchors and GET forms, so they work without JS.
 */
export function CouponFilters({ query, facets, total, showing, matched, updated }: CouponFiltersProps) {
  const hasFilter = Boolean(query.q) || query.tags.length > 0

  return (
    <section className="hero">
      <div className="hero-top">
        <div className="brand">
          <span className="brand-dot" />
          PIZZA HUT COUPON
        </div>
        <ThemeSwitcher />
      </div>
      <h1>必勝客折價券大全</h1>
      <p className="subtitle">
        收錄台灣 Pizza Hut 最新優惠代碼，可依比薩尺寸和套餐內容篩選，一鍵跳轉即可訂餐。
      </p>

      <div className="controls">
        <SearchBox query={query} />
        <div className="pill">
          總數 <span>{total}</span>
        </div>
        <div className="pill">
          顯示中 <span>{showing}</span>
        </div>
      </div>

      <div className="filter-bar">
        <TagFilters query={query} facets={facets} />
      </div>

      <p className="status" aria-live="polite">
        {query.fav !== null
          ? `最愛：${matched} 筆${hasFilter ? '符合條件' : ''}`
          : hasFilter
            ? `找到 ${matched} 筆符合條件的結果`
            : `已收錄 ${total} 筆最新優惠`}
        {updated && (
          <>
            <span aria-hidden="true"> · </span>
            資料更新 <time dateTime={updated.toISOString()}>{formatUpdateDate(updated)}</time>
          </>
        )}
      </p>
    </section>
  )
}
