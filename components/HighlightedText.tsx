import { escapeRegExp } from '@/lib/coupon-utils'

interface HighlightedTextProps {
  text: string
  keyword: string
}

/**
 * Server component: the keyword comes from the URL, so highlighting happens
 * during render and ships as plain markup with no client JS.
 */
export function HighlightedText({ text, keyword }: HighlightedTextProps) {
  const trimmed = keyword.trim()
  if (!trimmed) {
    return <>{text}</>
  }

  // The keyword is escaped, so the constructed pattern is a literal match.
  const parts = text.split(new RegExp(`(${escapeRegExp(trimmed)})`, 'gi'))
  const needle = trimmed.toLowerCase()

  return (
    <>
      {parts.map((part, i) =>
        // Odd indices are the captured separators, i.e. the actual matches.
        i % 2 === 1 && part.toLowerCase() === needle ? (
          <mark key={i} className="keyword-highlight">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  )
}
