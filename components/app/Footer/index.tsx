'use client'

import * as React from 'react'
import { useTheme } from 'next-themes'
import BuiltBy from './BuiltBy'
import PoweredBy from './PoweredBy'
import ICP from './ICP'
import LegalLinks from './LegalLinks'
import { UPYUN_CDN_URL, FOOTER_BG_IMAGES_LIGHT } from '@/lib/constants'

const FOOTER_BG_PARAMS = '!/compress/true/fw/400'

export default function Footer() {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  const [lightBgIndex] = React.useState(() =>
    Math.floor(Math.random() * FOOTER_BG_IMAGES_LIGHT.length)
  )

  const backgroundImage = React.useMemo(() => {
    const base = `${UPYUN_CDN_URL}/bg`
    if (isDark) {
      return `url(${base}/tesla-vector-roadster.png${FOOTER_BG_PARAMS})`
    }
    const img = FOOTER_BG_IMAGES_LIGHT[lightBgIndex]
    return `url(${base}/${img}${FOOTER_BG_PARAMS})`
  }, [isDark, lightBgIndex])

  return (
    <footer className="mt-auto flex min-h-[200px] flex-col items-center gap-2 pt-4">
      <div
        className="flex w-full max-w-5xl flex-1 flex-col items-center gap-2"
        style={{
          backgroundImage,
          backgroundPosition: 'right 20px bottom',
          backgroundRepeat: 'no-repeat',
          backgroundSize: 200,
        }}
      >
        <LegalLinks />
        <BuiltBy />
        <PoweredBy />
        <ICP />
      </div>
    </footer>
  )
}
