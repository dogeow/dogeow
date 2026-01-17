import React, { memo } from 'react'
import Image from 'next/image'
import ImagePlaceholder from '@/components/ui/icons/image-placeholder'
import type { Item } from '@/app/thing/types'

interface ImageGalleryProps {
  images: Item['images']
  itemName: string
  activeIndex: number
  onIndexChange: (index: number) => void
}

export const ImageGallery = memo<ImageGalleryProps>(
  ({ images, itemName, activeIndex, onIndexChange }) => {
    if (!images || images.length === 0) {
      return (
        <div className="bg-muted flex h-48 items-center justify-center rounded-lg">
          <ImagePlaceholder className="text-gray-400 opacity-40" size={64} />
        </div>
      )
    }

    return (
      <div className="space-y-3">
        <div className="bg-muted relative aspect-square overflow-hidden rounded-lg shadow-sm">
          {(() => {
            const safeIndex = Math.min(Math.max(activeIndex, 0), images.length - 1)
            const url = images[safeIndex]?.url || ''
            return (
              <Image
                src={url}
                alt={itemName}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
            )
          })()}
        </div>

        {images.length > 1 && (
          <div className="flex flex-wrap justify-center gap-2 py-2">
            {images.map((image, index: number) => (
              <div
                key={image.id}
                className={`relative aspect-square h-16 w-16 cursor-pointer overflow-hidden rounded-md border-2 transition-all ${
                  index === activeIndex
                    ? 'border-primary ring-primary/20 ring-2'
                    : 'border-muted hover:border-muted-foreground/50'
                }`}
                onClick={() => onIndexChange(index)}
              >
                <Image
                  src={image.thumbnail_url || ''}
                  alt={`${itemName} 图片 ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }
)

ImageGallery.displayName = 'ImageGallery'
