import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enables "use cache" directive + PPR — required for this guide
  cacheComponents: true,

  // Turbopack filesystem cache — much faster dev restarts on large projects
  experimental: {
    turbopackFileSystemCacheForDev: true,
    /** Default Server Action body limit is 1 MB; vehicle form allows up to 5×8 MB photos. */
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },

  // Forward browser errors to terminal — critical for AI debugging (16.2+)
  // AI agents can't see the browser console. This makes errors visible.
  logging: {
    browserToTerminal: "error", // 'warn' | true (all) | false (disable)
  },

  // Custom cache profiles — reference by name in cacheLife()
  cacheLife: {
    // Almost never changes: platform config, pricing tiers, static content
    static: {
      stale: 60 * 60 * 24 * 7, // 7 days client-side
      revalidate: 60 * 60 * 24, // recheck once/day
      expire: 60 * 60 * 24 * 30, // max 30 days
    },
    // Vendor profiles, city pages, reviews — updates occasionally
    standard: {
      stale: 60, // 1 min client
      revalidate: 300, // recheck every 5 min
      expire: 3600, // max 1 hour
    },
    // Booking counts, search — updates frequently
    live: {
      stale: 10,
      revalidate: 30,
      expire: 60,
    },
  },

  images: {
    minimumCacheTTL: 14400, // 4 hours (v16 default — keep it)
    remotePatterns: [
      {
        protocol: "https",
        hostname: "flagcdn.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "img.logo.dev",
        pathname: "/**",
      },
    ],
  },

  reactCompiler: true,
};

export default nextConfig;
