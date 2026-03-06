import path from 'node:path'
import type { NextConfig } from 'next'

const modernNextPolyfillModule = path.resolve(
  __dirname,
  'lib/polyfills/next-polyfill-module-modern.js'
)
const modernNextPolyfillModuleForTurbopack = './lib/polyfills/next-polyfill-module-modern.js'
const nextPolyfillModuleRequests = [
  '../build/polyfills/polyfill-module',
  '../build/polyfills/polyfill-module.js',
  'next/dist/build/polyfills/polyfill-module',
  'next/dist/build/polyfills/polyfill-module.js',
]
const nextPolyfillModuleAliasesForTurbopack = Object.fromEntries(
  nextPolyfillModuleRequests.map(request => [request, modernNextPolyfillModuleForTurbopack])
)

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  reactStrictMode: true,
  // 将 Next 默认的 module polyfills 缩减到仅保留当前目标浏览器仍缺失的 URL.canParse。
  turbopack: {
    resolveAlias: nextPolyfillModuleAliasesForTurbopack,
  },
  webpack: config => {
    config.resolve ??= {}
    config.resolve.alias ??= {}
    config.resolve.alias['@'] = path.join(__dirname)
    Object.assign(
      config.resolve.alias,
      Object.fromEntries(
        nextPolyfillModuleRequests.map(request => [`${request}$`, modernNextPolyfillModule])
      )
    )
    return config
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
        hostname: 'ui-avatars.com',
      },
      {
        protocol: 'https',
        hostname: 'robohash.org',
      },
      {
        protocol: 'https',
        hostname: 'public.blob.vercel-storage.com',
      },
      {
        protocol: 'https',
        hostname: 'upyun.dogeow.com',
        pathname: '/**',
      },
    ],
    // 优化设备尺寸，添加更多小尺寸选项以匹配卡片大小
    deviceSizes: [
      24, 32, 48, 56, 64, 80, 96, 120, 150, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1200,
    ],
    // 添加imageSizes配置，用于响应式图片
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // 禁用对 SVG 的优化，因为 dicebear 返回的是 SVG
    unoptimized: false,
    // 添加加载器配置
    loader: 'default',
  },
}

export default nextConfig
