'use client'

import { useOptimistic } from 'react'
import { CouponQuery, MatchMode, couponHref, toggleTag, withQuery } from '@/lib/coupons'
import { NavLink } from './NavLink'
import { SortSelect } from './SortSelect'

type TagFiltersProps = {
  query: CouponQuery
  tags: { tag: string; count: number }[]
}

/**
 * Tag and match-mode controls.
 *
 * The selection is painted optimistically: the chip you clicked turns on
 * immediately and reverts on its own if the navigation fails, instead of
 * waiting out the server round trip looking like nothing happened. The grid
 * behind it still shows the previous results until the response lands, which
 * is why the chips also carry a pending state.
 *
 * rel="nofollow" is deliberate: ?tags= combinations are a user-facing slice,
 * not a canonical listing. The indexable tag pages arrive as /tag/[tag].
 */
export function TagFilters({ query, tags }: TagFiltersProps) {
  const [optimistic, setOptimistic] = useOptimistic(query)

  return (
    <div className="filter-head">
      <div className="tags-filter-list" aria-label="標籤篩選">
        {tags.map(({ tag, count }) => {
          const next = toggleTag(query, tag)
          const active = optimistic.tags.includes(tag)
          return (
            <NavLink
              key={tag}
              href={couponHref(next)}
              className={`filter-tag${active ? ' active' : ''}`}
              aria-pressed={active}
              rel="nofollow"
              onNavigate={() => setOptimistic(next)}
            >
              {tag}
              <span className="filter-tag-count">{count}</span>
            </NavLink>
          )
        })}
      </div>

      <div className="filter-tools">
        <div className="match-mode" role="group" aria-label="標籤篩選模式">
          {(['union', 'intersection'] as MatchMode[]).map((mode) => {
            const next = withQuery(query, { mode })
            const active = optimistic.mode === mode
            return (
              <NavLink
                key={mode}
                href={couponHref(next)}
                className={`mode-option${active ? ' active' : ''}`}
                aria-pressed={active}
                rel="nofollow"
                onNavigate={() => setOptimistic(next)}
              >
                {mode === 'union' ? 'OR' : 'AND'}
              </NavLink>
            )
          })}
        </div>

        <SortSelect query={query} />
      </div>
    </div>
  )
}
