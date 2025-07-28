import type { NextConfig } from 'next'

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: false,
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
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
      },
      {
        protocol: 'https',
        hostname: 'public.blob.vercel-storage.com',
      },
    ],
    // 优化设备尺寸，添加更多小尺寸选项以匹配卡片大小
    deviceSizes: [
      24, 32, 48, 56, 64, 80, 96, 120, 150, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1200,
    ],
    // 添加imageSizes配置，用于响应式图片
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
}

export default nextConfig
