import Link from 'next/link'
import { formatUpdateDate, tagHref } from '@/lib/coupons'

type SiteFooterProps = {
  tags: { tag: string; count: number }[]
  updated: Date | null
  /** The tag page being shown, so it is not linked to itself. */
  currentTag?: string
}

/**
 * Plain, followable links to every tag landing page. The filter chips in the
 * hero are nofollow query links, so this is the path crawlers take from the
 * home page to /tag/*.
 */
export function SiteFooter({ tags, updated, currentTag }: SiteFooterProps) {
  return (
    <footer className="site-footer">
      <nav className="category-nav" aria-label="依分類瀏覽">
        <h2 className="category-nav-title">依分類瀏覽</h2>
        <ul className="category-list">
          {tags.map(({ tag, count }) => (
            <li key={tag}>
              {tag === currentTag ? (
                <span className="category-link is-current" aria-current="page">
                  {tag}優惠券 <span>{count}</span>
                </span>
              ) : (
                <Link className="category-link" href={tagHref(tag)} prefetch={false}>
                  {tag}優惠券 <span>{count}</span>
                </Link>
              )}
            </li>
          ))}
        </ul>
      </nav>

      <p className="footer-note">
        {updated && (
          <>
            資料更新：<time dateTime={updated.toISOString()}>{formatUpdateDate(updated)}</time>
            <span aria-hidden="true"> · </span>
          </>
        )}
        本站為非官方整理，優惠內容與使用規則以必勝客官網為準。
        <span aria-hidden="true"> · </span>
        <Link href="/guide" prefetch={false}>
          使用說明與常見問題
        </Link>
      </p>
    </footer>
  )
}
