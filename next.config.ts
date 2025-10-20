import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Allow production builds to complete even with TypeScript errors
    ignoreBuildErrors: true,
  },
  eslint: {
    // Allow production builds to complete even with ESLint errors
    ignoreDuringBuilds: true,
  },
  experimental: {
    // Disable turbopack for production builds (Vercel compatibility)
    turbo: undefined,
  },
};

export default nextConfig;