import Link from 'next/link'
import { CouponQuery, couponHref, toggleTag, withQuery } from '@/lib/coupons'
import { SearchBox } from './SearchBox'
import { SortSelect } from './SortSelect'

type CouponFiltersProps = {
  query: CouponQuery
  tags: { tag: string; count: number }[]
  total: number
  showing: number
  matched: number
}

/**
 * Server component. Tag and match-mode controls are real anchors, so they work
 * without JS and the state lives in the URL instead of in React state.
 *
 * They carry rel="nofollow" on purpose: ?tags= combinations are a user-facing
 * slice, not a canonical listing. The indexable tag pages arrive as /tag/[tag].
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
        <div className="filter-head">
          <div className="tags-filter-list" aria-label="標籤篩選">
            {tags.map(({ tag, count }) => {
              const active = query.tags.includes(tag)
              return (
                <Link
                  key={tag}
                  href={couponHref(toggleTag(query, tag))}
                  className={`filter-tag${active ? ' active' : ''}`}
                  aria-pressed={active}
                  rel="nofollow"
                >
                  {tag}
                  <span className="filter-tag-count">{count}</span>
                </Link>
              )
            })}
          </div>

          <div className="filter-tools">
            <div className="match-mode" role="group" aria-label="標籤篩選模式">
              {(['union', 'intersection'] as const).map((mode) => (
                <Link
                  key={mode}
                  href={couponHref(withQuery(query, { mode }))}
                  className={`mode-option${query.mode === mode ? ' active' : ''}`}
                  aria-pressed={query.mode === mode}
                  rel="nofollow"
                >
                  {mode === 'union' ? 'OR' : 'AND'}
                </Link>
              ))}
            </div>

            <SortSelect query={query} />
          </div>
        </div>
      </div>

      <p className="status" aria-live="polite">
        {hasFilter ? `找到 ${matched} 筆符合條件的結果` : `已收錄 ${total} 筆最新優惠`}
      </p>
    </section>
  )
}
