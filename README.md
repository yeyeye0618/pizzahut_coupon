# 必勝客折價券大全 · Pizza Hut Coupon

**網站：<https://pizzahutcoupon.vercel.app/>**

收錄台灣必勝客（Pizza Hut）目前可用的優惠代碼，可依口味、尺寸、配餐篩選並依價格排序，一鍵跳轉官網訂餐。資料由 [coupon_fetch](https://github.com/yeyeye0618/coupon_fetch) 定期從官網抓取、存在 Supabase。

- [使用說明與常見問題](https://pizzahutcoupon.vercel.app/guide)
- 分類：[6吋](https://pizzahutcoupon.vercel.app/tag/6%E5%90%8B) · [9吋](https://pizzahutcoupon.vercel.app/tag/9%E5%90%8B) · [13吋](https://pizzahutcoupon.vercel.app/tag/13%E5%90%8B) · [配餐](https://pizzahutcoupon.vercel.app/tag/%E9%85%8D%E9%A4%90) · [飲料](https://pizzahutcoupon.vercel.app/tag/%E9%A3%B2%E6%96%99)

本站為非官方整理，優惠內容與使用規則以必勝客官網為準。

## Development

Next.js 16 (App Router), React 19, TypeScript. Requires Node.js 20+.

```bash
npm install
npm run dev
```

`.env.local`:

| Variable | Purpose |
|---|---|
| `SUPABASE_URL` | Supabase project URL (server only) |
| `SUPABASE_KEY` | Supabase key, read server-side only; never exposed to the browser |
| `NEXT_PUBLIC_SITE_URL` | Optional. Canonical site URL; defaults to `https://pizzahutcoupon.vercel.app` |
| `REVALIDATE_SECRET` | Optional. Enables `POST /api/revalidate` (see below) |

`npm run build` / `npm run start` / `npm run lint`.

## How data stays fresh

- All pages read coupons through one cached query tagged `coupons`, revalidated hourly.
- `/tag/*`, `/guide`, the sitemap and the share image are prerendered and refreshed on the same schedule.
- After each scrape, coupon_fetch calls `POST /api/revalidate` with `Authorization: Bearer $REVALIDATE_SECRET`, which expires the `coupons` cache so the site and its 「資料更新」 date update right away. Without the secret set, the endpoint answers 503 and the hourly refresh still applies.
