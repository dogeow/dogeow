import { memo, useState, useCallback, KeyboardEvent } from 'react'
import Image from 'next/image'
import { Lock } from 'lucide-react'
import type { Tile } from '@/app/types'

interface TileCardProps {
  tile: Tile
  index: number
  keyPrefix: string
  customStyles?: string
  showCover: boolean
  needsLogin: boolean
  onClick: () => void
}

export const TileCard = memo(
  ({ tile, index, customStyles = '', showCover, needsLogin, onClick }: TileCardProps) => {
    const [imageError, setImageError] = useState(false)
    const [imageLoaded, setImageLoaded] = useState(false)

    const coverImage = showCover ? tile.cover || `${tile.name}.png` : null
    const hasBackground = !!coverImage && !imageError

    // 图片加载失败
    const handleImageError = useCallback(() => setImageError(true), [])

    // 图片加载完成
    const handleImageLoad = useCallback(() => setImageLoaded(true), [])

    // 键盘可访问
    const handleKeyDown = useCallback(
      (e: KeyboardEvent<HTMLDivElement>) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      },
      [onClick]
    )

    const baseClasses = [
      'tile-card',
      'w-full h-full min-h-[8rem]',
      'relative flex flex-col items-start justify-end',
      'p-3 sm:p-4 rounded-lg overflow-hidden',
      'transition-all duration-200 ease-in-out',
      'hover:scale-95 active:scale-90 cursor-pointer',
      'shadow-sm hover:shadow-md',
      'will-change-transform', // 优化动画性能
      customStyles,
    ].join(' ')

    const dynamicStyles = {
      backgroundColor: tile.color,
      opacity: needsLogin ? 0.7 : 1,
    }

    // 根据网格区域优化图片sizes属性
    const getImageSizes = () => {
      // 根据 grid area 名称判断大小
      const gridArea = tile.gridArea || tile.name

      let sizes = ''
      if (gridArea === 'thing') {
        // 占满整行的tile（物品管理）
        sizes = '(max-width: 640px) 300px, 200px'
      } else if (gridArea === 'file' || gridArea === 'tool') {
        // 占2/3宽度的tile（文件、工具）
        sizes = '(max-width: 640px) 200px, 150px'
      } else {
        // 占1/3宽度的tile（实验室、导航、笔记、游戏）
        sizes = '(max-width: 640px) 150px, 120px'
      }

      return sizes
    }

    const getIconSizes = () => {
      // 图标固定尺寸：小屏32px，大屏40px
      return '(max-width: 640px) 32px, 40px'
    }

    return (
      <div
        className={baseClasses}
        style={dynamicStyles}
        onClick={onClick}
        role="button"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        aria-label={`打开 ${tile.nameCn}`}
      >
        {/* 背景图片 */}
        {hasBackground && (
          <>
            <Image
              src={`/images/projects/${coverImage}`}
              alt={`${tile.nameCn} background`}
              fill
              className={`tile-image z-[1] object-cover transition-opacity duration-300 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              sizes={getImageSizes()}
              priority={index < 4}
              onError={handleImageError}
              onLoad={handleImageLoad}
              quality={85}
              placeholder="blur"
              blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
            />
            {/* 渐变遮罩 - 移除透明度变化 */}
            <div
              className="absolute inset-0 z-[2]"
              style={{
                background: `linear-gradient(135deg, ${tile.color}80, ${tile.color}40)`,
              }}
            />
          </>
        )}

        {/* 登录锁定图标 */}
        {needsLogin && (
          <div className="bg-opacity-60 absolute top-1.5 right-1.5 z-[3] flex h-5 w-5 items-center justify-center rounded-full bg-black backdrop-blur-sm sm:top-2 sm:right-2 sm:h-6 sm:w-6">
            <Lock className="h-2.5 w-2.5 text-white sm:h-3 sm:w-3" />
          </div>
        )}

        {/* 标题和图标 */}
        <div className="relative z-[2] flex items-center gap-2">
          {/* 图标 */}
          {tile.icon && (
            <div className="flex items-center justify-center">
              {typeof tile.icon === 'string' && tile.icon.length > 0 ? (
                <Image
                  src={`/images/projects/${tile.icon}`}
                  alt={tile.nameCn}
                  width={24}
                  height={24}
                  className="object-contain sm:h-6 sm:w-6"
                  sizes={getIconSizes()}
                  priority={index < 4}
                  quality={85}
                />
              ) : (
                <div
                  className="h-5 w-5 text-white sm:h-6 sm:w-6"
                  style={{ filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.5))' }}
                >
                  {tile.icon}
                </div>
              )}
            </div>
          )}

          {/* 标题 */}
          <span
            className="text-lg leading-tight font-medium text-white sm:text-xl"
            style={{ textShadow: '0 1px 3px rgba(0, 0, 0, 0.5)' }}
          >
            {tile.nameCn}
          </span>
        </div>
      </div>
    )
  }
)

TileCard.displayName = 'TileCard'
