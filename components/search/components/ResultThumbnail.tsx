'use client'

import React, { memo } from 'react'
import Image from 'next/image'
import ImagePlaceholder from '@/components/ui/icons/image-placeholder'

/**
 * 结果缩略图组件 Props
 */
interface ResultThumbnailProps {
  src: string | null | undefined
  alt: string
  size?: number
  /** 图片加载错误回调 */
  onError?: () => void
}

/**
 * 结果缩略图组件
 *
 * 统一处理搜索结果的图片显示
 *
 * @example
 * ```tsx
 * <ResultThumbnail
 *   src={result.thumbnail_url}
 *   alt={result.title}
 *   onError={() => setImageError(true)}
 * />
 * ```
 */
export const ResultThumbnail = memo<ResultThumbnailProps>(({ src, alt, size = 64, onError }) => {
  const [hasError, setHasError] = React.useState(false)

  const handleError = () => {
    setHasError(true)
    onError?.()
  }

  if (!src || hasError) {
    return (
      <div
        className="bg-muted flex flex-shrink-0 items-center justify-center rounded"
        style={{ width: size, height: size }}
      >
        <ImagePlaceholder className="text-muted-foreground h-6 w-6 opacity-40" />
      </div>
    )
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={size}
      height={size}
      className="h-auto w-auto rounded object-cover"
      style={{ width: size, height: size }}
      onError={handleError}
    />
  )
})

ResultThumbnail.displayName = 'ResultThumbnail'
