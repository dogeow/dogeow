'use client'

import { useUITheme } from '@/components/themes/UIThemeProvider'
import dynamic from 'next/dynamic'
import { useMemo } from 'react'
import { TileCard as DefaultTileCard } from './TileCard'
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
 * 根据当前 UI 主题动态加载对应的 TileCard 组件
 */
export function ThemedTileCard(props: ThemedTileCardProps) {
  const theme = useUITheme()

  // 动态加载主题的 TileCard 组件
  const TileCardComponent = useMemo(() => {
    if (!theme) return DefaultTileCard

    // 如果主题有自定义的 TileCard，使用它
    const customTileCardPath = theme.components?.TileCard
    if (!customTileCardPath) return DefaultTileCard

    try {
      const componentPath = `components/${customTileCardPath}`
      return dynamic(
        () =>
          import(`@/${componentPath}`)
            .then(module => ({ default: module.TileCard || module.default }))
            .catch(() => ({ default: DefaultTileCard })),
        {
          ssr: false,
          loading: () => <DefaultTileCard {...props} />,
        }
      )
    } catch {
      return DefaultTileCard
    }
  }, [theme, props])

  const Component = TileCardComponent || DefaultTileCard

  return <Component {...props} />
}
