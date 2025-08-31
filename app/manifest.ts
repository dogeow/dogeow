import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'DogeOW - 学习、生活、工作于一体',
    short_name: 'DogeOW',
    description: 'DogeOW是一个集学习、生活、工作于一体的综合性平台',
    start_url: '/',
    display: 'standalone',
    background_color: '#000000',
    theme_color: '#000000',
    orientation: 'portrait',
    scope: '/',
    icons: [
      {
        src: '/favicon.ico',
        sizes: '64x64 32x32 24x24 16x16',
        type: 'image/x-icon',
      },
      {
        src: '/80.png',
        sizes: '80x80',
        type: 'image/png',
      },
      {
        src: '/480.png',
        sizes: '480x480',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/480.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
    categories: ['productivity', 'education', 'lifestyle'],
    lang: 'zh-CN',
    dir: 'ltr',
  }
}
