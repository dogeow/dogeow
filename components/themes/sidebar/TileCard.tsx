'use client'

import { memo } from 'react'
import type { Tile } from '@/app/types'
import { useTranslation } from '@/hooks/useTranslation'
import { Lock } from 'lucide-react'

interface TileCardProps {
  tile: Tile
  index: number
  customStyles?: string
  showCover: boolean
  needsLogin: boolean
  onClick: () => void
}

/**
 * 侧边栏主题的 TileCard 组件
 * 完全不同的卡片样式：紧凑、列表式、带图标
 */
export const TileCard = memo(
  ({ tile, index, customStyles = '', showCover, needsLogin, onClick }: TileCardProps) => {
    const { t } = useTranslation()
    const tileName = t(tile.nameKey, tile.nameCn || tile.nameKey)

    return (
      <button
        type="button"
        onClick={onClick}
        className={`group bg-card hover:border-primary relative flex w-full items-center gap-3 rounded-lg border p-3 transition-all hover:shadow-md ${needsLogin ? 'opacity-60' : ''} ${customStyles} `}
        disabled={needsLogin}
      >
        {/* 图标 */}
        {tile.icon && (
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
            style={{ backgroundColor: tile.color }}
          >
            {typeof tile.icon === 'string' ? (
              <span className="text-lg">{tile.icon}</span>
            ) : (
              <div className="h-5 w-5 text-white">{tile.icon}</div>
            )}
          </div>
        )}

        {/* 内容 */}
        <div className="flex-1 text-left">
          <div className="flex items-center gap-2">
            <span className="font-medium">{tileName}</span>
            {needsLogin && <Lock className="text-muted-foreground h-4 w-4" />}
          </div>
          {tile.description && (
            <p className="text-muted-foreground mt-1 text-xs">{tile.description}</p>
          )}
        </div>

        {/* 箭头 */}
        <div className="text-muted-foreground transition-transform group-hover:translate-x-1">
          →
        </div>
      </button>
    )
  }
)

TileCard.displayName = 'SidebarThemeTileCard'
