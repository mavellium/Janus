import type { NextConfig } from "next";

const nextConfig = {
  output: "standalone",
  serverActions: {
    bodySizeLimit: '500mb',
    maxDuration: 300,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '500mb',
      maxDuration: 300,
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
} as any satisfies NextConfig;

export default nextConfig;
