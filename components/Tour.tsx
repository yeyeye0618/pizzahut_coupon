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
    setSteps(present)
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

  // Bring the step's control into view, then keep the spotlight on it while
  // the page scrolls or resizes.
  useEffect(() => {
    if (!step) return
    const element = targetOf(step)
    if (!element) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    element.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' })

    let frame = 0
    const measure = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const r = element.getBoundingClientRect()
        setRect({ top: r.top, left: r.left, width: r.width, height: r.height })
      })
    }
    measure()
    // Smooth scrolling moves the target after this first measurement.
    const settle = window.setTimeout(measure, 400)
    window.addEventListener('scroll', measure, { passive: true })
    window.addEventListener('resize', measure)
    return () => {
      cancelAnimationFrame(frame)
      window.clearTimeout(settle)
      window.removeEventListener('scroll', measure)
      window.removeEventListener('resize', measure)
    }
  }, [step])

  useLayoutEffect(() => {
    const pop = popRef.current
    if (!pop) return
    const { width, height } = pop.getBoundingClientRect()
    setPopSize((prev) => (prev.width === width && prev.height === height ? prev : { width, height }))
  }, [step, rect])

  useEffect(() => {
    if (steps) nextRef.current?.focus()
  }, [steps, index])

  useEffect(() => {
    if (!steps) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
      else if (event.key === 'ArrowRight') setIndex((i) => Math.min(i + 1, steps.length - 1))
      else if (event.key === 'ArrowLeft') setIndex((i) => Math.max(i - 1, 0))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [steps, close])

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
      {rect && (
        <div
          className="tour-spotlight"
          style={{
            top: rect.top - PAD,
            left: rect.left - PAD,
            width: rect.width + PAD * 2,
            height: rect.height + PAD * 2,
          }}
        />
      )}
      <div
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
              onClick={() => setIndex((i) => i - 1)}
              disabled={index === 0}
            >
              上一步
            </button>
            <button
              ref={nextRef}
              type="button"
              className="tour-btn primary"
              onClick={() => (last ? close() : setIndex((i) => i + 1))}
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
