'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Item } from '@/app/thing/types'
import { ImageSizeControl } from './ImageSizeControl'
import { GalleryItem } from './GalleryItem'

interface ItemGalleryProps {
  items: Item[]
  onItemView?: (id: number) => void
}

export default function ItemGallery({ items, onItemView }: ItemGalleryProps) {
  const [imageSize, setImageSize] = useState(120)
  const [galleryContainerWidth, setGalleryContainerWidth] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // 使用 requestAnimationFrame 避免同步 setState
    const updateWidth = () => {
      requestAnimationFrame(() => {
        setGalleryContainerWidth(container.offsetWidth)
      })
    }

    // 初始化宽度
    updateWidth()

    const handleResize = () => {
      updateWidth()
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleItemClick = (item: Item) => {
    if (onItemView) {
      onItemView(item.id)
    }
  }

  const handleImageSizeChange = useCallback((newSize: number) => {
    setImageSize(newSize)
  }, [])

  const maxImageSizeForControl =
    galleryContainerWidth > 0 ? Math.min(520, galleryContainerWidth - 20) : 300

  return (
    <div ref={containerRef} id="item-gallery-container" className="w-full">
      <ImageSizeControl
        initialSize={120}
        maxSize={maxImageSizeForControl}
        onSizeChange={handleImageSizeChange}
      />

      {items.length === 0 ? (
        <div className="text-muted-foreground py-10 text-center">No items to display.</div>
      ) : (
        <div
          className="grid gap-2"
          style={{
            gridTemplateColumns: `repeat(auto-fill, minmax(${imageSize}px, 1fr))`,
            justifyItems: 'center',
          }}
        >
          {items.map(item => (
            <GalleryItem
              key={item.id}
              item={item}
              imageSize={imageSize}
              onClick={handleItemClick}
            />
          ))}
        </div>
      )}
    </div>
  )
}
