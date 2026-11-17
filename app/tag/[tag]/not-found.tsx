import Link from 'next/link'
import { SITE_NAME } from '@/lib/site'

/**
 * An unknown tag, or a page number past the end (a tag's page count shrinks
 * when its coupons expire). Having this boundary in the route makes Vercel
 * answer such URLs with 404 instead of 500, so search engines drop them.
 */
export default function TagNotFound() {
  return (
    <main className="container">
      <section className="hero">
        <div className="hero-top">
          <nav className="breadcrumb" aria-label="麵包屑">
            <Link href="/">{SITE_NAME}</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">找不到頁面</span>
          </nav>
        </div>
        <h1>找不到這個分類頁</h1>
        <p className="subtitle">
          這個分類或頁碼目前沒有優惠，通常是優惠到期後數量變少、頁數跟著減少。
        </p>
        <p className="guide-cta">
          <Link href="/">看目前可用的優惠 →</Link>
        </p>
      </section>
    </main>
  )
}
