import { useMemo } from 'react'
import { withAlpha, DARK_FALLBACK, LIGHT_FALLBACK } from '../utils/themeUtils'
import type { ThemeColors, GraphPalette } from '../types/graph'

export function useGraphPalette(isDark: boolean, themeColors: ThemeColors): GraphPalette {
  const graphPalette = useMemo(() => {
    const fallback = isDark ? DARK_FALLBACK : LIGHT_FALLBACK
    const mutedLink = withAlpha(
      themeColors.mutedForeground || fallback.mutedForeground,
      0.35,
      isDark ? 'rgba(148, 163, 184, 0.35)' : 'rgba(203, 213, 225, 0.3)'
    )
    const activeLink = withAlpha(
      themeColors.primary || fallback.primary,
      0.95,
      isDark ? 'rgba(96, 165, 250, 0.95)' : 'rgba(37, 99, 235, 0.95)'
    )
    return {
      background: themeColors.background || fallback.background,
      nodeDefault: themeColors.foreground || fallback.foreground,
      nodeActive: themeColors.primary || fallback.primary,
      nodeNeighbor: themeColors.foreground || fallback.foreground, // 使用与默认节点相同的颜色
      nodeHover: themeColors.accent || fallback.accent,
      labelDefault: themeColors.mutedForeground || fallback.mutedForeground,
      labelActive: themeColors.primary || fallback.primary,
      labelNeighbor: themeColors.foreground || fallback.foreground, // 使用更亮的颜色
      linkMuted: mutedLink,
      linkActive: activeLink,
      border: themeColors.border || fallback.border,
      card: themeColors.card || fallback.card,
    }
  }, [isDark, themeColors])

  return graphPalette
}
