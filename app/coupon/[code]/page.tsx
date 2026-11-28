import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CouponGrid } from '@/components/CouponGrid'
import { Description, ItemList } from '@/components/CouponCard'
import { FavoriteButton } from '@/components/FavoriteButton'
import { SiteFooter } from '@/components/SiteFooter'
import { SiteNav } from '@/components/SiteNav'
import { formatOrderLink } from '@/lib/coupon-utils'
import { couponFacets } from '@/lib/facets'
import {
  DEFAULT_QUERY,
  couponPath,
  discountOf,
  findCoupon,
  formatUpdateDate,
  getCoupons,
  landingTags,
  latestUpdate,
  relatedCoupons,
  tagHref,
} from '@/lib/coupons'
import { SITE_NAME, SITE_URL, absoluteUrl } from '@/lib/site'

// Every live coupon is prerendered at deploy and refreshed with the data
// cache. A coupon coupon_fetch adds later renders on its first request; one it
// removes (no longer on Pizza Hut's site) 404s on the next regeneration and
// drops out of the sitemap.
export const revalidate = 3600
export const dynamicParams = true

type Params = { code: string }
type PageProps = { params: Promise<Params> }

const CODE = /^[A-Za-z0-9_-]{1,32}$/

export async function generateStaticParams(): Promise<Params[]> {
  const coupons = await getCoupons()
  return coupons.map((coupon) => ({ code: coupon.coupon_num }))
}

async function load(params: Promise<Params>) {
  const { code } = await params
  if (!CODE.test(code)) return null
  const coupons = await getCoupons()
  const coupon = findCoupon(coupons, code)
  if (!coupon) return null
  return { coupon, coupons }
}

function pageTitle(code: string, name: string | null, price: number | null) {
  // Some names already carry the price ("番茄肉醬起司麵 $69 (原價$139)"); don't repeat it.
  const showPrice = price != null && !(name ?? '').includes(`$${price}`)
  return `必勝客優惠代碼 ${code}${name ? `｜${name}` : ''}${showPrice ? ` $${price}` : ''}`
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const data = await load(params)
  if (!data) return { title: { absolute: `優惠代碼已下架｜${SITE_NAME}` }, robots: { index: false } }

  const { coupon } = data
  const title = pageTitle(coupon.coupon_num, coupon.name, coupon.price)
  const items = coupon.items?.filter(Boolean) ?? []
  const contents = items.length ? items.join('、') : (coupon.description ?? '').slice(0, 80)
  const description = `${coupon.name ? `${coupon.name}：` : ''}${contents}${
    coupon.price != null ? `，優惠價 $${coupon.price}` : ''
  }。必勝客（Pizza Hut）優惠代碼 ${coupon.coupon_num}，一鍵帶入代碼訂餐。`.slice(0, 160)
  const path = couponPath(coupon.coupon_num)

  return {
    title: { absolute: `${title}｜${SITE_NAME}` },
    description,
    alternates: { canonical: path },
    openGraph: { url: path, title, description },
  }
}

export default async function CouponPage({ params }: PageProps) {
  const data = await load(params)
  if (!data) notFound()

  const { coupon, coupons } = data
  const code = coupon.coupon_num
  const tags = couponFacets(coupon)
  const landing = landingTags(coupons)
  const landingSet = new Set(landing.map(({ tag }) => tag))
  const primaryTag = tags.find((tag) => landingSet.has(tag))
  const items = coupon.items?.filter(Boolean) ?? []
  const description = (coupon.description ?? '').trim()
  const discount = discountOf(coupon)
  const showValue =
    coupon.original_price != null && coupon.price != null && coupon.original_price > coupon.price
  const related = relatedCoupons(coupons, coupon)
  const updated = latestUpdate(coupons)
  const path = couponPath(code)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Offer',
        '@id': `${absoluteUrl(path)}#offer`,
        name: coupon.name ? `${coupon.name}（必勝客優惠代碼 ${code}）` : `必勝客優惠代碼 ${code}`,
        description: description || undefined,
        url: formatOrderLink(code),
        ...(coupon.price != null && { price: coupon.price, priceCurrency: 'TWD' }),
        seller: { '@type': 'Organization', name: 'Pizza Hut 必勝客' },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: SITE_NAME, item: `${SITE_URL}/` },
          ...(primaryTag
            ? [{ '@type': 'ListItem', position: 2, name: `${primaryTag}優惠券`, item: absoluteUrl(tagHref(primaryTag)) }]
            : []),
          { '@type': 'ListItem', position: primaryTag ? 3 : 2, name: `優惠代碼 ${code}`, item: absoluteUrl(path) },
        ],
      },
    ],
  }

  return (
    <main className="container">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />

      <section className="hero coupon-hero">
        <div className="hero-top">
          <nav className="breadcrumb" aria-label="麵包屑">
            <Link href="/">{SITE_NAME}</Link>
            {primaryTag && (
              <>
                <span aria-hidden="true">/</span>
                <Link href={tagHref(primaryTag)}>{primaryTag}</Link>
              </>
            )}
            <span aria-hidden="true">/</span>
            <span aria-current="page">{code}</span>
          </nav>
          <SiteNav />
        </div>

        <div className="coupon-hero-head">
          <h1>
            <span className="coupon-h1-label">必勝客優惠代碼</span>
            <span className="code coupon-h1-code">{code}</span>
            {coupon.name && <span className="coupon-h1-name">{coupon.name}</span>}
          </h1>
          <FavoriteButton code={code} />
        </div>

        {tags.length > 0 && (
          <div className="tags-list coupon-page-tags" aria-label="優惠標籤">
            {tags.map((tag) =>
              landingSet.has(tag) ? (
                <Link key={tag} className="tags-item" href={tagHref(tag)}>
                  {tag}
                </Link>
              ) : (
                <span key={tag} className="tags-item">
                  {tag}
                </span>
              )
            )}
          </div>
        )}

        <div className="price-row coupon-page-price">
          {coupon.price != null ? (
            <span className="price-now">${coupon.price}</span>
          ) : (
            <span className="price-unknown">價格依官網</span>
          )}
          {showValue && (
            <span className="price-value">
              最高價值 <s>${coupon.original_price}</s>
            </span>
          )}
          {discount != null && <span className="discount-badge">{discount} 折</span>}
        </div>

        <h2 className="coupon-section-title">套餐內容</h2>
        {items.length > 0 ? (
          <ItemList items={items} keyword="" />
        ) : (
          <p className="full-desc-text">
            <Description text={description || '暫無說明'} keyword="" />
          </p>
        )}

        <a
          className="copy-btn coupon-order-cta"
          href={formatOrderLink(code)}
          target="_blank"
          rel="noopener noreferrer nofollow"
        >
          帶入代碼 {code} 前往訂餐
        </a>

        {items.length > 0 && description && (
          <details className="full-desc">
            <summary>完整說明與使用條件</summary>
            <p className="full-desc-text">
              <Description text={description} keyword="" />
            </p>
          </details>
        )}

        {updated && (
          <p className="status">
            資料更新：<time dateTime={updated.toISOString()}>{formatUpdateDate(updated)}</time>
          </p>
        )}
      </section>

      {related.length > 0 && (
        <section aria-labelledby="related-title">
          <h2 id="related-title" className="related-title">
            相似的必勝客優惠
          </h2>
          <CouponGrid query={DEFAULT_QUERY} coupons={related} />
        </section>
      )}

      <SiteFooter tags={landing} updated={updated} />
    </main>
  )
}
