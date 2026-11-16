'use client'

import { useSyncExternalStore } from 'react'
import { THEME_STORAGE_KEY, Theme, isTheme } from '@/lib/theme'

const OPTIONS: { value: Theme; label: string }[] = [
  { value: 'dark', label: '深色' },
  { value: 'light', label: '淺色' },
  { value: 'system', label: '系統' },
]

// <html data-theme> is the single source of truth: the inline script in
// layout.tsx sets it before paint, and this component only reads and writes it.
const listeners = new Set<() => void>()

function subscribe(listener: () => void) {
  listeners.add(listener)
  // Another tab changed the theme.
  const onStorage = (event: StorageEvent) => {
    if (event.key === THEME_STORAGE_KEY) {
      applyTheme(isTheme(event.newValue) ? event.newValue : 'dark', false)
    }
  }
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', onStorage)
  }
}

function getSnapshot(): Theme {
  const value = document.documentElement.dataset.theme
  return isTheme(value) ? value : 'dark'
}

// The server cannot know the stored choice, so nothing is checked until hydration.
function getServerSnapshot(): Theme | null {
  return null
}

function applyTheme(theme: Theme, persist: boolean) {
  document.documentElement.dataset.theme = theme
  if (persist) {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme)
    } catch {
      // Private mode or blocked storage: the choice still holds for this page.
    }
  }
  listeners.forEach((listener) => listener())
}

export function ThemeSwitcher() {
  const current = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  return (
    <fieldset className="theme-switch">
      <legend className="sr-only">配色</legend>
      {OPTIONS.map((option) => (
        <label key={option.value} className="theme-option">
          <input
            type="radio"
            name="theme"
            value={option.value}
            checked={current === option.value}
            onChange={() => applyTheme(option.value, true)}
          />
          <span>{option.label}</span>
        </label>
      ))}
    </fieldset>
  )
}
