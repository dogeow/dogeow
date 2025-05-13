"use client"

import { ThemeProvider as NextThemesProvider } from "next-themes"
import { useThemeStore } from "@/stores/themeStore"
import { useEffect } from "react"
import { useTheme } from "next-themes"

// 内部组件用于处理系统主题变化
function ThemeApplier() {
  const {followSystem, setCurrentTheme } = useThemeStore()
  const {setTheme, systemTheme } = useTheme()

  // 处理主题颜色
  useEffect(() => {
    if (followSystem) {
      const systemColorTheme = systemTheme === 'dark' ? 'dark' : 'light';
      setTheme(systemColorTheme)
    }
  }, [followSystem, systemTheme]);

  return null;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <ThemeApplier />
      {children}
    </NextThemesProvider>
  )
} 