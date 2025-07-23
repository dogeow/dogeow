'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { Globe, AlertTriangleIcon } from 'lucide-react'

// Define ImageData interface locally as specified
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
const getStatusBorderColor = (status: string) => {
  switch (status) {
    case 'expired':
      return 'border-red-500'
    case 'damaged':
      return 'border-orange-500'
    case 'idle':
      return 'border-amber-500'
    default:
      return 'border-transparent'
  }
}

export default function ItemCardImage({
  initialPrimaryImage,
  images,
  itemName,
  status,
  isPublic,
  size,
}: ItemCardImageProps) {
  const [primaryImage, setPrimaryImage] = useState<ImageData | null | undefined>(null)
  const [imageError, setImageError] = useState(false)

  useEffect(() => {
    setImageError(false) // Reset error state when images change
    if (initialPrimaryImage) {
      setPrimaryImage(initialPrimaryImage)
    } else if (images && images.length > 0) {
      const firstPrimary = images.find(img => img.is_primary)
      setPrimaryImage(firstPrimary || images[0])
    } else {
      setPrimaryImage(null)
    }
  }, [initialPrimaryImage, images])

  const imageSrc = primaryImage?.thumbnail_url || primaryImage?.url

  // 根据size动态设置sizes属性
  const getSizesAttribute = () => {
    if (size) {
      return `${size}px`
    }
    // 默认情况下的sizes（用于fill layout）
    return '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'
  }

  return (
    <div
      className={
        size
          ? `relative overflow-hidden rounded border-b-2 ${getStatusBorderColor(status)}`
          : `relative h-48 w-full overflow-hidden rounded-t-lg border-b-2 ${getStatusBorderColor(status)}`
      }
      style={size ? { width: size, height: size } : {}}
    >
      {imageSrc && !imageError ? (
        <Image
          src={imageSrc}
          alt={`${itemName} 图片`}
          layout={size ? undefined : 'fill'}
          width={size}
          height={size}
          objectFit="cover"
          onError={() => setImageError(true)}
          unoptimized={imageSrc.startsWith('http')}
          sizes={getSizesAttribute()}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <AlertTriangleIcon className="h-1/2 w-1/2 opacity-50" />
        </div>
      )}
      {isPublic && (
        <Badge variant="secondary" className="absolute top-2 right-2">
          <Globe className="mr-1 h-3 w-3" />
          公开
        </Badge>
      )}
    </div>
  )
}
