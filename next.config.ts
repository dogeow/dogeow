import type { NextConfig } from "next";

const nextConfig: NextConfig = {
eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  images: {
    domains: ['127.0.0.1', 'localhost'],
  },
};

export default nextConfig;
