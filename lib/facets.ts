import type { Coupon } from './supabase'

/*
 * The list page's filters, read from each coupon's parsed `items` lines.
 *
 * Two groups:
 * - 尺寸: picking several means "any of these" (a coupon is rarely two sizes).
 * - 內容: picking several means "all of these, in one order". A line such as
 *   「1份黃金雞軟骨或1罐可樂或1份薯金幣(3選1)」 is one slot: it gives 雞軟骨 *or*
 *   可樂, never both, so 雞軟骨 + 飲料 only matches when another line can supply
 *   the second one.
 * Between the groups it is "and": 9吋 + 飲料 is a 9吋 coupon with a drink.
 */

export type FacetGroup = 'size' | 'content'

const PIZZA_LINE = /比[薩蕯]|披薩|pizza/i
/** Flatzz is a thin flatbread, not one of the three crust sizes. */
const NOT_A_SIZE = /Flatzz|薄披薩/i

export const SIZE_FACETS: readonly (readonly [string, RegExp])[] = [
  ['6吋', /6吋|六吋|個人(鬆厚)?比[薩蕯]|個人鬆厚/],
  ['9吋', /9吋|九吋|小(鬆厚)?比[薩蕯]|鬆厚小/],
  ['13吋', /13吋|十三吋|大(鬆厚)?比[薩蕯]|鬆厚大/],
]

export const CONTENT_FACETS: readonly (readonly [string, RegExp])[] = [
  ['炸雞烤雞', /腿排|雞腿|雞柳|雞球|雞翅|烤雞|BBQ|雞塊/],
  ['雞軟骨', /雞軟骨/],
  ['薯金幣', /薯金幣|薯條|薯球/],
  ['QQ球', /QQ球/],
  ['芝心腸', /芝心腸/],
  ['海鮮點心', /鱈魚|蝦球|海陸|魷魚|甜不辣/],
  ['甜點', /起司塔|蛋塔|可頌|布朗尼|麻糬|甜心/],
  ['濃湯', /濃湯/],
  ['義大利麵', /麵|燉飯/],
  ['飲料', /可樂|七喜|雪碧|紅茶|綠茶|柚茶|飲料/],
]

const GROUP_OF = new Map<string, FacetGroup>([
  ...SIZE_FACETS.map(([name]) => [name, 'size'] as const),
  ...CONTENT_FACETS.map(([name]) => [name, 'content'] as const),
])

/** Old ?tags= values from shared links, mapped onto the current filters. */
const ALIASES: Record<string, string> = { 個人比薩: '6吋', 玉米濃湯: '濃湯' }

/** Known filter names from ?tags=, aliases resolved, unknown ones dropped. */
export function normalizeFacets(tags: string[]): string[] {
  const out = tags.map((tag) => ALIASES[tag] ?? tag).filter((tag) => GROUP_OF.has(tag))
  return [...new Set(out)]
}

export function facetGroup(name: string): FacetGroup | undefined {
  return GROUP_OF.get(name)
}

function itemLines(coupon: Coupon): string[] {
  return coupon.items?.filter(Boolean) ?? []
}

function namesIn(text: string, facets: readonly (readonly [string, RegExp])[]): string[] {
  return facets.filter(([, pattern]) => pattern.test(text)).map(([name]) => name)
}

/** Pizza sizes anywhere in the coupon. */
export function couponSizes(coupon: Coupon): Set<string> {
  const sizes = new Set<string>()
  for (const line of itemLines(coupon)) {
    if (!PIZZA_LINE.test(line) && !/吋/.test(line)) continue
    for (const alternative of line.split('或')) {
      if (NOT_A_SIZE.test(alternative)) continue
      namesIn(alternative, SIZE_FACETS).forEach((size) => sizes.add(size))
    }
  }
  return sizes
}

/** One line of the coupon: always included, or one pick among alternatives. */
type Slot = { fixed: boolean; alternatives: Set<string>[] }

/**
 * Non-pizza lines as slots. Pizza lines are skipped: their flavour lists name
 * sides (「義式培根薯金幣」 is a pizza), so they would add contents that aren't
 * there. A 「N選K」 line with K > 1 gives K picks.
 */
function contentSlots(coupon: Coupon): Slot[] {
  const slots: Slot[] = []
  for (const line of itemLines(coupon)) {
    if (PIZZA_LINE.test(line)) continue
    const alternatives = line.split('或').map((part) => new Set(namesIn(part, CONTENT_FACETS)))
    if (alternatives.length === 1) {
      slots.push({ fixed: true, alternatives })
      continue
    }
    const picks = Number(line.match(/\d+\s*選\s*(\d+)/)?.[1] ?? 1)
    for (let i = 0; i < Math.max(1, picks); i++) slots.push({ fixed: false, alternatives })
  }
  return slots
}

/** Every content the coupon can include, in at least one way of ordering it. */
export function couponContents(coupon: Coupon): Set<string> {
  const contents = new Set<string>()
  for (const slot of contentSlots(coupon)) {
    for (const alternative of slot.alternatives) alternative.forEach((name) => contents.add(name))
  }
  return contents
}

/** True when one way of filling the coupon's choices includes all of `wanted`. */
function canIncludeAll(coupon: Coupon, wanted: string[]): boolean {
  if (!wanted.length) return true
  const slots = contentSlots(coupon)
  const always = new Set(slots.filter((s) => s.fixed).flatMap((s) => [...s.alternatives[0]]))
  const choices = slots.filter((s) => !s.fixed)

  // Small search: at most a handful of choice lines with ~10 options each.
  const search = (have: Set<string>, used: Set<number>): boolean => {
    const missing = wanted.find((name) => !have.has(name))
    if (!missing) return true
    return choices.some(
      (slot, i) =>
        !used.has(i) &&
        slot.alternatives.some(
          (alternative) =>
            alternative.has(missing) &&
            search(new Set([...have, ...alternative]), new Set([...used, i]))
        )
    )
  }
  return search(always, new Set())
}

export function matchesFacets(coupon: Coupon, selected: string[]): boolean {
  const sizes = selected.filter((name) => GROUP_OF.get(name) === 'size')
  const contents = selected.filter((name) => GROUP_OF.get(name) === 'content')
  if (sizes.length) {
    const own = couponSizes(coupon)
    if (!sizes.some((size) => own.has(size))) return false
  }
  return canIncludeAll(coupon, contents)
}

/** The coupon's sizes, then every content it can include, in filter order. */
export function couponFacets(coupon: Coupon): string[] {
  const sizes = couponSizes(coupon)
  const contents = couponContents(coupon)
  return [
    ...SIZE_FACETS.map(([name]) => name).filter((name) => sizes.has(name)),
    ...CONTENT_FACETS.map(([name]) => name).filter((name) => contents.has(name)),
  ]
}

export type FacetCount = { tag: string; count: number }

/** Each filter with how many coupons have it, in display order; empty ones dropped. */
export function facetCounts(coupons: Coupon[]): Record<FacetGroup, FacetCount[]> {
  const count = (facets: readonly (readonly [string, RegExp])[], of: (c: Coupon) => Set<string>) => {
    const totals = new Map<string, number>()
    for (const coupon of coupons) of(coupon).forEach((name) => totals.set(name, (totals.get(name) ?? 0) + 1))
    return facets.map(([tag]) => ({ tag, count: totals.get(tag) ?? 0 })).filter(({ count }) => count > 0)
  }
  return { size: count(SIZE_FACETS, couponSizes), content: count(CONTENT_FACETS, couponContents) }
}
