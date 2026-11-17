import type { NextConfig } from "next";
import { TAG_SLUGS } from "./lib/tag-slugs";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Tag pages moved from /tag/比薩 to /tag/pizza (see TAG_SLUGS in
  // lib/coupons.ts). Permanent redirects keep the URLs search engines already
  // indexed, and they run before any page code.
  async redirects() {
    return Object.entries(TAG_SLUGS).flatMap(([tag, slug]) => {
      const from = `/tag/${encodeURIComponent(tag)}`
      return [
        { source: from, destination: `/tag/${slug}`, permanent: true },
        { source: `${from}/:page`, destination: `/tag/${slug}/:page`, permanent: true },
      ]
    })
  },
  experimental: {
    // "/" is a dynamic route, and Next 15+ defaults dynamic entries in the
    // client router cache to 0s, which throws away every prefetch the moment
    // it lands. The coupon data changes about once a fortnight, so holding a
    // navigation for a minute costs nothing and makes going back to a filter
    // you already viewed instant.
    staleTimes: {
      dynamic: 60,
      static: 180,
    },
  },
};

export default nextConfig;
