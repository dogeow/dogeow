"use client"

import { ThemeProvider as NextThemesProvider } from "next-themes"
import { useThemeStore, getCurrentThemeColor } from "@/stores/themeStore"
import { useEffect } from "react"
import { useTheme } from "next-themes"
import { configs } from "@/app/configs"

// 内部组件用于处理系统主题变化与颜色变量应用
function ThemeHandler() {
  const { followSystem, currentTheme, customThemes } = useThemeStore()
  const { setTheme, theme, systemTheme } = useTheme()

  // 处理主题颜色与深色模式
  useEffect(() => {
    // 确保dark类被正确应用
    const htmlElement = document.documentElement;
    
    // 1. 处理主题模式 (dark/light)
    if (followSystem) {
      const systemColorTheme = systemTheme === 'dark' ? 'dark' : 'light';
      setTheme(systemColorTheme);
    }

    // 2. 手动设置一次dark类以确保样式生效
    if (theme === 'dark') {
      htmlElement.classList.add('dark');
    } else {
      htmlElement.classList.remove('dark');
    }
    
    // 3. 记录状态用于调试
    console.log('ThemeProvider:', { 
      currentAppliedTheme: theme, 
      systemTheme, 
      followSystem,
      isDarkModeActive: htmlElement.classList.contains('dark')
    });
    
    // 4. 应用主题颜色变量
    if (!followSystem) {
      const themeColor = getCurrentThemeColor(currentTheme, customThemes);
      if (themeColor) {
        htmlElement.style.setProperty('--primary', themeColor.primary);
        htmlElement.style.setProperty('--primary-color', themeColor.color);
      }
    }
  }, [followSystem, systemTheme, setTheme, theme, currentTheme, customThemes]);

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