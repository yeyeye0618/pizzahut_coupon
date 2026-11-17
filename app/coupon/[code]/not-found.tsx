import Link from 'next/link'
import { SITE_NAME } from '@/lib/site'

/**
 * A code coupon_fetch no longer finds on Pizza Hut's site is deleted from the
 * table, so its page ends here: an honest 404 with a way back to live coupons,
 * rather than stale contents someone might try to order with.
 */
export default function CouponNotFound() {
  return (
    <main className="container">
      <section className="hero">
        <div className="hero-top">
          <nav className="breadcrumb" aria-label="麵包屑">
            <Link href="/">{SITE_NAME}</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">已下架</span>
          </nav>
        </div>
        <h1>這組優惠代碼已下架</h1>
        <p className="subtitle">
          必勝客官網已經查不到這組代碼，通常是活動結束或優惠調整。本站會定期回官網確認，失效的代碼會自動移除。
        </p>
        <p className="guide-cta">
          <Link href="/">看目前可用的優惠 →</Link>
        </p>
      </section>
    </main>
  )
}
