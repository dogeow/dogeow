import { memo, useState, useCallback } from "react"
import Image from "next/image"
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

export const TileCard = memo(({
  tile,
  index,
  keyPrefix,
  customStyles = '',
  showCover,
  needsLogin,
  onClick
}: TileCardProps) => {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  
  const coverImage = showCover ? tile.cover : null
  const hasBackground = !!coverImage && !imageError

  // 图片加载完成回调
  const handleImageLoad = useCallback(() => {
    setImageLoaded(true)
  }, [])

  // 图片加载错误回调
  const handleImageError = useCallback(() => {
    setImageError(true)
  }, [])

  // 基础样式类 - 填满Grid容器
  const baseClasses = `
    w-full h-full min-h-[8rem]
    relative flex flex-col items-start justify-end 
    p-3 sm:p-4 rounded-lg overflow-hidden 
    transition-all duration-200 ease-in-out
    hover:scale-95 active:scale-90 cursor-pointer
    shadow-sm hover:shadow-md
    ${hasBackground && !imageLoaded ? 'animate-pulse' : ''}
    ${customStyles}
  `

  // 动态样式 - 只保留必要的样式
  const dynamicStyles = {
    backgroundColor: tile.color,
    opacity: needsLogin ? 0.7 : 1,
  }

  return (
    <div
      className={baseClasses}
      style={dynamicStyles}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      }}
      aria-label={`打开 ${tile.name}`}
    >
      {/* 背景图片 */}
      {hasBackground && (
        <>
          <Image
            src={`/images/projects/${coverImage}`}
            alt={`${tile.name} background`}
            fill
            className={`object-cover z-[1] transition-opacity duration-300 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            priority={index < 4}
            onLoad={handleImageLoad}
            onError={handleImageError}
            quality={85}
            placeholder="blur"
            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
          />
          {/* 渐变遮罩 */}
          <div 
            className={`absolute inset-0 z-[2] transition-opacity duration-300 ${
              imageLoaded ? 'opacity-100' : 'opacity-80'
            }`}
            style={{
              background: `linear-gradient(135deg, ${tile.color}80, ${tile.color}40)`
            }}
          />
        </>
      )}

      {/* 图标 */}
      {tile.icon.length > 0 && (
        <div className="absolute top-2 left-2 sm:top-3 sm:left-3 w-8 h-8 sm:w-10 sm:h-10 z-[2] flex items-center justify-center">
          <Image
            src={`/images/projects/${tile.icon}`}
            alt={tile.name}
            width={32}
            height={32}
            className="object-contain sm:w-10 sm:h-10"
            sizes="(max-width: 640px) 32px, 40px"
            priority={index < 4}
            quality={85}
          />
        </div>
      )}

      {/* 登录锁定图标 */}
      {needsLogin && (
        <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 w-5 h-5 sm:w-6 sm:h-6 z-[3] flex items-center justify-center bg-black bg-opacity-60 rounded-full backdrop-blur-sm">
          <Lock className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-white" />
        </div>
      )}

      {/* 标题 - 响应式字体大小 */}
      <span 
        className="text-lg sm:text-xl text-white z-[2] relative font-medium leading-tight" 
        style={{ textShadow: '0 1px 3px rgba(0, 0, 0, 0.5)' }}
      >
        {tile.name}
      </span>
    </div>
  )
})

TileCard.displayName = 'TileCard' 