import { memo, useState, useCallback, useMemo } from 'react'
import Image from 'next/image'
import { Lock } from 'lucide-react'
import type { Tile } from '@/app/types'
import { useTranslation } from '@/hooks/useTranslation'
import { PERFORMANCE } from '@/lib/constants'

// 常量定义
const TILE_CLASSES = {
  BASE: [
    'tile-card',
    'w-full h-full min-h-[8rem]',
    'relative flex flex-col items-start justify-end',
    'p-3 sm:p-4 rounded-lg overflow-hidden',
    'transition-[transform,box-shadow,filter] duration-200 ease-in-out',
    'hover:scale-95 active:scale-90 cursor-pointer',
    'shadow-sm hover:shadow-md',
    'will-change-transform',
    'border-0 text-left outline-none',
    'focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-black/30',
    'motion-reduce:transition-none motion-reduce:hover:scale-100 motion-reduce:active:scale-100',
  ].join(' '),
  GRADIENT_OVERLAY: 'absolute inset-0 z-[2]',
  LOCK_ICON:
    'bg-opacity-60 absolute top-1.5 right-1.5 z-[3] flex h-5 w-5 items-center justify-center rounded-full bg-black backdrop-blur-sm sm:top-2 sm:right-2 sm:h-6 sm:w-6',
  CONTENT: 'relative z-[2] flex items-center gap-2',
  TITLE: 'text-lg leading-tight font-medium text-white sm:text-xl',
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
  showCover: boolean
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
  ({ tile, tileName, index }: { tile: Tile; tileName: string; index: number }) => {
    if (!tile.icon) return null

    if (typeof tile.icon === 'string' && tile.icon.length > 0) {
      return (
        <Image
          src={`/images/projects/${tile.icon}`}
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
        className="h-5 w-5 text-white sm:h-6 sm:w-6"
        style={{ filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.5))' }}
      >
        {tile.icon}
      </div>
    )
  }
)

TileIcon.displayName = 'TileIcon'

export const TileCard = memo(
  ({ tile, index, customStyles = '', showCover, needsLogin, onClick }: TileCardProps) => {
    const { t } = useTranslation()
    const [imageError, setImageError] = useState(false)
    const [imageLoaded, setImageLoaded] = useState(false)

    // 缓存计算结果
    const tileName = useMemo(
      () => t(tile.nameKey, tile.nameCn || tile.nameKey),
      [t, tile.nameKey, tile.nameCn]
    )
    const coverImage = useMemo(
      () => (showCover ? tile.cover || `${tile.name}.png` : null),
      [showCover, tile.cover, tile.name]
    )
    const hasBackground = useMemo(() => !!coverImage && !imageError, [coverImage, imageError])
    const gridArea = useMemo(() => tile.gridArea || tile.name, [tile.gridArea, tile.name])

    // 事件处理器
    const handleImageError = useCallback(() => setImageError(true), [])
    const handleImageLoad = useCallback(() => setImageLoaded(true), [])

    // 样式计算
    const className = useMemo(() => `${TILE_CLASSES.BASE} ${customStyles}`, [customStyles])
    const dynamicStyles = useMemo(
      () => ({
        backgroundColor: `${tile.color}b3`,
        opacity: needsLogin ? 0.7 : 1,
        backdropFilter: 'blur(1px)',
      }),
      [tile.color, needsLogin]
    )

    const gradientStyle = useMemo(
      () => ({
        background: `linear-gradient(135deg, ${tile.color}80, ${tile.color}40)`,
      }),
      [tile.color]
    )
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
        {/* 背景图片 */}
        {hasBackground && (
          <>
            <Image
              src={`/images/projects/${coverImage}`}
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
            {/* 渐变遮罩 */}
            <div className={TILE_CLASSES.GRADIENT_OVERLAY} style={gradientStyle} />
          </>
        )}

        {/* 登录锁定图标 */}
        {needsLogin && (
          <div className={TILE_CLASSES.LOCK_ICON}>
            <Lock className="h-2.5 w-2.5 text-white sm:h-3 sm:w-3" />
          </div>
        )}

        {/* 标题和图标 */}
        <div className={TILE_CLASSES.CONTENT}>
          {tile.icon && (
            <div className="flex items-center justify-center">
              <TileIcon tile={tile} tileName={tileName} index={index} />
            </div>
          )}

          <span
            className={TILE_CLASSES.TITLE}
            style={{ textShadow: '0 1px 3px rgba(0, 0, 0, 0.5)' }}
          >
            {tileName}
          </span>
        </div>
      </button>
    )
  }
)

TileCard.displayName = 'TileCard'
