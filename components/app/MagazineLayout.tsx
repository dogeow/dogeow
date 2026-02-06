'use client'

import { memo, useMemo, useState, useCallback } from 'react'
import Image from 'next/image'
import { Lock, ArrowRight } from 'lucide-react'
import type { Tile } from '@/app/types'
import { useTranslation } from '@/hooks/useTranslation'
import { PERFORMANCE } from '@/lib/constants'

interface MagazineTileCardProps {
  tile: Tile
  index: number
  showCover: boolean
  needsLogin: boolean
  onClick: () => void
  variant: 'hero' | 'card'
}

const BLUR_DATA_URL =
  'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k='

/** 杂志布局 - Hero 卡片（第一个磁贴，大尺寸展示） */
const HeroCard = memo(
  ({ tile, showCover, needsLogin, onClick }: Omit<MagazineTileCardProps, 'variant' | 'index'>) => {
    const { t } = useTranslation()
    const [imageError, setImageError] = useState(false)
    const [imageLoaded, setImageLoaded] = useState(false)

    const tileName = useMemo(
      () => t(tile.nameKey, tile.nameCn || tile.nameKey),
      [t, tile.nameKey, tile.nameCn]
    )
    const coverImage = useMemo(
      () => (showCover ? tile.cover || `${tile.name}.png` : null),
      [showCover, tile.cover, tile.name]
    )
    const hasBackground = useMemo(() => !!coverImage && !imageError, [coverImage, imageError])
    const handleImageError = useCallback(() => setImageError(true), [])
    const handleImageLoad = useCallback(() => setImageLoaded(true), [])

    return (
      <button
        type="button"
        onClick={onClick}
        className="group relative flex w-full overflow-hidden rounded-2xl border-0 text-left transition-all duration-300 outline-none hover:scale-[0.98] hover:shadow-xl focus-visible:ring-2 focus-visible:ring-white/80 active:scale-[0.96]"
        style={{ backgroundColor: tile.color, minHeight: '220px' }}
        aria-label={needsLogin ? `打开 ${tileName}（需登录）` : `打开 ${tileName}`}
      >
        {/* 背景图 */}
        {hasBackground && (
          <Image
            src={`/images/projects/${coverImage}`}
            alt={`${tileName} background`}
            fill
            className={`object-cover transition-all duration-500 group-hover:scale-105 ${
              imageLoaded ? 'opacity-60' : 'opacity-0'
            }`}
            sizes="(max-width: 768px) 100vw, 80vw"
            priority
            onError={handleImageError}
            onLoad={handleImageLoad}
            quality={PERFORMANCE.IMAGE_QUALITY}
            placeholder="blur"
            blurDataURL={BLUR_DATA_URL}
          />
        )}

        {/* 渐变遮罩 */}
        <div
          className="absolute inset-0 z-[1]"
          style={{
            background: `linear-gradient(135deg, ${tile.color}cc 0%, ${tile.color}60 100%)`,
          }}
        />

        {/* 内容 */}
        <div className="relative z-[2] flex flex-1 flex-col justify-end p-6 sm:p-8">
          {needsLogin && (
            <div className="absolute top-4 right-4 flex h-7 w-7 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm">
              <Lock className="h-3.5 w-3.5 text-white" />
            </div>
          )}

          <div className="flex items-end justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                {tile.icon && (
                  <div
                    className="h-8 w-8 text-white sm:h-10 sm:w-10"
                    style={{ filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))' }}
                  >
                    {tile.icon}
                  </div>
                )}
                <h2
                  className="text-2xl font-bold text-white sm:text-3xl"
                  style={{ textShadow: '0 2px 8px rgba(0, 0, 0, 0.3)' }}
                >
                  {tileName}
                </h2>
              </div>
            </div>
            <ArrowRight className="h-6 w-6 text-white/70 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-white" />
          </div>
        </div>
      </button>
    )
  }
)

HeroCard.displayName = 'HeroCard'

/** 杂志布局 - 普通卡片（列表样式，带图标和箭头） */
const ListCard = memo(
  ({ tile, showCover, needsLogin, onClick }: Omit<MagazineTileCardProps, 'variant' | 'index'>) => {
    const { t } = useTranslation()

    const tileName = useMemo(
      () => t(tile.nameKey, tile.nameCn || tile.nameKey),
      [t, tile.nameKey, tile.nameCn]
    )

    return (
      <button
        type="button"
        onClick={onClick}
        className="bg-card hover:bg-accent group focus-visible:ring-primary flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-all duration-200 outline-none hover:shadow-md focus-visible:ring-2 active:scale-[0.98]"
        aria-label={needsLogin ? `打开 ${tileName}（需登录）` : `打开 ${tileName}`}
      >
        {/* 图标 */}
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white"
          style={{ backgroundColor: tile.color }}
        >
          {tile.icon && <div className="flex h-5 w-5 items-center justify-center">{tile.icon}</div>}
        </div>

        {/* 标题 */}
        <div className="flex-1">
          <span className="text-foreground text-base font-medium">{tileName}</span>
        </div>

        {/* 右侧 */}
        <div className="flex items-center gap-2">
          {needsLogin && (
            <div className="bg-muted flex h-5 w-5 items-center justify-center rounded-full">
              <Lock className="text-muted-foreground h-3 w-3" />
            </div>
          )}
          <ArrowRight className="text-muted-foreground h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
        </div>
      </button>
    )
  }
)

ListCard.displayName = 'ListCard'

/** 杂志风格布局 */
export const MagazineLayout = memo(
  ({
    tiles,
    showProjectCovers,
    getTileStatus,
    handleTileClick,
  }: {
    tiles: Tile[]
    showProjectCovers: boolean
    getTileStatus: (tile: Tile) => { needsLogin: boolean }
    handleTileClick: (tile: Tile) => void
  }) => {
    if (tiles.length === 0) return null

    return (
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {tiles.map(tile => {
          const tileStatus = getTileStatus(tile)
          return (
            <ListCard
              key={tile.name}
              tile={tile}
              showCover={showProjectCovers}
              needsLogin={tileStatus.needsLogin}
              onClick={() => handleTileClick(tile)}
            />
          )
        })}
      </div>
    )
  }
)

MagazineLayout.displayName = 'MagazineLayout'
