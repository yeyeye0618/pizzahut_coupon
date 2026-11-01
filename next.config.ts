import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
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
