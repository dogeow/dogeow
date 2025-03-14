"use client"

import { ThemeProvider as NextThemesProvider } from "next-themes"
import { useThemeStore, getCurrentThemeColor } from "@/stores/themeStore"
import { useEffect } from "react"

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { currentTheme, customThemes } = useThemeStore()
  
  // 应用主题色彩
  useEffect(() => {
    const themeColor = getCurrentThemeColor(currentTheme, customThemes)
    
    // 设置CSS变量
    document.documentElement.style.setProperty('--primary', themeColor.primary)
    document.documentElement.style.setProperty('--primary-color', themeColor.color)
  }, [currentTheme, customThemes])
  
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  )
} 