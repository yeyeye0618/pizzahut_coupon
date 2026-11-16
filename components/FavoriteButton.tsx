'use client'

import { toggleFavorite, useFavorites } from '@/lib/favorites'

/**
 * Star toggle on a coupon card. The only client JS a card carries.
 *
 * Unstarring inside the favourites view leaves the card in place (hollow star)
 * so a slip of the finger can be undone; it drops out the next time the view
 * is opened.
 */
export function FavoriteButton({ code }: { code: string }) {
  const favorites = useFavorites()
  const active = favorites?.includes(code) ?? false

  return (
    <button
      type="button"
      className="fav-btn"
      aria-pressed={active}
      aria-label={active ? `將 ${code} 移出最愛` : `將 ${code} 加入最愛`}
      title={active ? '移出最愛' : '加入最愛'}
      onClick={() => toggleFavorite(code)}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 3.6l2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z" />
      </svg>
    </button>
  )
}
