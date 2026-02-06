'use client'

import { useEffect, useMemo } from 'react'
import { useThemeStore } from '@/stores/themeStore'
import { getTheme } from '@/lib/themes/registry'
import type { UITheme } from '@/lib/themes/types'

/**
 * UI 主题提供者
 * 根据当前选择的 UI 主题动态应用布局和样式
 */
export function UIThemeProvider({ children }: { children: React.ReactNode }) {
  const { currentUITheme } = useThemeStore()

  // 获取当前主题配置
  const theme = useMemo(() => {
    return (getTheme(currentUITheme) || getTheme('default')) ?? null
  }, [currentUITheme])

  // 应用主题的 CSS 变量
  useEffect(() => {
    if (!theme || typeof document === 'undefined') return

    const root = document.documentElement

    // 应用布局相关的 CSS 变量
    if (theme.layout.header.height) {
      root.style.setProperty('--app-header-height', theme.layout.header.height)
    }

    // 应用样式相关的 CSS 变量
    if (theme.styles.cssVariables) {
      Object.entries(theme.styles.cssVariables).forEach(([key, value]) => {
        root.style.setProperty(`--${key}`, value)
      })
    }

    // 添加主题标识类
    root.setAttribute('data-ui-theme', theme.id)

    return () => {
      // 清理：移除主题标识类
      root.removeAttribute('data-ui-theme')
    }
  }, [theme])

  return <>{children}</>
}

/**
 * 获取当前主题配置的 Hook
 */
export function useUITheme(): UITheme | null {
  const { currentUITheme } = useThemeStore()
  return useMemo(() => {
    return (getTheme(currentUITheme) || getTheme('default')) ?? null
  }, [currentUITheme])
}
