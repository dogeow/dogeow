import type { NextConfig } from "next";

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  experimental: {
    // ... any other experimental flags you might have
    imgOptTimeoutInSeconds: 30, // Increase this value (e.g., to 30 seconds)
  },
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: '127.0.0.1',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: 'next-api.dogeow.com',
      },
    ],
    deviceSizes: [80, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1200],
  },
};

export default nextConfig;
