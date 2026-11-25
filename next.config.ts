import type { NextConfig } from "next";
import { RETIRED_TAGS } from "./lib/tag-slugs";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Retired tag URLs (the Chinese ones, and the old 比薩/配餐 pages) go to the
  // page that replaced them; see RETIRED_TAGS in lib/tag-slugs.ts. Numbered
  // pages land on page 1, since the new page has its own page count.
  // Permanent redirects keep what search engines already indexed, and they
  // run before any page code.
  async redirects() {
    return Object.entries(RETIRED_TAGS).flatMap(([old, slug]) => {
      const from = `/tag/${encodeURIComponent(old)}`
      const destination = slug ? `/tag/${slug}` : "/"
      return [
        { source: from, destination, permanent: true },
        { source: `${from}/:page`, destination, permanent: true },
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
