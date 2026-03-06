'use client'

import { useUITheme } from '@/components/themes/UIThemeProvider'
import { useMemo } from 'react'
import { TileCard as DefaultTileCard } from './TileCard'
import { TileCard as DashboardTileCard } from '@/components/themes/dashboard/TileCard'
import { TileCard as MinimalTileCard } from '@/components/themes/minimal/TileCard'
import { TileCard as SidebarTileCard } from '@/components/themes/sidebar/TileCard'
import type { Tile } from '@/app/types'

interface ThemedTileCardProps {
  tile: Tile
  index: number
  customStyles?: string
  showCover: boolean
  needsLogin: boolean
  onClick: () => void
}

/**
 * 主题化的 TileCard 组件
 * 首页磁贴需要在 SSR 阶段输出图片，避免 LCP 图片退化为 CSR bailout。
 */
export function ThemedTileCard(props: ThemedTileCardProps) {
  const theme = useUITheme()

  const TileCardComponent = useMemo(() => {
    if (!theme) return DefaultTileCard

    switch (theme.id) {
      case 'dashboard':
        return DashboardTileCard
      case 'minimal':
        return MinimalTileCard
      case 'sidebar':
        return SidebarTileCard
      case 'default':
      default:
        return DefaultTileCard
    }
  }, [theme])

  const Component = TileCardComponent || DefaultTileCard

  return <Component {...props} />
}
