'use client'

import { memo, useMemo, useState, useCallback } from 'react'
import Image from 'next/image'
import { Lock } from 'lucide-react'
import type { Tile } from '@/app/types'
import { useTranslation } from '@/hooks/useTranslation'
import { PERFORMANCE } from '@/lib/constants'
import { imageAsset } from '@/lib/helpers/assets'
import type { ProjectCoverMode } from '@/stores/projectCoverStore'

interface MagazineTileCardProps {
  tile: Tile
  index: number
  projectCoverMode: ProjectCoverMode
  needsLogin: boolean
  onClick: () => void
  variant: 'hero' | 'card'
}

const BLUR_DATA_URL =
  'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k='

/** 杂志布局 - Hero 卡片（首卡大图，稳重简洁） */
const HeroCard = memo(
  ({
    tile,
    projectCoverMode,
    needsLogin,
    onClick,
  }: Omit<MagazineTileCardProps, 'variant' | 'index'>) => {
    const { t } = useTranslation()
    const [imageError, setImageError] = useState(false)
    const [imageLoaded, setImageLoaded] = useState(false)

    const tileName = useMemo(
      () => t(tile.nameKey, tile.nameCn || tile.nameKey),
      [t, tile.nameKey, tile.nameCn]
    )
    const usesDecoratedCover = useMemo(() => projectCoverMode !== 'none', [projectCoverMode])
    const coverImage = useMemo(
      () => (projectCoverMode === 'image' ? tile.cover || `${tile.name}.png` : null),
      [projectCoverMode, tile.cover, tile.name]
    )
    const hasBackground = useMemo(() => !!coverImage && !imageError, [coverImage, imageError])
    const handleImageError = useCallback(() => setImageError(true), [])
    const handleImageLoad = useCallback(() => setImageLoaded(true), [])

    return (
      <button
        type="button"
        onClick={onClick}
        className="group relative flex w-full overflow-hidden rounded-xl border border-white/15 text-left shadow-sm outline-none transition-all duration-200 hover:scale-[0.99] hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98]"
        style={{
          backgroundColor: usesDecoratedCover ? tile.color : 'hsl(var(--card))',
          minHeight: '200px',
        }}
        aria-label={needsLogin ? `打开 ${tileName}（需登录）` : `打开 ${tileName}`}
      >
        {/* 背景图 */}
        {hasBackground && (
          <Image
            src={imageAsset(`/images/projects/${coverImage}`)}
            alt={`${tileName} background`}
            fill
            className={`object-cover transition-opacity duration-300 ${
              imageLoaded ? 'opacity-50' : 'opacity-0'
            } group-hover:opacity-55`}
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
        {usesDecoratedCover && (
          <div
            className="absolute inset-0 z-[1]"
            style={{
              background: `linear-gradient(135deg, ${tile.color}cc 0%, ${tile.color}55 100%)`,
            }}
          />
        )}

        {/* 内容 */}
        <div className="relative z-[2] flex flex-1 flex-col justify-end p-5 sm:p-6">
          {needsLogin && (
            <div className="absolute top-3 right-3 flex h-6 w-6 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm">
              <Lock className="h-3 w-3 text-white" />
            </div>
          )}

          <div className="flex items-end justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              {tile.icon && (
                <div
                  className="h-8 w-8 shrink-0 text-white sm:h-9 sm:w-9"
                  style={{ filter: 'drop-shadow(0 1px 3px rgba(0, 0, 0, 0.4))' }}
                >
                  {tile.icon}
                </div>
              )}
              <h2 className="text-xl font-semibold leading-tight text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.4)] sm:text-2xl">
                {tileName}
              </h2>
            </div>
          </div>
        </div>
      </button>
    )
  }
)

HeroCard.displayName = 'HeroCard'

