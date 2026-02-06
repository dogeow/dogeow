'use client'

import { memo } from 'react'
import Image from 'next/image'
import type { Tile } from '@/app/types'
import { useTranslation } from '@/hooks/useTranslation'
import { Lock, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/helpers'

interface TileCardProps {
  tile: Tile
  index: number
  customStyles?: string
  showCover: boolean
  needsLogin: boolean
  onClick: () => void
}

/**
 * Dashboard 主题的 TileCard 组件
 * 玻璃态效果卡片，网格布局，带图标和描述
 */
export const TileCard = memo(
  ({ tile, index, customStyles = '', showCover, needsLogin, onClick }: TileCardProps) => {
    const { t } = useTranslation()
    const tileName = t(tile.nameKey, tile.nameCn || tile.nameKey)

    return (
      <button
        type="button"
        onClick={onClick}
        disabled={needsLogin}
        className={cn(
          'group relative w-full',
          'flex flex-col gap-3',
          'border-border/50 rounded-xl border',
          'bg-card/50 backdrop-blur-md',
          'p-5',
          'transition-all duration-200',
          'hover:border-primary/50 hover:shadow-primary/10 hover:shadow-lg',
          'hover:-translate-y-1',
          needsLogin && 'cursor-not-allowed opacity-60',
          customStyles
        )}
      >
        {/* 背景渐变（如果有颜色） */}
        <div
          className="absolute inset-0 rounded-xl opacity-0 transition-opacity group-hover:opacity-10"
          style={{ backgroundColor: tile.color }}
        />

        {/* 内容 */}
        <div className="relative z-10 flex flex-col gap-3">
          {/* 图标和标题 */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {/* 图标容器 */}
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg shadow-sm"
                style={{ backgroundColor: tile.color }}
              >
                {tile.icon && (
                  <div className="text-white">
                    {typeof tile.icon === 'string' ? (
                      <span className="text-2xl">{tile.icon}</span>
                    ) : (
                      <div className="h-6 w-6">{tile.icon}</div>
                    )}
                  </div>
                )}
              </div>

              {/* 标题 */}
              <div className="flex-1 text-left">
                <h3 className="text-base font-semibold">{tileName}</h3>
                {tile.description && (
                  <p className="text-muted-foreground mt-1 line-clamp-1 text-xs">
                    {tile.description}
                  </p>
                )}
              </div>
            </div>

            {/* 外部链接图标 */}
            <ExternalLink className="text-muted-foreground h-4 w-4 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
          </div>

          {/* 封面图片（如果启用） */}
          {showCover && tile.cover && (
            <div className="relative h-32 w-full overflow-hidden rounded-lg">
              <Image
                src={`/images/projects/${tile.cover}`}
                alt={tileName}
                fill
                className="object-cover opacity-60 transition-opacity group-hover:opacity-100"
                sizes="(max-width: 768px) 100vw, 300px"
              />
            </div>
          )}

          {/* 锁定图标 */}
          {needsLogin && (
            <div className="text-muted-foreground flex items-center gap-2 text-xs">
              <Lock className="h-3 w-3" />
              <span>需要登录</span>
            </div>
          )}
        </div>
      </button>
    )
  }
)

TileCard.displayName = 'DashboardThemeTileCard'
