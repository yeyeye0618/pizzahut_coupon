import { ImageResponse } from 'next/og'
import { getCoupons } from '@/lib/coupons'
import { SITE_NAME } from '@/lib/site'

// Link-preview image for LINE / Facebook / Threads / Discord. Generated at
// build and refreshed with the coupon data, so the count stays current.
export const alt = `${SITE_NAME}｜Pizza Hut 優惠代碼查詢`
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const revalidate = 3600

const SUBTITLE = '依口味、尺寸、配餐篩選，一鍵跳轉訂餐'
const DOMAIN = 'pizzahutcoupon.vercel.app'

/**
 * Only the glyphs this image uses, as TrueType from Google Fonts (~10 KB),
 * instead of shipping a multi-megabyte CJK font. Returns null on failure so
 * a network hiccup at build time degrades the image instead of the build.
 */
async function loadFont(text: string): Promise<ArrayBuffer | null> {
  try {
    const css = await (
      await fetch(
        `https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@700&text=${encodeURIComponent(text)}`
      )
    ).text()
    const url = css.match(/src: url\(([^)]+)\) format\('(?:truetype|opentype)'\)/)?.[1]
    return url ? await (await fetch(url)).arrayBuffer() : null
  } catch {
    return null
  }
}

export default async function OpengraphImage() {
  let count: number | null = null
  try {
    count = (await getCoupons()).length
  } catch {
    // Data unavailable at build: the image simply omits the count.
  }

  const stat = count ? `${count} 組優惠代碼・持續更新` : '優惠代碼・持續更新'
  const font = await loadFont(`${SITE_NAME}${SUBTITLE}${stat}PIZZA HUT COUPON${DOMAIN}0123456789`)

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px 80px',
          background:
            'radial-gradient(ellipse 70% 60% at 10% 0%, rgba(255,65,51,0.28), transparent 70%), radial-gradient(ellipse 60% 50% at 95% 0%, rgba(53,227,240,0.16), transparent 70%), #0a0e14',
          color: '#e6edf6',
          fontFamily: font ? 'Noto Sans TC' : 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 26, color: '#93a3b8', letterSpacing: 6 }}>
          <div style={{ width: 14, height: 14, borderRadius: 7, background: '#ff4133' }} />
          PIZZA HUT COUPON
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          <div style={{ fontSize: 96, fontWeight: 700, lineHeight: 1.1 }}>{SITE_NAME}</div>
          <div style={{ fontSize: 40, color: '#b6c2d1' }}>{SUBTITLE}</div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 34 }}>
          <div
            style={{
              display: 'flex',
              padding: '12px 26px',
              borderRadius: 14,
              background: 'linear-gradient(100deg, #ff4133, #ff8a3d)',
              color: '#ffffff',
              fontWeight: 700,
            }}
          >
            {stat}
          </div>
          <div style={{ color: '#35e3f0' }}>{DOMAIN}</div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: font ? [{ name: 'Noto Sans TC', data: font, style: 'normal', weight: 700 }] : undefined,
    }
  )
}
