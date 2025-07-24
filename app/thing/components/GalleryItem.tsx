import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { Globe } from 'lucide-react'
import { Item } from '@/app/thing/types'
import ImagePlaceholder from '@/components/ui/icons/image-placeholder'

interface GalleryItemProps {
  item: Item
  imageSize: number
  onClick: (item: Item) => void
}

export function GalleryItem({ item, imageSize, onClick }: GalleryItemProps) {
  const thumbnailUrl = item.thumbnail_url

  let borderColorClass = 'border-transparent'
  if (item.status === 'expired') borderColorClass = 'border-red-500'
  else if (item.status === 'damaged') borderColorClass = 'border-orange-500'
  else if (item.status === 'idle') borderColorClass = 'border-amber-500'

  return (
    <div
      key={item.id}
      className={`group relative cursor-pointer overflow-hidden rounded-lg border-2 shadow-sm transition-all duration-200 ease-in-out hover:shadow-md ${borderColorClass}`}
      style={{ width: `${imageSize}px`, height: `${imageSize}px` }}
      onClick={() => onClick(item)}
    >
      {thumbnailUrl ? (
        <Image
          src={thumbnailUrl}
          alt={item.name}
          fill
          sizes={`${imageSize}px`}
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
      ) : (
        <div className="bg-muted text-muted-foreground flex h-full w-full items-center justify-center">
          <ImagePlaceholder
            className="text-gray-400 opacity-40"
            size={Math.floor(imageSize * 0.4)}
          />
        </div>
      )}
      <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/70 via-black/30 to-transparent p-2 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <h3 className="truncate text-sm font-semibold text-white">{item.name}</h3>
        <p className="truncate text-xs text-gray-200">{item.category?.name || 'Uncategorized'}</p>
      </div>
      {item.is_public ? (
        <Badge
          variant="outline"
          className="bg-background/70 absolute top-1.5 right-1.5 p-1 backdrop-blur-sm"
        >
          <Globe className="h-3 w-3" />
        </Badge>
      ) : null}
    </div>
  )
}
