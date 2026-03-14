'use client'

import { memo, useCallback, useMemo, useState } from 'react'
import Image from 'next/image'
import { Lock } from 'lucide-react'
import type { Tile } from '@/app/types'
import { useTranslation } from '@/hooks/useTranslation'
import { PERFORMANCE } from '@/lib/constants'
import { imageAsset } from '@/lib/helpers/assets'
import type { ProjectCoverMode } from '@/stores/projectCoverStore'

interface IconLayoutProps {
  tiles: Tile[]
  projectCoverMode: ProjectCoverMode
  getTileStatus: (tile: Tile) => { needsLogin: boolean }
  handleTileClick: (tile: Tile) => void
}

interface IconTileProps {
  tile: Tile
  index: number
  projectCoverMode: ProjectCoverMode
  needsLogin: boolean
  onClick: () => void
}

const IconTile = memo(({ tile, index, projectCoverMode, needsLogin, onClick }: IconTileProps) => {
  const { t } = useTranslation()
  const [imageError, setImageError] = useState(false)

  const tileName = useMemo(
    () => t(tile.nameKey, tile.nameCn || tile.nameKey),
    [t, tile.nameCn, tile.nameKey]
  )
  const coverImage = useMemo(
    () => (projectCoverMode === 'image' ? tile.cover || `${tile.name}.png` : null),
    [projectCoverMode, tile.cover, tile.name]
  )
  const showImagePattern = !!coverImage && !imageError
  const handleImageError = useCallback(() => setImageError(true), [])

  const shellClassName = useMemo(() => {
    const baseClassName =
      'relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-[24px] transition-transform duration-200 group-hover:scale-[1.03] group-active:scale-[0.98]'

    if (projectCoverMode === 'image') {
      return `${baseClassName} bg-white/80 shadow-[0_14px_30px_rgba(15,23,42,0.16)] dark:bg-white/8 dark:shadow-[0_18px_36px_rgba(0,0,0,0.35)]`
    }

    if (projectCoverMode === 'color') {
      return `${baseClassName} shadow-[0_14px_30px_rgba(15,23,42,0.18)]`
    }

    return `${baseClassName} bg-card border border-border/60 shadow-[0_12px_24px_rgba(15,23,42,0.10)] dark:bg-neutral-950 dark:border-white/8 dark:shadow-[0_18px_36px_rgba(0,0,0,0.28)]`
  }, [projectCoverMode])

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex min-w-0 flex-col items-center gap-2 text-center outline-none transition-transform duration-200 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      aria-label={needsLogin ? `打开 ${tileName}（需登录）` : `打开 ${tileName}`}
    >
      <div
        className={shellClassName}
        style={projectCoverMode === 'color' ? { backgroundColor: tile.color } : undefined}
      >
        {showImagePattern && (
          <>
            <Image
              src={imageAsset(`/images/projects/${coverImage}`)}
              alt={`${tileName} icon pattern`}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 20vw, 120px"
              priority={index < 4}
              onError={handleImageError}
              quality={PERFORMANCE.IMAGE_QUALITY}
            />
            <div className="absolute inset-0 bg-black/28" />
          </>
        )}

        <div
          className={`relative z-[1] flex h-8 w-8 items-center justify-center sm:h-10 sm:w-10 ${
            projectCoverMode === 'none'
              ? 'text-foreground dark:text-white'
              : 'text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.28)]'
          }`}
        >
          {tile.icon}
        </div>

        {needsLogin && (
          <div className="absolute top-2 right-2 z-[2] flex h-5 w-5 items-center justify-center rounded-full bg-black/55">
            <Lock className="h-3 w-3 text-white" />
          </div>
        )}
      </div>

      <span className="line-clamp-2 min-h-[2.5rem] text-xs font-medium leading-5 text-foreground sm:text-sm">
        {tileName}
      </span>
    </button>
  )
})

IconTile.displayName = 'IconTile'

export const IconLayout = memo(
  ({ tiles, projectCoverMode, getTileStatus, handleTileClick }: IconLayoutProps) => (
    <div className="grid grid-cols-4 gap-x-4 gap-y-6 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7">
      {tiles.map((tile, index) => {
        const tileStatus = getTileStatus(tile)

        return (
          <IconTile
            key={tile.name}
            tile={tile}
            index={index}
            projectCoverMode={projectCoverMode}
            needsLogin={tileStatus.needsLogin}
            onClick={() => handleTileClick(tile)}
          />
        )
      })}
    </div>
  )
)

IconLayout.displayName = 'IconLayout'
