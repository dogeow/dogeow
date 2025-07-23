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

// Define itemStatusColors and getStatusBorderColor function
const itemStatusColors: Record<string, string> = {
  良好: 'border-green-500',
  损坏: 'border-red-500',
  维修中: 'border-yellow-500',
  借出: 'border-blue-500',
  遗失: 'border-gray-500',
  处置中: 'border-purple-500',
}

const getStatusBorderColor = (status: string): string => {
  return itemStatusColors[status] || 'border-gray-300'
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
