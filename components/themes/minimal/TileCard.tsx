'use client'

import { memo } from 'react'
import type { Tile } from '@/app/types'
import { useTranslation } from '@/hooks/useTranslation'

interface TileCardProps {
  tile: Tile
  index: number
  customStyles?: string
  showCover: boolean
  needsLogin: boolean
  onClick: () => void
}

/**
 * 极简主题的 TileCard 组件
 * 完全不同的卡片样式：无背景、无边框、纯文字、大间距
 */
export const TileCard = memo(
  ({ tile, index, customStyles = '', showCover, needsLogin, onClick }: TileCardProps) => {
    const { t } = useTranslation()
    const tileName = t(tile.nameKey, tile.nameCn || tile.nameKey)

    return (
      <button
        type="button"
        onClick={onClick}
        className={`group hover:bg-muted/50 flex w-full flex-col items-start gap-2 rounded-lg p-6 transition-all ${needsLogin ? 'opacity-50' : ''} ${customStyles} `}
        disabled={needsLogin}
      >
        {/* 标题 */}
        <div className="flex items-center gap-3">
          {tile.icon && (
            <div className="text-2xl">{typeof tile.icon === 'string' ? tile.icon : tile.icon}</div>
          )}
          <h3 className="text-xl font-light">{tileName}</h3>
        </div>

        {/* 描述（如果有） */}
        {tile.description && <p className="text-muted-foreground text-sm">{tile.description}</p>}

        {/* 下划线装饰 */}
        <div className="bg-foreground h-px w-0 transition-all group-hover:w-full" />
      </button>
    )
  }
)

TileCard.displayName = 'MinimalThemeTileCard'
