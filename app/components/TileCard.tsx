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

    const coverImage = showCover ? tile.cover : null
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

    // 根据卡片尺寸优化图片sizes属性
    const getImageSizes = () => {
      // 根据tile的colSpan动态计算sizes，避免100vw在高分辨率屏幕上产生过大值：
      const colSpan = tile.colSpan || 1

      let sizes = ''
      if (colSpan === 3) {
        // 占满整行的tile（如物品管理）- 即使在小屏幕也限制尺寸
        sizes = '(max-width: 640px) 300px, 200px'
      } else if (colSpan === 2) {
        // 占2/3宽度的tile（如文件、工具）- 中等尺寸
        sizes = '(max-width: 640px) 200px, 150px'
      } else {
        // 占1/3宽度的tile（如实验室、导航、笔记、游戏）- 极小尺寸
        sizes = '(max-width: 640px) 150px, 120px'
      }

      // 添加详细调试信息
      if (typeof window !== 'undefined') {
        const isSmallScreen = window.innerWidth <= 640
        const effectiveSize = isSmallScreen
          ? colSpan === 3
            ? 300
            : colSpan === 2
              ? 200
              : 150
          : colSpan === 3
            ? 200
            : colSpan === 2
              ? 150
              : 120

        console.log(`TileCard ${tile.name}: colSpan=${colSpan}, sizes="${sizes}"`, {
          screenWidth: window.screen.width,
          viewportWidth: window.innerWidth,
          devicePixelRatio: window.devicePixelRatio,
          isSmallScreen,
          effectiveSize,
          withPixelRatio: effectiveSize * window.devicePixelRatio,
          expectedNextJSChoice: effectiveSize * window.devicePixelRatio,
        })
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
        aria-label={`打开 ${tile.name}`}
      >
        {/* 背景图片 */}
        {hasBackground && (
          <>
            <Image
              src={`/images/projects/${coverImage}`}
              alt={`${tile.name} background`}
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

        {/* 图标 */}
        {tile.icon && tile.icon.length > 0 && (
          <div className="absolute top-2 left-2 z-[2] flex h-8 w-8 items-center justify-center sm:top-3 sm:left-3 sm:h-10 sm:w-10">
            <Image
              src={`/images/projects/${tile.icon}`}
              alt={tile.name}
              width={40}
              height={40}
              className="object-contain sm:h-10 sm:w-10"
              sizes={getIconSizes()}
              priority={index < 4}
              quality={85}
            />
          </div>
        )}

        {/* 登录锁定图标 */}
        {needsLogin && (
          <div className="bg-opacity-60 absolute top-1.5 right-1.5 z-[3] flex h-5 w-5 items-center justify-center rounded-full bg-black backdrop-blur-sm sm:top-2 sm:right-2 sm:h-6 sm:w-6">
            <Lock className="h-2.5 w-2.5 text-white sm:h-3 sm:w-3" />
          </div>
        )}

        {/* 标题 */}
        <span
          className="relative z-[2] text-lg leading-tight font-medium text-white sm:text-xl"
          style={{ textShadow: '0 1px 3px rgba(0, 0, 0, 0.5)' }}
        >
          {tile.name}
        </span>
      </div>
    )
  }
)

TileCard.displayName = 'TileCard'
