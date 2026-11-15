'use client'

import { useEffect, useRef, useTransition, type ChangeEvent, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { CouponQuery, couponHref, withQuery } from '@/lib/coupons'

const DEBOUNCE_MS = 300

/**
 * Shown under an empty, focused field. A curated list of things that appear in
 * many descriptions and that the tag filters do not already cover; it is not a
 * measure of what people actually search for.
 */
const SUGGESTED_TERMS = ['腿排', 'QQ球', '可樂', '芝心', '濃湯', '蝦', '筆管麵']

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

  const cancelPending = () => {
    if (timer.current) clearTimeout(timer.current)
  }

  const searchNow = (value: string) => {
    cancelPending()
    startTransition(() => {
      router.push(couponHref(withQuery(query, { q: value.trim() })))
    })
  }

  const searchSoon = (value: string) => {
    cancelPending()
    timer.current = setTimeout(() => searchNow(value), DEBOUNCE_MS)
  }

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    // While an IME is composing (注音 picking a character) the field holds
    // half-typed phonetics. Searching on those is noise; wait for the commit.
    if ((event.nativeEvent as InputEvent).isComposing) return
    searchSoon(event.target.value)
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    searchNow(inputRef.current?.value ?? '')
  }

  const clear = () => {
    const input = inputRef.current
    if (!input) return
    input.value = ''
    input.focus()
    searchSoon('')
  }

  const pickTerm = (term: string) => {
    const input = inputRef.current
    if (!input) return
    input.value = term
    // Dropping focus closes the suggestions so the results are not covered.
    input.blur()
    searchNow(term)
  }

  return (
    <form className="search-form" action="/" method="get" role="search" onSubmit={handleSubmit}>
      {query.tags.length > 0 && <input type="hidden" name="tags" value={query.tags.join(',')} />}
      {query.mode !== 'union' && <input type="hidden" name="mode" value={query.mode} />}
      {query.sort !== 'price-asc' && <input type="hidden" name="sort" value={query.sort} />}
      <div className="search-field">
        <svg
          className="search-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="6.5" />
          <path d="m16 16 4.5 4.5" />
        </svg>
        <input
          ref={inputRef}
          className="search-input"
          name="q"
          type="search"
          enterKeyHint="search"
          autoComplete="off"
          aria-label="搜尋折價券"
          placeholder="搜尋代碼或優惠內容"
          defaultValue={query.q}
          onChange={handleChange}
          onCompositionEnd={(event) => searchSoon(event.currentTarget.value)}
          data-pending={isPending ? 'true' : undefined}
        />
        <button type="button" className="search-clear" aria-label="清除搜尋" onClick={clear}>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
      </div>

      <div className="search-suggest">
        <p className="search-suggest-title">不知道找什麼？試試這些</p>
        <div className="search-chips" role="group" aria-label="建議關鍵字">
          {SUGGESTED_TERMS.map((term) => (
            <button
              key={term}
              type="button"
              className="search-chip"
              // Keep focus in the field on press, or the panel would close
              // before the click that follows could land on the chip.
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => pickTerm(term)}
            >
              {term}
            </button>
          ))}
        </div>
        <p className="search-suggest-foot">
          也可以直接輸入優惠代碼，例如 <span>16010</span>
        </p>
      </div>

      <button type="submit" className="sr-only">
        搜尋
      </button>
    </form>
  )
}
