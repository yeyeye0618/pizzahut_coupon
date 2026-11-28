'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

/*
 * A step-by-step tour of the home page: each step dims the page, lights up one
 * control (found by its data-tour attribute) and explains it in a popover.
 * It opens by itself on a visitor's first visit and from the 導覽 button.
 */

type Step = { target: string; title: string; body: string }

const STEPS: Step[] = [
  {
    target: 'search',
    title: '搜尋優惠',
    body: '輸入代碼或想吃的品項，例如「腿排」「可樂」，結果會即時更新。',
  },
  {
    target: 'fav-view',
    title: '只看最愛',
    body: '點這裡只顯示你收藏的優惠。收藏存在這台裝置的瀏覽器，不用登入。',
  },
  {
    target: 'filters',
    title: '依尺寸、內容篩選',
    body: '尺寸選多個，哪一種都可以；內容選多個，代表同一張券都吃得到。像「雞軟骨或可樂（2選1）」只能挑一樣，不會被當成兩樣都有。',
  },
  {
    target: 'sort',
    title: '排序',
    body: '可以依價格排，或選「折扣最多」把最划算的排在前面。',
  },
  {
    target: 'fav',
    title: '收藏優惠',
    body: '點星號把這張優惠加入最愛，之後在「最愛」裡就找得到。',
  },
  {
    target: 'order',
    title: '跳轉訂餐',
    body: '直接開啟必勝客官網的訂餐頁，並自動帶入這組代碼。',
  },
  {
    target: 'help',
    title: '隨時再看',
    body: '想再看一次導覽，或查常見問題，都在這裡。',
  },
]

const SEEN_KEY = 'pizzahut-tour-seen'
const OPEN_EVENT = 'pizzahut:open-tour'
const GAP = 12
const EDGE = 16
const PAD = 6

function targetOf(step: Step): HTMLElement | null {
  return document.querySelector<HTMLElement>(`[data-tour="${step.target}"]`)
}

function markSeen() {
  try {
    localStorage.setItem(SEEN_KEY, '1')
  } catch {
    // Blocked storage: the tour may show again next visit, nothing worse.
  }
}

function hasSeen(): boolean {
  try {
    return localStorage.getItem(SEEN_KEY) === '1'
  } catch {
    // Unknown, so don't risk nagging every visit.
    return true
  }
}

export function TourButton() {
  return (
    <button
      type="button"
      className="site-nav-link"
      onClick={() => window.dispatchEvent(new Event(OPEN_EVENT))}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="m15.5 8.5-2 5-5 2 2-5z" />
      </svg>
      導覽
    </button>
  )
}

type Rect = { top: number; left: number; width: number; height: number }

