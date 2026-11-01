import { HighlightedText } from './HighlightedText'
import { normalizeTags, formatOrderLink } from '@/lib/coupon-utils'
import { Coupon } from '@/lib/supabase'
import { PAGE_SIZE } from '@/lib/coupons'

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

function Description({ text, keyword }: { text: string; keyword: string }) {
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

/**
 * Server component. The expand/collapse disclosure is a checkbox driven by CSS
 * so the card needs no client JS, no per-card resize listener, and causes no
 * layout shift after hydration.
 */
export function CouponCard({ coupon, keyword, index }: CouponCardProps) {
  const description = (coupon.description ?? '').trim() || '暫無說明'
  const tags = normalizeTags(coupon.tags)
  const toggleId = `desc-${coupon.coupon_num}`
  const expandable = description.length > CLAMP_THRESHOLD

  return (
    <article
      className="coupon-card"
      // Stagger is per page of cards, not per absolute position, so the last
      // card of a long list is not delayed by half a minute.
      style={{ '--i': index % PAGE_SIZE } as React.CSSProperties}
    >
      <div className="card-head">
        <span className="tag">優惠代碼</span>
        <h3 className="code">
          <HighlightedText text={coupon.coupon_num} keyword={keyword} />
        </h3>
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

      <div className="description-wrap">
        {expandable && (
          <input type="checkbox" id={toggleId} className="description-check" />
        )}
        <p className="description">
          <span className={`description-text${expandable ? ' is-clampable' : ''}`}>
            <Description text={description} keyword={keyword} />
          </span>
        </p>
        {expandable && (
          <label className="description-toggle" htmlFor={toggleId}>
            <span className="toggle-more">顯示更多</span>
            <span className="toggle-less">顯示更少</span>
          </label>
        )}
      </div>

      <a
        className="copy-btn"
        href={formatOrderLink(coupon.coupon_num)}
        target="_blank"
        rel="noopener noreferrer nofollow"
      >
        跳轉訂餐
      </a>
    </article>
  )
}
