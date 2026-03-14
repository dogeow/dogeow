import { memo, useState, useCallback, useMemo } from 'react'
import Image from 'next/image'
import { Lock } from 'lucide-react'
import type { Tile } from '@/app/types'
import { useTranslation } from '@/hooks/useTranslation'
import { PERFORMANCE } from '@/lib/constants'
import { imageAsset } from '@/lib/helpers/assets'
import type { ProjectCoverMode } from '@/stores/projectCoverStore'

// 常量定义：与 MagazineLayout 列表卡统一圆角与焦点样式
const TILE_CLASSES = {
  BASE: [
    'tile-card',
    'w-full h-full min-h-[8rem]',
    'relative flex flex-col items-start justify-end',
    'p-3 sm:p-4 rounded-xl overflow-hidden',
    'shadow-sm',
    'transition-[transform,box-shadow,border-color] duration-200 ease-in-out',
    'hover:scale-[0.98] hover:shadow-md cursor-pointer',
    'active:scale-[0.97]',
    'will-change-transform',
    'text-left outline-none',
    'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
    'motion-reduce:transition-none motion-reduce:hover:scale-100 motion-reduce:active:scale-100',
  ].join(' '),
  BORDERED:
    'border border-white/30 bg-white/10 backdrop-blur-md hover:border-white/40 dark:border-white/5 dark:bg-neutral-950 dark:hover:border-white/10',
  LOCK_ICON:
    'absolute top-2 right-2 z-[3] flex h-6 w-6 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm',
  CONTENT: 'relative z-[2] flex items-center gap-2.5',
  TITLE: 'text-base font-medium leading-tight sm:text-lg',
  SKELETON_OVERLAY: 'absolute inset-0 z-[4] animate-pulse bg-muted/80',
  GLASS_AURORA:
    'pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.42),transparent_36%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.18),transparent_32%)] dark:hidden',
  GLASS_HIGHLIGHT:
    'pointer-events-none absolute inset-x-3 top-0 z-[2] h-px bg-white/55 dark:hidden',
  GLASS_ICON_SHELL:
    'rounded-lg bg-white/30 p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.55),0_6px_18px_rgba(15,23,42,0.08)] backdrop-blur-sm dark:bg-white/5 dark:shadow-none dark:backdrop-blur-none',
} as const

const IMAGE_SIZES = {
  LARGE: '(max-width: 640px) 300px, 200px',
  MEDIUM: '(max-width: 640px) 200px, 150px',
  SMALL: '(max-width: 640px) 150px, 120px',
  ICON: '(max-width: 640px) 32px, 40px',
} as const

const BLUR_DATA_URL =
  'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k='

interface TileCardProps {
  tile: Tile
  index: number
  customStyles?: string
  projectCoverMode: ProjectCoverMode
  needsLogin: boolean
  onClick: () => void
}

// 提取图片尺寸计算逻辑
const getImageSizes = (gridArea: string): string => {
  if (gridArea === 'thing') return IMAGE_SIZES.LARGE
  if (gridArea === 'file' || gridArea === 'tool') return IMAGE_SIZES.MEDIUM
  return IMAGE_SIZES.SMALL
}

// 提取图标组件
const TileIcon = memo(
  ({
    tile,
    tileName,
    index,
    decorated,
  }: {
    tile: Tile
    tileName: string
    index: number
    decorated: boolean
  }) => {
    if (!tile.icon) return null

    if (typeof tile.icon === 'string' && tile.icon.length > 0) {
      return (
        <Image
          src={imageAsset(`/images/projects/${tile.icon}`)}
          alt={tileName}
          width={24}
          height={24}
          className="object-contain sm:h-6 sm:w-6"
          sizes={IMAGE_SIZES.ICON}
          priority={index < 4}
          quality={PERFORMANCE.IMAGE_QUALITY}
        />
      )
    }

    return (
      <div
        className={`h-5 w-5 shrink-0 sm:h-6 sm:w-6 ${decorated ? 'text-foreground dark:text-white' : 'text-foreground'}`}
        style={decorated ? { filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.18))' } : undefined}
      >
        {tile.icon}
      </div>
    )
  }
)

TileIcon.displayName = 'TileIcon'

