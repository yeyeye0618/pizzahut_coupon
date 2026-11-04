import { CouponQuery } from '@/lib/coupons'
import { SearchBox } from './SearchBox'
import { TagFilters } from './TagFilters'

type CouponFiltersProps = {
  query: CouponQuery
  tags: { tag: string; count: number }[]
  total: number
  showing: number
  matched: number
}

/**
 * Server component. Filter state lives in the URL rather than in React state;
 * the controls themselves are anchors and GET forms, so they work without JS.
 */
export function CouponFilters({ query, tags, total, showing, matched }: CouponFiltersProps) {
  const hasFilter = Boolean(query.q) || query.tags.length > 0

  return (
    <section className="hero">
      <div className="hero-top">
        <div className="brand">
          <span className="brand-dot" />
          PIZZA HUT COUPON
        </div>
      </div>
      <h1>必勝客折價券大全</h1>
      <p className="subtitle">
        收錄台灣 Pizza Hut 最新優惠代碼，支援依口味、尺寸、配餐篩選，一鍵跳轉即可訂餐。
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
        <TagFilters query={query} tags={tags} />
      </div>

      <p className="status" aria-live="polite">
        {hasFilter ? `找到 ${matched} 筆符合條件的結果` : `已收錄 ${total} 筆最新優惠`}
      </p>
    </section>
  )
}
