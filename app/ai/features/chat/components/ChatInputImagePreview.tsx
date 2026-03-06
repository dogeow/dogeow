import React from 'react'
import NextImage from 'next/image'
import { Loader2, X } from 'lucide-react'

interface ImageItem {
  id: string
  preview: string
  uploading?: boolean
}

interface ChatInputImagePreviewProps {
  images: ImageItem[]
  onRemoveImage?: (index: number) => void
  className?: string
}

export const ChatInputImagePreview = React.memo<ChatInputImagePreviewProps>(
  ({ images, onRemoveImage, className = 'mb-2' }) => {
    if (images.length === 0) return null

    return (
      <div className={`flex flex-wrap gap-2 ${className}`}>
        {images.map((item, index) => (
          <div key={item.id} className="group relative">
            <NextImage
              src={item.preview}
              alt={`上传图片 ${index + 1}`}
              width={56}
              height={56}
              unoptimized
              className="h-14 w-14 rounded-md border object-cover"
            />
            {item.uploading && (
              <div className="absolute inset-0 flex items-center justify-center rounded-md bg-black/40">
                <Loader2 className="h-4 w-4 animate-spin text-white" />
              </div>
            )}
            <button
              type="button"
              onClick={() => onRemoveImage?.(index)}
              className="absolute -top-1.5 -right-1.5 rounded-full bg-black/70 p-1 opacity-0 transition-opacity group-hover:opacity-100"
              aria-label="移除图片"
            >
              <X className="h-3 w-3 text-white" />
            </button>
          </div>
        ))}
      </div>
    )
  }
)

ChatInputImagePreview.displayName = 'ChatInputImagePreview'