export const TileCard = memo(
  ({ tile, index, customStyles = '', projectCoverMode, needsLogin, onClick }: TileCardProps) => {
    const { t } = useTranslation()
    const [imageError, setImageError] = useState(false)
    const [imageLoaded, setImageLoaded] = useState(false)

    // 缓存计算结果
    const tileName = useMemo(
      () => t(tile.nameKey, tile.nameCn || tile.nameKey),
      [t, tile.nameKey, tile.nameCn]
    )
    const usesDecoratedCover = useMemo(() => projectCoverMode !== 'none', [projectCoverMode])
    const coverImage = useMemo(
      () => (projectCoverMode === 'image' ? tile.cover || `${tile.name}.png` : null),
      [projectCoverMode, tile.cover, tile.name]
    )
    const hasBackgroundImage = useMemo(() => !!coverImage && !imageError, [coverImage, imageError])
    const gridArea = useMemo(() => tile.gridArea || tile.name, [tile.gridArea, tile.name])

    // 事件处理器
    const handleImageError = useCallback(() => setImageError(true), [])
    const handleImageLoad = useCallback(() => setImageLoaded(true), [])

    // 样式计算
    const className = useMemo(
      () =>
        [TILE_CLASSES.BASE, usesDecoratedCover ? '' : TILE_CLASSES.BORDERED, customStyles]
          .filter(Boolean)
          .join(' '),
      [customStyles, usesDecoratedCover]
    )
    const dynamicStyles = useMemo(() => {
      const baseStyle = {
        opacity: needsLogin ? 0.7 : 1,
      }

      if (!usesDecoratedCover) {
        return {
          ...baseStyle,
          boxShadow: '0 14px 30px rgba(15, 23, 42, 0.10)',
        }
      }

      return {
        ...baseStyle,
        backgroundColor: `${tile.color}b3`,
        backdropFilter: 'blur(1px)',
      }
    }, [needsLogin, tile.color, usesDecoratedCover])

    const showSkeleton = hasBackgroundImage && !imageLoaded
    const ariaLabel = useMemo(
      () => (needsLogin ? `打开 ${tileName}（需登录）` : `打开 ${tileName}`),
      [needsLogin, tileName]
    )

    return (
      <button
        type="button"
        className={className}
        style={dynamicStyles}
        onClick={onClick}
        aria-label={ariaLabel}
      >
        {!usesDecoratedCover && !showSkeleton && (
          <>
            <div className={TILE_CLASSES.GLASS_AURORA} />
            <div className={TILE_CLASSES.GLASS_HIGHLIGHT} />
          </>
        )}

        {/* 背景图片 */}
        {hasBackgroundImage && (
          <>
            <Image
              src={imageAsset(`/images/projects/${coverImage}`)}
              alt={`${tileName} background`}
              fill
              className={`tile-image z-[1] object-cover transition-opacity duration-300 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              sizes={getImageSizes(gridArea)}
              priority={index < 4}
              onError={handleImageError}
              onLoad={handleImageLoad}
              quality={PERFORMANCE.IMAGE_QUALITY}
              placeholder="blur"
              blurDataURL={BLUR_DATA_URL}
            />
          </>
        )}

        {showSkeleton && (
          <>
            <div className={TILE_CLASSES.SKELETON_OVERLAY} />
            <div className="relative z-[5] mt-auto flex items-center gap-2.5 p-3 pr-6 sm:p-4 sm:pr-8">
              <div className="h-5 w-5 rounded-md bg-white/30 sm:h-6 sm:w-6" />
              <div className="h-5 w-16 rounded bg-white/30 sm:h-6 sm:w-20" />
            </div>
          </>
        )}

        {/* 登录锁定图标 */}
        {needsLogin && !showSkeleton && (
          <div className={TILE_CLASSES.LOCK_ICON}>
            <Lock className="h-3 w-3 text-white" />
          </div>
        )}

        {/* 标题和图标 */}
        <div className={`${TILE_CLASSES.CONTENT} ${showSkeleton ? 'opacity-0' : 'opacity-100'}`}>
          {tile.icon && (
            <div
              className={`flex items-center justify-center ${
                usesDecoratedCover ? '' : TILE_CLASSES.GLASS_ICON_SHELL
              }`}
            >
              <TileIcon
                tile={tile}
                tileName={tileName}
                index={index}
                decorated={usesDecoratedCover}
              />
            </div>
          )}

          <span
            className={`${TILE_CLASSES.TITLE} ${usesDecoratedCover ? 'text-foreground dark:text-white' : 'text-foreground'}`}
            style={
              usesDecoratedCover ? { textShadow: '0 1px 2px rgba(255, 255, 255, 0.2)' } : undefined
            }
          >
            {tileName}
          </span>
        </div>
      </button>
    )
  }
)

TileCard.displayName = 'TileCard'
