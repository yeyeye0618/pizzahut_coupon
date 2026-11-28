import Link from 'next/link'
import { GITHUB_URL } from '@/lib/site'
import { ThemeSwitcher } from './ThemeSwitcher'
import { TourButton } from './Tour'

/**
 * The top-right corner of every page: FAQ, the guided tour (home only, where
 * the controls it points at live), the source on GitHub, and the theme.
 */
export function SiteNav({ tour = false }: { tour?: boolean }) {
  return (
    <div className="hero-actions">
      <nav className="site-nav" aria-label="網站選單" data-tour="help">
        <Link className="site-nav-link" href="/guide#faq" prefetch={false}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="9" />
            <path d="M9.6 9.3a2.5 2.5 0 0 1 4.8.9c0 1.7-2.4 2.1-2.4 3.6" />
            <path d="M12 17h.01" />
          </svg>
          常見問題
        </Link>
        {tour && <TourButton />}
        <a className="site-nav-link" href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
          <svg viewBox="0 0 24 24" aria-hidden="true" className="filled">
            <path d="M12 2.2a9.8 9.8 0 0 0-3.1 19.1c.5.1.7-.2.7-.5v-1.7c-2.7.6-3.3-1.3-3.3-1.3-.5-1.1-1.1-1.4-1.1-1.4-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.3 1.1 2.9.8.1-.6.3-1.1.6-1.3-2.2-.3-4.5-1.1-4.5-4.9 0-1.1.4-2 1-2.7-.1-.2-.4-1.2.1-2.6 0 0 .8-.3 2.7 1a9.4 9.4 0 0 1 4.9 0c1.9-1.3 2.7-1 2.7-1 .5 1.4.2 2.4.1 2.6.6.7 1 1.6 1 2.7 0 3.8-2.3 4.6-4.5 4.9.4.3.7.9.7 1.8v2.7c0 .3.2.6.7.5A9.8 9.8 0 0 0 12 2.2Z" />
          </svg>
          GitHub
        </a>
      </nav>
      <ThemeSwitcher />
    </div>
  )
}
