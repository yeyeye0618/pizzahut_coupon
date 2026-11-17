import { timingSafeEqual } from 'node:crypto'
import { revalidateTag } from 'next/cache'
import { COUPONS_CACHE_TAG } from '@/lib/coupons'

/**
 * Called by coupon_fetch at the end of each cycle so the site picks up new
 * data right away instead of within the hourly revalidate window.
 *
 *   POST /api/revalidate
 *   Authorization: Bearer <REVALIDATE_SECRET>
 *
 * Expires the `coupons` data cache, which every page (listing, tag pages,
 * sitemap) reads through getCoupons(); they regenerate on their next request.
 */
export async function POST(request: Request) {
  const secret = process.env.REVALIDATE_SECRET
  if (!secret) {
    // Not configured: refuse rather than leave an open cache-busting endpoint.
    return Response.json({ ok: false, error: 'not configured' }, { status: 503 })
  }

  const header = request.headers.get('authorization') ?? ''
  const given = header.startsWith('Bearer ') ? header.slice('Bearer '.length) : ''
  if (!safeEqual(given, secret)) {
    return Response.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }

  // { expire: 0 }: an external system is telling us the data changed, so the
  // next request must not be served the old copy.
  revalidateTag(COUPONS_CACHE_TAG, { expire: 0 })
  return Response.json({ ok: true, revalidated: COUPONS_CACHE_TAG, at: new Date().toISOString() })
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a)
  const right = Buffer.from(b)
  return left.length === right.length && timingSafeEqual(left, right)
}
