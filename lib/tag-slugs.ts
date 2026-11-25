/**
 * The URL slug of each filter in lib/facets.ts that gets a landing page. Tag
 * URLs are ASCII because on Vercel a non-ASCII path that renders on demand
 * (not built at deploy) answers 500.
 *
 * A filter missing from this map gets no landing page until it is added here.
 * Kept free of imports: next.config.ts reads it too.
 */
export const TAG_SLUGS: Readonly<Record<string, string>> = {
  '6吋': '6-inch',
  '9吋': '9-inch',
  '13吋': '13-inch',
  炸雞烤雞: 'chicken',
  雞軟骨: 'chicken-cartilage',
  薯金幣: 'potato',
  QQ球: 'qq-balls',
  芝心腸: 'cheese-sausage',
  海鮮點心: 'seafood',
  甜點: 'dessert',
  濃湯: 'soup',
  義大利麵: 'pasta',
  飲料: 'drinks',
}

export const TAGS_BY_SLUG: ReadonlyMap<string, string> = new Map(
  Object.entries(TAG_SLUGS).map(([tag, slug]) => [slug, tag])
)

/**
 * Landing pages that were retired, with the page that replaces each. Keys are
 * the old path segment, slug or Chinese tag; values are a slug or "" for "/".
 */
export const RETIRED_TAGS: Readonly<Record<string, string>> = {
  // /tag/<old slug>, live until the size/contents groups
  pizza: '',
  'personal-pizza': '6-inch',
  sides: '',
  'corn-soup': 'soup',
  // /tag/<中文>, the URLs before English slugs
  比薩: '',
  個人比薩: '6-inch',
  配餐: '',
  玉米濃湯: 'soup',
  '6吋': '6-inch',
  '9吋': '9-inch',
  '13吋': '13-inch',
  飲料: 'drinks',
}
