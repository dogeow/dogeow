'use client'

import { useUITheme } from '@/components/themes/UIThemeProvider'
import dynamic from 'next/dynamic'
import { useMemo } from 'react'
import { TileCard as DefaultTileCard } from './TileCard'
import type { Tile } from '@/app/types'
import type { ProjectCoverMode } from '@/stores/projectCoverStore'

interface ThemedTileCardProps {
  tile: Tile
  index: number
  customStyles?: string
  projectCoverMode: ProjectCoverMode
  needsLogin: boolean
  onClick: () => void
}

/**
 * 主题化的 TileCard 组件
 * 根据当前 UI 主题动态加载对应的 TileCard 组件
 */
export function ThemedTileCard(props: ThemedTileCardProps) {
  const theme = useUITheme()

  const TileCardComponent = useMemo(() => {
    if (!theme) return DefaultTileCard

    const customTileCardPath = theme.components?.TileCard
    if (!customTileCardPath) return DefaultTileCard

    try {
      const componentPath = `components/${customTileCardPath}`
      return dynamic(
        () =>
          import(`@/${componentPath}`)
            .then(module => ({ default: module.TileCard || module.default }))
            .catch(() => ({ default: DefaultTileCard })),
        { ssr: false }
      )
    } catch {
      return DefaultTileCard
    }
  }, [theme])

  const Component = TileCardComponent || DefaultTileCard

  return <Component {...props} />
}
