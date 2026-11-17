import Link from 'next/link'
import { SITE_NAME } from '@/lib/site'

export default function NotFound() {
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
        <h1>找不到這個頁面</h1>
        <p className="subtitle">網址可能打錯了，或這個頁面已經移除。</p>
        <p className="guide-cta">
          <Link href="/">看目前可用的優惠 →</Link>
        </p>
      </section>
    </main>
  )
}
