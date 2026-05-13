import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", "@prisma/adapter-pg", "pg", "ws", "adm-zip", "ioredis"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.t3.storage.dev" },
      { protocol: "https", hostname: "t3.storage.dev" },
      { protocol: "https", hostname: "*.r2.dev" },
      { protocol: "https", hostname: "cdn.novally.tech" },
      { protocol: "https", hostname: "media.novally.tech" },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "100mb",
    },
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
