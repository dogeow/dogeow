'use client'

import { useEffect } from 'react'
import { useThemeStore } from '@/stores/themeStore'

const DATA_ATTR_CURSOR = 'data-custom-cursor'
const DATA_ATTR_TRANSITION = 'data-theme-transition'

/**
 * 根据设置将 data 属性同步到 document.documentElement，
 * 供 globals.css 中的自定义光标、主题切换过渡等样式使用。
 */
export function CustomCursorSync() {
  const customCursorEnabled = useThemeStore(s => s.customCursorEnabled)
  const themeTransitionEnabled = useThemeStore(s => s.themeTransitionEnabled)

  useEffect(() => {
    const el = document.documentElement
    if (customCursorEnabled) {
      el.setAttribute(DATA_ATTR_CURSOR, 'true')
    } else {
      el.removeAttribute(DATA_ATTR_CURSOR)
    }
    return () => el.removeAttribute(DATA_ATTR_CURSOR)
  }, [customCursorEnabled])

  useEffect(() => {
    const el = document.documentElement
    if (themeTransitionEnabled) {
      el.setAttribute(DATA_ATTR_TRANSITION, 'true')
    } else {
      el.removeAttribute(DATA_ATTR_TRANSITION)
    }
    return () => el.removeAttribute(DATA_ATTR_TRANSITION)
  }, [themeTransitionEnabled])

  return null
}
