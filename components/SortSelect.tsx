'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { CouponQuery, SortMode, couponHref, withQuery } from '@/lib/coupons'

export function SortSelect({ query }: { query: CouponQuery }) {
  const router = useRouter()
  const [, startTransition] = useTransition()

  return (
    <form className="sort-control" action="/" method="get">
      {query.q && <input type="hidden" name="q" value={query.q} />}
      {query.tags.length > 0 && <input type="hidden" name="tags" value={query.tags.join(',')} />}
      {query.mode !== 'union' && <input type="hidden" name="mode" value={query.mode} />}
      <label htmlFor="sort-select">排序</label>
      <select
        id="sort-select"
        name="sort"
        value={query.sort}
        onChange={(event) => {
          const sort = event.target.value as SortMode
          startTransition(() => {
            router.push(couponHref(withQuery(query, { sort })))
          })
        }}
      >
        <option value="price-asc">價格低 → 高</option>
        <option value="price-desc">價格高 → 低</option>
      </select>
      <button type="submit" className="sr-only">
        套用排序
      </button>
    </form>
  )
}
