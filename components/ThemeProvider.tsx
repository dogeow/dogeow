"use client"

import { ThemeProvider as NextThemesProvider } from "next-themes"
import { useThemeStore } from "@/stores/themeStore"
import { useEffect } from "react"
import { useTheme } from "next-themes"

// 内部组件用于处理系统主题变化与颜色变量应用
function ThemeHandler() {
  const { followSystem, currentTheme, customThemes, previousThemeMode, setFollowSystem } = useThemeStore()
  const { setTheme, theme, systemTheme } = useTheme()

  // 处理主题颜色与深色模式
  useEffect(() => {

    if (followSystem) {
      // 跟随系统主题时
      setTheme(systemTheme === 'dark' ? 'dark' : 'light');
    } else {
      // 恢复用户之前的深色/浅色模式选择
      if (previousThemeMode && theme !== previousThemeMode) {
        setTheme(previousThemeMode);
      }
    }
  }, [followSystem, systemTheme, setTheme, currentTheme, customThemes, previousThemeMode, theme]);

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
      <ThemeHandler />
      {children}
    </NextThemesProvider>
  )
} 