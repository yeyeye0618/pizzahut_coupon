import { formatOrderLink } from '@/lib/coupon-utils'
import { Coupon } from '@/lib/supabase'
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL, absoluteUrl } from '@/lib/site'

type JsonLdProps = {
  coupons: Coupon[]
  /** Path of the page being rendered, e.g. "/" or "/?page=2". */
  path: string
  /** Page name; defaults to the site name. */
  name?: string
  /** When the coupon data last changed. */
  dateModified?: Date | null
}

/**
 * Structured data for the listing: the site itself, and the coupons on this
 * page as an ItemList of Offers. Google shows no coupon rich result, but the
 * markup still states plainly what each card is (a priced TWD offer with a
 * URL to redeem it).
 */
export function JsonLd({ coupons, path, name = SITE_NAME, dateModified }: JsonLdProps) {
  const pageUrl = absoluteUrl(path)

  const data = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        url: `${SITE_URL}/`,
        name: SITE_NAME,
        description: SITE_DESCRIPTION,
        inLanguage: 'zh-Hant-TW',
      },
      {
        '@type': 'CollectionPage',
        '@id': `${pageUrl}#page`,
        url: pageUrl,
        name,
        ...(dateModified && { dateModified: dateModified.toISOString() }),
        isPartOf: { '@id': `${SITE_URL}/#website` },
        inLanguage: 'zh-Hant-TW',
        mainEntity: {
          '@type': 'ItemList',
          numberOfItems: coupons.length,
          itemListElement: coupons.map((coupon, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            item: {
              '@type': 'Offer',
              name: coupon.name
                ? `${coupon.name}（必勝客優惠代碼 ${coupon.coupon_num}）`
                : `必勝客優惠代碼 ${coupon.coupon_num}`,
              description: coupon.description?.trim() || undefined,
              url: formatOrderLink(coupon.coupon_num),
              ...(coupon.price != null && { price: coupon.price, priceCurrency: 'TWD' }),
              seller: { '@type': 'Organization', name: 'Pizza Hut 必勝客' },
            },
          })),
        },
      },
    ],
  }

  return (
    <script
      type="application/ld+json"
      // "<" is escaped so a description can never close the script tag early.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  )
}
