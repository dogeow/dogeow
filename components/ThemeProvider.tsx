"use client"

import { ThemeProvider as NextThemesProvider } from "next-themes"
import { useThemeStore, getCurrentThemeColor } from "@/stores/themeStore"
import { useEffect } from "react"
import { useTheme } from "next-themes"

// 内部组件用于处理系统主题变化与颜色变量应用
function ThemeHandler() {
  const { followSystem, currentTheme, customThemes } = useThemeStore()
  const { setTheme, systemTheme } = useTheme()

  // 处理跟随系统主题的逻辑
  useEffect(() => {
    if (followSystem) {
      // 跟随系统主题时
      setTheme(systemTheme === 'dark' ? 'dark' : 'light');
    }
  }, [followSystem, systemTheme, setTheme]);

  // 动态应用主题颜色到CSS变量
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const themeColor = getCurrentThemeColor(currentTheme, customThemes);
      const root = document.documentElement;
      
      // 应用主题颜色到CSS变量
      root.style.setProperty('--primary', themeColor.primary);
      root.style.setProperty('--primary-color', themeColor.color);
    }
  }, [currentTheme, customThemes]);

  return null;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
    >
      <ThemeHandler />
      {children}
    </NextThemesProvider>
  )
} 