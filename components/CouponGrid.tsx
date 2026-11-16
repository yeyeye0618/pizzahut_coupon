import { CouponQuery } from '@/lib/coupons'
import { Coupon } from '@/lib/supabase'
import { CouponCard } from './CouponCard'

/**
 * Server component: every card in the current page is real markup in the HTML
 * response, which is what crawlers (and users without JS) actually read.
 */
export function CouponGrid({ query, coupons }: { query: CouponQuery; coupons: Coupon[] }) {
  const keyword = query.q

  if (!coupons.length) {
    // An empty favourites list is a first-time state, not a failed search.
    const noFavorites = query.fav !== null && query.fav.length === 0
    return (
      <div className="empty">
        {noFavorites
          ? '還沒有最愛的優惠券。點卡片代碼旁的星號，就能把它加進這裡。'
          : '找不到符合條件的折價券，試試看不同關鍵字。'}
      </div>
    )
  }

  return (
    <div className="grid">
      {coupons.map((coupon, index) => (
        <CouponCard
          key={coupon.coupon_num}
          coupon={coupon}
          keyword={keyword}
          index={index}
        />
      ))}
    </div>
  )
}
