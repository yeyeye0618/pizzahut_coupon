import { ImageResponse } from 'next/og'

// iOS home-screen icon. Same slice as app/icon.svg, rendered to PNG because
// iOS ignores SVG icons.
export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

const SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="s" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff4133"/><stop offset="1" stop-color="#ff8a3d"/></linearGradient></defs><rect width="64" height="64" fill="#0a0e14"/><path d="M12 19 Q32 9 52 19 L32 56 Z" fill="url(#s)"/><path d="M12 19 Q32 9 52 19" fill="none" stroke="#ffcf8a" stroke-width="5" stroke-linecap="round"/><circle cx="25" cy="26" r="3.6" fill="#8f1d12"/><circle cx="38" cy="27" r="3.6" fill="#8f1d12"/><circle cx="31" cy="38" r="3.2" fill="#8f1d12"/></svg>`

export default function AppleIcon() {
  return new ImageResponse(
    (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={`data:image/svg+xml;base64,${Buffer.from(SVG).toString('base64')}`}
        width={180}
        height={180}
        alt=""
      />
    ),
    size
  )
}
