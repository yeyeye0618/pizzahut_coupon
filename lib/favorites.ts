'use client'

import { useSyncExternalStore } from 'react'

/**
 * Favourite coupon codes, kept in this browser's localStorage so they survive
 * closing the tab or the browser. Newest first. There is no account, so they
 * do not follow the user to another device or browser.
 */
const STORAGE_KEY = 'favorite-coupons'

const EMPTY: readonly string[] = []
const listeners = new Set<() => void>()

// useSyncExternalStore needs the same array back until something changes, so
// the parsed value is cached against the raw string it came from.
let cachedRaw: string | null | undefined
let cachedList: readonly string[] = EMPTY

function read(): readonly string[] {
  let raw: string | null = null
  try {
    raw = localStorage.getItem(STORAGE_KEY)
  } catch {
    // Storage blocked: behave as if nothing is saved.
  }
  if (raw === cachedRaw) return cachedList

  cachedRaw = raw
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : []
    cachedList = Array.isArray(parsed)
      ? parsed.filter((code): code is string => typeof code === 'string')
      : EMPTY
  } catch {
    cachedList = EMPTY
  }
  return cachedList
}

function write(list: readonly string[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  } catch {
    // Private mode or full storage: the change is lost on reload, nothing more.
  }
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  // Another tab added or removed a favourite.
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY || event.key === null) listener()
  }
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', onStorage)
  }
}

export function getFavorites(): readonly string[] {
  return read()
}

export function toggleFavorite(code: string) {
  const list = read()
  write(list.includes(code) ? list.filter((c) => c !== code) : [code, ...list])
}

/**
 * The saved codes, or null during server rendering and hydration, when the
 * browser's list is not known yet. Render nothing list-dependent for null.
 */
export function useFavorites(): readonly string[] | null {
  return useSyncExternalStore(subscribe, read, () => null)
}
