"use client"

import { ThemeProvider as NextThemesProvider } from "next-themes"
import { useThemeStore, getCurrentThemeColor } from "@/stores/themeStore"
import { useEffect } from "react"
import { useTheme } from "next-themes"
import { configs } from "@/app/configs"

// 内部组件用于处理系统主题变化
function ThemeApplier() {
  const {followSystem } = useThemeStore()
  const {setTheme, systemTheme } = useTheme()

  // 处理主题颜色
  useEffect(() => {
    if (followSystem) {
      const systemColorTheme = systemTheme === 'dark' ? 'dark' : 'light';
      setTheme(systemColorTheme)
    }
  }, [followSystem, systemTheme, setTheme]);

  return null;
}

// 新增组件：实际应用主题颜色到CSS变量
function ThemeColorUpdater() {
  const { currentTheme, customThemes, followSystem } = useThemeStore();
  
  // 当主题ID变化时，更新CSS变量
  useEffect(() => {
    if (followSystem) return; // 跟随系统时不应用自定义主题颜色
    
    const themeColor = getCurrentThemeColor(currentTheme, customThemes);
    if (themeColor) {
      document.documentElement.style.setProperty('--primary', themeColor.primary);
      document.documentElement.style.setProperty('--primary-color', themeColor.color);
    }
  }, [currentTheme, customThemes, followSystem]);
  
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
      <ThemeColorUpdater />
      {children}
    </NextThemesProvider>
  )
} 