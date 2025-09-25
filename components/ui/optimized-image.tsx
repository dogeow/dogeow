import { memo, useState, useCallback } from 'react'
import Image, { ImageProps } from 'next/image'
import { cn } from '@/lib/helpers'

interface OptimizedImageProps extends Omit<ImageProps, 'onLoad' | 'onError'> {
  fallbackSrc?: string
  showLoadingSpinner?: boolean
  containerClassName?: string
  onLoadComplete?: () => void
  onError?: () => void
}

// 默认的模糊占位符
const DEFAULT_BLUR_DATA_URL =
  'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k='

export const OptimizedImage = memo(
  ({
    src,
    alt,
    fallbackSrc,
    showLoadingSpinner = false,
    containerClassName,
    className,
    onLoadComplete,
    onError,
    placeholder = 'blur',
    blurDataURL = DEFAULT_BLUR_DATA_URL,
    quality = 85,
    ...props
  }: OptimizedImageProps) => {
    const [isLoading, setIsLoading] = useState(true)
    const [hasError, setHasError] = useState(false)
    const [currentSrc, setCurrentSrc] = useState(src)

    const handleLoad = useCallback(() => {
      setIsLoading(false)
      onLoadComplete?.()
    }, [onLoadComplete])

    const handleError = useCallback(() => {
      setIsLoading(false)
      setHasError(true)

      if (fallbackSrc && currentSrc !== fallbackSrc) {
        setCurrentSrc(fallbackSrc)
        setHasError(false)
        setIsLoading(true)
      }

      onError?.()
    }, [fallbackSrc, currentSrc, onError])

    return (
      <div className={cn('relative overflow-hidden', containerClassName)}>
        {/* 加载指示器 */}
        {showLoadingSpinner && isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
          </div>
        )}

        {/* 错误状态 */}
        {hasError && !fallbackSrc && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-500 dark:bg-gray-800">
            <span className="text-sm">图片加载失败</span>
          </div>
        )}

        {/* 主图片 */}
        <Image
          {...props}
          src={currentSrc}
          alt={alt}
          className={cn(
            'transition-opacity duration-300',
            isLoading ? 'opacity-0' : 'opacity-100',
            className
          )}
          placeholder={placeholder}
          blurDataURL={blurDataURL}
          quality={quality}
          onLoad={handleLoad}
          onError={handleError}
        />
      </div>
    )
  }
)

OptimizedImage.displayName = 'OptimizedImage'
