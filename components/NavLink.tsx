'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition, type MouseEvent, type ReactNode } from 'react'

type NavLinkProps = {
  href: string
  children: ReactNode
  className?: string
  /** Runs inside the navigation transition, for optimistic UI. */
  onNavigate?: () => void
  rel?: string
  'aria-pressed'?: boolean
  'aria-current'?: 'page'
}

/**
 * A link that navigates in a transition and reports that it is doing so.
 *
 * "/" is a dynamic route, so every filter click is a server render; from
 * Taiwan that round trip measures about 1.5s. Two things take the edge off:
 *
 * - prefetch is switched to `true` (a full prefetch, not the near-empty
 *   partial one a dynamic route gets by default) the moment the pointer
 *   arrives, so a click usually reads from the router cache. It is deliberately
 *   not prefetched on sight: that would fire a server render for every link on
 *   screen on every page view.
 * - while a navigation is in flight the link says so, so the UI can show
 *   something instead of looking stuck.
 *
 * It renders an ordinary <a href>, so crawlers and middle-click are unaffected.
 */
export function NavLink({ href, children, className, onNavigate, ...rest }: NavLinkProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [eager, setEager] = useState(false)

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    // Leave modified clicks to the browser: new tab, new window, download.
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) {
      return
    }
    event.preventDefault()
    startTransition(() => {
      onNavigate?.()
      router.push(href)
    })
  }

  const warm = () => setEager(true)

  return (
    <>
      <Link
        href={href}
        prefetch={eager}
        className={className}
        onClick={handleClick}
        onMouseEnter={warm}
        onFocus={warm}
        onTouchStart={warm}
        data-pending={isPending ? 'true' : undefined}
        {...rest}
      >
        {children}
      </Link>
      {isPending && <span className="nav-progress" aria-hidden="true" />}
    </>
  )
}
