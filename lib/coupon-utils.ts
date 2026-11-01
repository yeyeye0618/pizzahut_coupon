export function normalizeTags(rawTags: string | string[] | null | undefined): string[] {
  const source = Array.isArray(rawTags) ? rawTags : String(rawTags ?? '').split(/[、,，|]/)
  return source.map((tag) => String(tag ?? '').trim()).filter(Boolean)
}

export function formatOrderLink(code: string) {
  return `https://www.pizzahut.com.tw/order/?mode=step_2&type_id=1025&cno=${code}`
}

export function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
