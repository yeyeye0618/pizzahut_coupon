/**
 * Site-wide identity used by metadata, the sitemap, robots.txt and JSON-LD.
 * Point NEXT_PUBLIC_SITE_URL at the custom domain once it is live.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://pizzahutcoupon.vercel.app'
).replace(/\/+$/, '')

export const SITE_NAME = '必勝客折價券大全'

/** This site's source code. */
export const GITHUB_URL = 'https://github.com/yeyeye0618/pizzahut_coupon'

export const SITE_TITLE = '必勝客折價券大全｜Pizza Hut 優惠代碼查詢'

export const SITE_DESCRIPTION =
  '收錄台灣必勝客（Pizza Hut）折價券優惠代碼，可依比薩尺寸、套餐內容篩選，依價格或折扣排序，一鍵跳轉訂餐，持續更新最新優惠。'

export function absoluteUrl(path: string) {
  return new URL(path, `${SITE_URL}/`).toString()
}