/** 杂志布局 - 普通卡片（列表样式，带图标和箭头） */
const ListCard = memo(
  ({
    tile,
    projectCoverMode,
    needsLogin,
    onClick,
  }: Omit<MagazineTileCardProps, 'variant' | 'index'>) => {
    const { t } = useTranslation()
    const [imageError, setImageError] = useState(false)

    const tileName = useMemo(
      () => t(tile.nameKey, tile.nameCn || tile.nameKey),
      [t, tile.nameKey, tile.nameCn]
    )
    const coverImage = useMemo(
      () => (projectCoverMode === 'image' ? tile.cover || `${tile.name}.png` : null),
      [projectCoverMode, tile.cover, tile.name]
    )
    const handleImageError = useCallback(() => setImageError(true), [])
    const showPreview = projectCoverMode !== 'none'
    const showImagePreview = !!coverImage && !imageError
    const contentTextClassName = showPreview ? 'text-white' : 'text-foreground'

    return (
      <button
        type="button"
        onClick={onClick}
        className={`group relative flex w-full items-center gap-4 overflow-hidden rounded-xl border p-4 text-left transition-all duration-200 outline-none hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98] ${
          showPreview
            ? 'min-h-28 border-white/15 shadow-[0_18px_40px_rgba(15,23,42,0.18)]'
            : 'bg-card/70 border-border backdrop-blur-[1px] hover:bg-accent/80'
        }`}
        style={showPreview && !showImagePreview ? { backgroundColor: tile.color } : undefined}
        aria-label={needsLogin ? `打开 ${tileName}（需登录）` : `打开 ${tileName}`}
      >
        {showPreview && showImagePreview && (
          <Image
            src={imageAsset(`/images/projects/${coverImage}`)}
            alt={tileName}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 960px"
            onError={handleImageError}
            quality={PERFORMANCE.IMAGE_QUALITY}
          />
        )}

        {showPreview && (
          <div
            className="absolute inset-0 z-[1]"
            style={{
              background: showImagePreview
                ? 'linear-gradient(90deg, rgba(15,23,42,0.72) 0%, rgba(15,23,42,0.36) 45%, rgba(15,23,42,0.18) 100%)'
                : `linear-gradient(135deg, ${tile.color} 0%, ${tile.color}cc 100%)`,
            }}
          />
        )}

        {/* 图标 */}
        <div
          className={`relative z-[2] flex h-10 w-10 shrink-0 items-center justify-center rounded-lg sm:h-11 sm:w-11 sm:rounded-xl ${
            showPreview
              ? 'bg-black/20 text-white backdrop-blur-[2px]'
              : 'bg-transparent text-foreground dark:text-white'
          }`}
        >
          {tile.icon && (
            <div className="flex h-5 w-5 items-center justify-center sm:h-6 sm:w-6">
              {tile.icon}
            </div>
          )}
        </div>

        {/* 标题 */}
        <div className="relative z-[2] min-w-0 flex-1">
          <span className={`${contentTextClassName} text-base font-medium leading-tight`}>
            {tileName}
          </span>
        </div>

        {/* 右侧 */}
        <div className="relative z-[2] flex shrink-0 items-center gap-2">
          {needsLogin && (
            <div
              className={`flex h-6 w-6 items-center justify-center rounded-full ${
                showPreview ? 'bg-black/25 backdrop-blur-[2px]' : 'bg-muted'
              }`}
            >
              <Lock className={`h-3 w-3 ${showPreview ? 'text-white' : 'text-muted-foreground'}`} />
            </div>
          )}
        </div>
      </button>
    )
  }
)

ListCard.displayName = 'ListCard'

/** 杂志风格布局：所有卡片统一列表样式 */
export const MagazineLayout = memo(
  ({
    tiles,
    projectCoverMode,
    getTileStatus,
    handleTileClick,
  }: {
    tiles: Tile[]
    projectCoverMode: ProjectCoverMode
    getTileStatus: (tile: Tile) => { needsLogin: boolean }
    handleTileClick: (tile: Tile) => void
  }) => {
    if (tiles.length === 0) return null

    return (
      <div className="grid grid-cols-1 gap-4">
        {tiles.map(tile => {
          const tileStatus = getTileStatus(tile)
          return (
            <ListCard
              key={tile.name}
              tile={tile}
              projectCoverMode={projectCoverMode}
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
