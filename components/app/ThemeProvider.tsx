'use client'

import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { useThemeStore, getCurrentThemeColor, isRestPeriodNow } from '@/stores/themeStore'
import { useEffect } from 'react'
import { useTheme } from 'next-themes'

// 内部组件用于处理系统主题变化与颜色变量应用
function ThemeHandler() {
  const { followSystem, themeMode, restPeriod, currentTheme, customThemes } = useThemeStore()
  const { setTheme, systemTheme } = useTheme()

  // 根据 themeMode 设置外观：浅色、深色、跟随系统、休息时段
  useEffect(() => {
    if (themeMode === 'system' && followSystem) {
      setTheme(systemTheme === 'dark' ? 'dark' : 'light')
    } else if (themeMode === 'light' || themeMode === 'dark') {
      setTheme(themeMode)
    } else if (themeMode === 'rest') {
      setTheme(isRestPeriodNow(restPeriod) ? 'dark' : 'light')
    }
  }, [themeMode, followSystem, restPeriod, systemTheme, setTheme])

  // 休息时段模式：每分钟检查一次，到点自动切换
  useEffect(() => {
    if (themeMode !== 'rest') return
    const tick = () => setTheme(isRestPeriodNow(restPeriod) ? 'dark' : 'light')
    const id = setInterval(tick, 60 * 1000)
    return () => clearInterval(id)
  }, [themeMode, restPeriod, setTheme])

  // 动态应用主题颜色到CSS变量
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const themeColor = getCurrentThemeColor(currentTheme, customThemes)
      const root = document.documentElement

      // 应用主题颜色到CSS变量
      root.style.setProperty('--primary', themeColor.primary)
      root.style.setProperty('--primary-color', themeColor.color)
    }
  }, [currentTheme, customThemes])

  return null
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="light" enableSystem>
      <ThemeHandler />
      {children}
    </NextThemesProvider>
  )
}
