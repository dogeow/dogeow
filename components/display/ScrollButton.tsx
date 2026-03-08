'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { asset } from '@/lib/helpers/assets'

const SCROLL_HEIGHT = 500
const DEFAULT_BOTTOM = -200
const DISPLAY_BOTTOM = 40

function getScrollContainer(): Element | null {
  if (typeof document === 'undefined') return null
  return document.querySelector('[data-scroll-container]')
}

export function ScrollButton() {
  const [bottom, setBottom] = useState(DEFAULT_BOTTOM)
  const [delay, setDelay] = useState('1.5s')

  useEffect(() => {
    const el = getScrollContainer()
    if (!el) return

    const toggleVisible = () => {
      const scrolled = el.scrollTop
      if (scrolled > SCROLL_HEIGHT) {
        setBottom(DISPLAY_BOTTOM)
        setDelay('1.5s')
      } else {
        setBottom(DEFAULT_BOTTOM)
        setDelay('3s')
      }
    }

    toggleVisible()
    el.addEventListener('scroll', toggleVisible)
    return () => el.removeEventListener('scroll', toggleVisible)
  }, [])

  const scrollToTop = useCallback(() => {
    const el = getScrollContainer()
    if (el) {
      el.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [])

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="回到顶部"
      style={{
        position: 'fixed',
        right: 12,
        bottom,
        outline: 'none',
        transition: `bottom ${delay}`,
        cursor: 'pointer',
        zIndex: 50,
      }}
      onClick={scrollToTop}
      onKeyDown={e => e.key === 'Enter' && scrollToTop()}
    >
      <Image src={asset('/bfr.png')} width={24} height={24} alt="回到顶部" />
    </div>
  )
}
