'use client'

import { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { Globe } from 'lucide-react'
import ImagePlaceholder from '@/components/ui/icons/image-placeholder'

export interface ImageData {
  id?: number
  path?: string
  url?: string
  thumbnail_path?: string
  thumbnail_url?: string
  is_primary?: boolean
}

export interface ItemCardImageProps {
  initialPrimaryImage: ImageData | null | undefined
  images: ImageData[] | undefined
  itemName: string
  status: string
  isPublic: boolean
  size?: number // 新增 size 属性，单位 px
}

// 状态颜色映射
const STATUS_BORDER_COLORS = {
  expired: 'border-red-500',
  damaged: 'border-orange-500',
  idle: 'border-amber-500',
} as const

const getStatusBorderColor = (status: string): string => {
  return STATUS_BORDER_COLORS[status as keyof typeof STATUS_BORDER_COLORS] || 'border-transparent'
}

export default function ItemCardImage({
  initialPrimaryImage,
  images,
  itemName,
  status,
  isPublic,
  size,
}: ItemCardImageProps) {
  const [imageError, setImageError] = useState(false)

  // 使用 useMemo 优化主图片选择逻辑
  const primaryImage = useMemo(() => {
    if (initialPrimaryImage) {
      return initialPrimaryImage
    }
    if (images && images.length > 0) {
      return images.find(img => img.is_primary) || images[0]
    }
    return null
  }, [initialPrimaryImage, images])

  // 重置错误状态当图片变化时
  useEffect(() => {
    setImageError(false)
  }, [primaryImage])

  const imageSrc = primaryImage?.thumbnail_url || primaryImage?.url

  // 根据size动态设置sizes属性
  const sizesAttribute = useMemo(() => {
    if (size) {
      return `${size}px`
    }
    // 默认情况下的sizes（用于fill layout）
    return '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'
  }, [size])

  // 容器样式
  const containerClassName = useMemo(() => {
    const baseClasses = 'relative overflow-hidden rounded border-b-2'
    const statusColor = getStatusBorderColor(status)

    if (size) {
      return `${baseClasses} ${statusColor}`
    }
    return `${baseClasses} h-48 w-full rounded-t-lg ${statusColor}`
  }, [size, status])

  const containerStyle = useMemo(() => {
    return size ? { width: size, height: size } : {}
  }, [size])

  const placeholderSize = useMemo(() => {
    return size ? Math.floor(size * 0.6) : 48
  }, [size])

  const shouldUseUnoptimized = imageSrc?.startsWith('http') ?? false

  return (
    <div className={containerClassName} style={containerStyle}>
      {imageSrc && !imageError ? (
        <Image
          src={imageSrc}
          alt={`${itemName} 图片`}
          fill={!size}
          width={size}
          height={size}
          className="object-cover"
          onError={() => setImageError(true)}
          unoptimized={shouldUseUnoptimized}
          sizes={sizesAttribute}
          priority={false}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gray-50">
          <ImagePlaceholder className="text-gray-400 opacity-40" size={placeholderSize} />
        </div>
      )}
      {isPublic  ? (
        <Badge variant="secondary" className="absolute top-2 right-2">
          <Globe className="mr-1 h-3 w-3" />
          公开
        </Badge>
      ) : null}
    </div>
  )
}
