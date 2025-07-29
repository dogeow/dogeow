import * as React from 'react'
import { cn } from '@/lib/helpers'
import Image from 'next/image'

const Avatar = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full', className)}
      {...props}
    />
  )
)
Avatar.displayName = 'Avatar'

const AvatarImage = React.forwardRef<HTMLImageElement, React.ImgHTMLAttributes<HTMLImageElement>>(
  ({ className, alt = '', src, width, height, ...props }, ref) => {
    const [imageError, setImageError] = React.useState(false)

    // 确保 src 存在，否则不渲染 Image 组件
    if (!src || imageError) {
      return null
    }

    // For dicebear SVGs, use unoptimized loading
    const shouldUnoptimize =
      src.includes('dicebear.com') || src.includes('ui-avatars.com') || src.includes('robohash.org')

    return (
      <Image
        ref={ref}
        className={cn('aspect-square h-full w-full', className)}
        alt={alt}
        src={src}
        width={typeof width === 'number' ? width : undefined}
        height={typeof height === 'number' ? height : undefined}
        unoptimized={shouldUnoptimize}
        onLoad={() => {
          console.log('Avatar image loaded:', src)
        }}
        onError={e => {
          console.error('Avatar image failed to load:', src, e)
          setImageError(true)
        }}
        {...props}
      />
    )
  }
)
AvatarImage.displayName = 'AvatarImage'

const AvatarFallback = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'bg-muted flex h-full w-full items-center justify-center rounded-full',
        className
      )}
      {...props}
    />
  )
)
AvatarFallback.displayName = 'AvatarFallback'

export { Avatar, AvatarImage, AvatarFallback }
