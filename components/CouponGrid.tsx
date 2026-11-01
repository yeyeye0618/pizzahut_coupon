import { Coupon } from '@/lib/supabase'
import { CouponCard } from './CouponCard'

/**
 * Server component: every card in the current page is real markup in the HTML
 * response, which is what crawlers (and users without JS) actually read.
 */
export function CouponGrid({ coupons, keyword }: { coupons: Coupon[]; keyword: string }) {
  if (!coupons.length) {
    return <div className="empty">找不到符合條件的折價券，試試看不同關鍵字。</div>
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
