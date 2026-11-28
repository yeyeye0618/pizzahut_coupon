import { FavoriteButton } from './FavoriteButton'
import { HighlightedText } from './HighlightedText'
import { formatOrderLink } from '@/lib/coupon-utils'
import { couponFacets } from '@/lib/facets'
import { Coupon } from '@/lib/supabase'
import Link from 'next/link'
import { PAGE_SIZE, couponPath, discountOf } from '@/lib/coupons'

interface CouponCardProps {
  coupon: Coupon
  keyword: string
  index: number
}

/**
 * Descriptions shorter than this always fit inside the 4-line clamp, so they
 * get no toggle. Measured against the data: the shortest description is 35
 * characters and the median is 147.
 */
const CLAMP_THRESHOLD = 80

const PRICE_PATTERN = /(價格：\$\d+(?:~\$\d+)?)/g

/** "(2選1)", "{3選1}", "(副食3選1)" at the end of an item becomes a badge. */
const CHOICE_SUFFIX = /\s*[(（{｛]([^()（）{}｛｝]*?\d+選\d+)[)）}｝]\s*$/

export function Description({ text, keyword }: { text: string; keyword: string }) {
  const paragraphs = text.split('。').filter(Boolean)

  return (
    <>
      {paragraphs.map((paragraph, i) => (
        <span key={i}>
          {paragraph.split(PRICE_PATTERN).map((segment, j) =>
            // Odd indices are the captured price labels.
            j % 2 === 1 ? (
              <span key={j} className="price-highlight">
                {segment}
              </span>
            ) : (
              <HighlightedText key={j} text={segment} keyword={keyword} />
            )
          )}
          {i < paragraphs.length - 1 && (
            <>
              <br />
              <br />
            </>
          )}
        </span>
      ))}
    </>
  )
}

export function ItemList({ items, keyword }: { items: string[]; keyword: string }) {
  return (
    <ul className="item-list">
      {items.map((item, i) => {
        const choice = item.match(CHOICE_SUFFIX)
        const text = choice ? item.slice(0, choice.index) : item
        return (
          <li key={i}>
            <span className="item-text">
              <HighlightedText text={text} keyword={keyword} />
            </span>
            {choice && <span className="item-choice">{choice[1]}</span>}
          </li>
        )
      })}
    </ul>
  )
}

/** The old layout: the whole description, clamped, with a CSS-only toggle. */
function ClampedDescription({ coupon, text, keyword }: { coupon: Coupon; text: string; keyword: string }) {
  const toggleId = `desc-${coupon.coupon_num}`
  const expandable = text.length > CLAMP_THRESHOLD

  return (
    <div className="description-wrap">
      {expandable && <input type="checkbox" id={toggleId} className="description-check" />}
      <p className="description">
        <span className={`description-text${expandable ? ' is-clampable' : ''}`}>
          <Description text={text} keyword={keyword} />
        </span>
      </p>
      {expandable && (
        <label className="description-toggle" htmlFor={toggleId}>
          <span className="toggle-more">顯示更多</span>
          <span className="toggle-less">顯示更少</span>
        </label>
      )}
    </div>
  )
}

/**
 * Server component. When coupon_fetch has parsed the coupon (name, items,
 * 最高價值) it is laid out as a title, an item list and a price row, with the
 * original text one click away. Coupons it has not reached yet keep the old
 * clamped-description layout, so the card never shows less than before.
 */
export function CouponCard({ coupon, keyword, index }: CouponCardProps) {
  const description = (coupon.description ?? '').trim() || '暫無說明'
  const tags = couponFacets(coupon)
  const items = coupon.items?.filter(Boolean) ?? []
  const structured = items.length > 0
  const discount = discountOf(coupon)
  const showValue =
    coupon.original_price != null && coupon.price != null && coupon.original_price > coupon.price

  return (
    <article
      className="coupon-card"
      // Stagger is per page of cards, not per absolute position, so the last
      // card of a long list is not delayed by half a minute.
      style={{ '--i': index % PAGE_SIZE } as React.CSSProperties}
    >
      <div className="card-head">
        <h3 className="card-title">
          {/* Followable link to the coupon's own page: how crawlers reach /coupon/*. */}
          <Link className="card-title-link" href={couponPath(coupon.coupon_num)} prefetch={false}>
            <span className="code">
              <HighlightedText text={coupon.coupon_num} keyword={keyword} />
            </span>
            {coupon.name && (
              <span className="coupon-name">
                <HighlightedText text={coupon.name} keyword={keyword} />
              </span>
            )}
          </Link>
        </h3>
        <FavoriteButton code={coupon.coupon_num} />
      </div>

      {tags.length > 0 && (
        <div className="tags-row" aria-label="優惠標籤">
          <div className="tags-list">
            {tags.map((tag) => (
              <span key={tag} className="tags-item">
                <HighlightedText text={tag} keyword={keyword} />
              </span>
            ))}
          </div>
        </div>
      )}

      {structured ? (
        <ItemList items={items} keyword={keyword} />
      ) : (
        <ClampedDescription coupon={coupon} text={description} keyword={keyword} />
      )}

      {structured && (
        <div className="price-row">
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
      )}

      {structured && (
        <details className="full-desc">
          <summary>完整說明</summary>
          <p className="full-desc-text">
            <Description text={description} keyword={keyword} />
          </p>
        </details>
      )}

      <a
        className="copy-btn"
        data-tour="order"
        href={formatOrderLink(coupon.coupon_num)}
        target="_blank"
        rel="noopener noreferrer nofollow"
      >
        跳轉訂餐
      </a>
    </article>
  )
}
