import { useState, useEffect, startTransition } from 'react'
import { useTheme } from 'next-themes'
import { LIGHT_FALLBACK, DARK_FALLBACK, type ThemeColors } from '../utils/themeUtils'

export function useThemeColors() {
  const { theme, systemTheme } = useTheme()
  const [isDark, setIsDark] = useState<boolean>(false)
  const [themeColors, setThemeColors] = useState<ThemeColors>(LIGHT_FALLBACK)

  // 根据主题更新图谱颜色
  useEffect(() => {
    if (typeof document === 'undefined') return
    const resolvedTheme = theme === 'system' ? systemTheme : theme
    const nextIsDark =
      resolvedTheme === 'dark' || document.documentElement.classList.contains('dark')

    const styles = getComputedStyle(document.documentElement)
    const fallback = nextIsDark ? DARK_FALLBACK : LIGHT_FALLBACK
    const getVar = (name: string) => styles.getPropertyValue(`--${name}`).trim()
    const newThemeColors = {
      background: getVar('background') || fallback.background,
      foreground: getVar('foreground') || fallback.foreground,
      card: getVar('card') || fallback.card,
      cardForeground: getVar('card-foreground') || fallback.cardForeground,
      mutedForeground: getVar('muted-foreground') || fallback.mutedForeground,
      border: getVar('border') || fallback.border,
      primary: getVar('primary') || fallback.primary,
      ring: getVar('ring') || fallback.ring,
      accent: getVar('accent') || fallback.accent,
    }

    startTransition(() => {
      setIsDark(nextIsDark)
      setThemeColors(newThemeColors)
    })
  }, [theme, systemTheme])

  return { isDark, themeColors }
}