export function Tour({ autoStart }: { autoStart: boolean }) {
  const [steps, setSteps] = useState<Step[] | null>(null)
  const [index, setIndex] = useState(0)
  const [rect, setRect] = useState<Rect | null>(null)
  const [popSize, setPopSize] = useState({ width: 0, height: 0 })
  const popRef = useRef<HTMLDivElement>(null)
  const nextRef = useRef<HTMLButtonElement>(null)
  const returnFocus = useRef<HTMLElement | null>(null)

  const start = useCallback(() => {
    // Skip steps whose control isn't on the page, e.g. no cards to point at.
    const present = STEPS.filter((step) => targetOf(step))
    if (!present.length) return
    returnFocus.current = document.activeElement as HTMLElement | null
    markSeen()
    setIndex(0)
    setRect(null)
    setSteps(present)
  }, [])

  // Changing step hides the spotlight until the next control is in place.
  const goTo = useCallback((next: number) => {
    setRect(null)
    setIndex(next)
  }, [])

  const close = useCallback(() => {
    setSteps(null)
    setRect(null)
    returnFocus.current?.focus?.()
  }, [])

  useEffect(() => {
    window.addEventListener(OPEN_EVENT, start)
    return () => window.removeEventListener(OPEN_EVENT, start)
  }, [start])

  useEffect(() => {
    if (!autoStart || hasSeen()) return
    const timer = window.setTimeout(start, 700)
    return () => window.clearTimeout(timer)
  }, [autoStart, start])

  const step = steps?.[index]

  // Each step: hide the spotlight, scroll the control into view, wait until it
  // stops moving, then show the spotlight and popover there in one go. (They
  // used to slide along with the scroll and trailed behind the control.)
  useEffect(() => {
    if (!step) return
    const element = targetOf(step)
    if (!element) return
    const read = (): Rect => {
      const r = element.getBoundingClientRect()
      return { top: r.top, left: r.left, width: r.width, height: r.height }
    }

    let settled = false
    let timer = 0
    const show = (r: Rect) => {
      settled = true
      setRect(r)
    }

    const start = read()
    const vh = window.innerHeight
    const margin = 80
    const inView = start.top >= margin && start.top + start.height <= vh - margin
    if (!inView) {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      // Vertical only: scrollIntoView would also scroll overflow-hidden
      // ancestors sideways.
      window.scrollTo({
        top: window.scrollY + start.top - Math.max(margin, (vh - start.height) / 2),
        behavior: reduce ? 'auto' : 'smooth',
      })
    }
    // Wait until the control holds still: covers the smooth scroll and the
    // page's entrance animation, which is still running on a first visit.
    let last = start
    let still = 0
    let waited = 0
    const poll = () => {
      const now = read()
      still = now.top === last.top && now.left === last.left && now.width === last.width ? still + 1 : 0
      last = now
      waited += 40
      if (still >= 2 || waited >= 1500) show(now)
      else timer = window.setTimeout(poll, 40)
    }
    timer = window.setTimeout(poll, 40)

    // After that, follow the control: at once on scroll and resize, and on a
    // slow check for layout shifts nothing announces (a web font swapping in
    // on a first visit nudges the buttons).
    const follow = () => {
      if (settled) setRect(read())
    }
    const drift = window.setInterval(() => {
      if (!settled) return
      const now = read()
      setRect((prev) =>
        prev &&
        prev.top === now.top &&
        prev.left === now.left &&
        prev.width === now.width &&
        prev.height === now.height
          ? prev
          : now
      )
    }, 250)
    window.addEventListener('scroll', follow, { passive: true, capture: true })
    window.addEventListener('resize', follow)
    return () => {
      window.clearTimeout(timer)
      window.clearInterval(drift)
      window.removeEventListener('scroll', follow, { capture: true })
      window.removeEventListener('resize', follow)
    }
  }, [step])

  useLayoutEffect(() => {
    const pop = popRef.current
    if (!pop) return
    const { width, height } = pop.getBoundingClientRect()
    setPopSize((prev) => (prev.width === width && prev.height === height ? prev : { width, height }))
  }, [step, rect])

  const ready = rect !== null
  useEffect(() => {
    // Only once shown: a hidden popover can't take focus.
    if (steps && ready) nextRef.current?.focus({ preventScroll: true })
  }, [steps, index, ready])

  useEffect(() => {
    if (!steps) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
      else if (event.key === 'ArrowRight' && index < steps.length - 1) goTo(index + 1)
      else if (event.key === 'ArrowLeft' && index > 0) goTo(index - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [steps, index, close, goTo])

  if (!steps || !step) return null

  const last = index === steps.length - 1
  const vw = typeof window === 'undefined' ? 0 : window.innerWidth
  const vh = typeof window === 'undefined' ? 0 : window.innerHeight

  // Below the control if it fits, else above, else pinned to the bottom.
  let popStyle: React.CSSProperties = { visibility: 'hidden' }
  if (rect && popSize.height) {
    const below = rect.top + rect.height + PAD + GAP
    const above = rect.top - PAD - GAP - popSize.height
    const top =
      below + popSize.height <= vh - EDGE ? below : above >= EDGE ? above : vh - popSize.height - EDGE
    const centred = rect.left + rect.width / 2 - popSize.width / 2
    const left = Math.min(Math.max(centred, EDGE), Math.max(EDGE, vw - popSize.width - EDGE))
    popStyle = { top, left }
  }

  return createPortal(
    <div className="tour-layer">
      {/* No fade on the spotlight: its shadow is the dimming, so fading it
          would flash the page. It jumps straight to the next control. */}
      {rect ? (
        <div
          className="tour-spotlight"
          style={{
            top: rect.top - PAD,
            left: rect.left - PAD,
            width: rect.width + PAD * 2,
            height: rect.height + PAD * 2,
          }}
        />
      ) : (
        <div className="tour-dim" />
      )}
      <div
        key={index}
        ref={popRef}
        className="tour-pop"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-title"
        aria-describedby="tour-body"
        style={popStyle}
      >
        <button type="button" className="tour-close" aria-label="關閉導覽" onClick={close}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
        <h2 id="tour-title" className="tour-title">
          {step.title}
        </h2>
        <p id="tour-body" className="tour-body">
          {step.body}
        </p>
        <div className="tour-foot">
          <span className="tour-progress">
            {index + 1} / {steps.length}
          </span>
          <div className="tour-buttons">
            <button
              type="button"
              className="tour-btn"
              onClick={() => goTo(index - 1)}
              disabled={index === 0}
            >
              上一步
            </button>
            <button
              ref={nextRef}
              type="button"
              className="tour-btn primary"
              onClick={() => (last ? close() : goTo(index + 1))}
            >
              {last ? '完成' : '下一步'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
