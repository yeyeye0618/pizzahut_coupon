'use client'

import { useEffect, useRef, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CouponQuery, couponHref, withQuery } from '@/lib/coupons'

const DEBOUNCE_MS = 300

/**
 * The form is a plain GET form, so searching still works without JS. With JS the
 * keystrokes are debounced into a router.push instead of a full submit.
 *
 * The input is uncontrolled: the URL is the source of truth, and React state
 * for the half-typed value would only duplicate what the DOM already holds.
 */
export function SearchBox({ query }: { query: CouponQuery }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Re-sync the field when the keyword in the URL changes from somewhere else
  // (back button, a shared link). While typing the URL has not changed yet, so
  // this cannot overwrite what the user is in the middle of entering.
  useEffect(() => {
    const input = inputRef.current
    if (input && input.value !== query.q) {
      input.value = query.q
    }
  }, [query.q])

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current)
  }, [])

  const handleChange = (value: string) => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      startTransition(() => {
        router.push(couponHref(withQuery(query, { q: value })))
      })
    }, DEBOUNCE_MS)
  }

  return (
    <form className="search-form" action="/" method="get">
      {query.tags.length > 0 && <input type="hidden" name="tags" value={query.tags.join(',')} />}
      {query.mode !== 'union' && <input type="hidden" name="mode" value={query.mode} />}
      {query.sort !== 'price-asc' && <input type="hidden" name="sort" value={query.sort} />}
      <label className="search-box" htmlFor="search-input">
        <span className="search-icon" aria-hidden="true" />
        <input
          ref={inputRef}
          id="search-input"
          name="q"
          type="search"
          placeholder="搜尋代碼或優惠內容..."
          defaultValue={query.q}
          onChange={(event) => handleChange(event.target.value)}
          data-pending={isPending ? 'true' : undefined}
        />
      </label>
      <button type="submit" className="sr-only">
        搜尋
      </button>
    </form>
  )
}
