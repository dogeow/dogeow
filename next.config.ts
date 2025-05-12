import type { NextConfig } from "next";

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    domains: ['127.0.0.1', 'localhost', 'next-api.dogeow.com'],
  },
};

export default nextConfig;
