'use client'

import { useOptimistic } from 'react'
import { CouponQuery, couponHref, toggleTag } from '@/lib/coupons'
import type { FacetCount, FacetGroup } from '@/lib/facets'
import { NavLink } from './NavLink'
import { SortSelect } from './SortSelect'

type TagFiltersProps = {
  query: CouponQuery
  facets: Record<FacetGroup, FacetCount[]>
}

const GROUPS: { group: FacetGroup; label: string; hint: string }[] = [
  { group: 'size', label: '尺寸', hint: '多選：任一種尺寸' },
  { group: 'content', label: '內容', hint: '多選：同一張券都吃得到' },
]

/**
 * Size and contents filters (lib/facets.ts decides what each means), plus sort.
 *
 * The selection is painted optimistically: the chip you clicked turns on
 * immediately and reverts on its own if the navigation fails, instead of
 * waiting out the server round trip looking like nothing happened.
 *
 * rel="nofollow" is deliberate: ?tags= combinations are a user-facing slice,
 * not a canonical listing. The indexable tag pages live at /tag/[tag].
 */
export function TagFilters({ query, facets }: TagFiltersProps) {
  const [optimistic, setOptimistic] = useOptimistic(query)

  return (
    <div className="filter-head">
      <div className="facet-groups">
        {GROUPS.map(({ group, label, hint }) =>
          facets[group].length ? (
            <div key={group} className="facet-row" role="group" aria-label={`${label}（${hint}）`}>
              <span className="facet-label">{label}</span>
              <div className="tags-filter-list">
                {facets[group].map(({ tag, count }) => {
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
              <span className="facet-hint">{hint}</span>
            </div>
          ) : null
        )}
      </div>

      <div className="filter-tools">
        <SortSelect query={query} />
      </div>
    </div>
  )
}
