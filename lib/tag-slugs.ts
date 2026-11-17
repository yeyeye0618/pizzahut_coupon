/**
 * The URL slug of each tag coupon_fetch's tag_extractor can write. Tag URLs
 * are ASCII because on Vercel a non-ASCII path that renders on demand (not
 * built at deploy) answers 500, so a new page number or a bad one broke.
 * next.config.ts redirects the old /tag/比薩 URLs here.
 *
 * A tag missing from this map gets no landing page until it is added here.
 * Kept free of imports: next.config.ts reads it too.
 */
export const TAG_SLUGS: Readonly<Record<string, string>> = {
  比薩: 'pizza',
  '6吋': '6-inch',
  '9吋': '9-inch',
  '13吋': '13-inch',
  個人比薩: 'personal-pizza',
  配餐: 'sides',
  飲料: 'drinks',
  玉米濃湯: 'corn-soup',
}

export const TAGS_BY_SLUG: ReadonlyMap<string, string> = new Map(
  Object.entries(TAG_SLUGS).map(([tag, slug]) => [slug, tag])
)
