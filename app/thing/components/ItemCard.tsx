"use client"

import { Card } from "@/components/ui/card"
import { Item } from '@/app/thing/types'
import { TagList } from "./TagList"
import { LocationDisplay } from "./LocationDisplay"
import ItemCardImage from './ItemCardImage'

interface ItemCardProps {
  item: Item
  onEdit: () => void
  onView: () => void
}

export default function ItemCard({ item, onView }: ItemCardProps) {

  return (
    <Card
      className="hover:bg-accent/40 transition cursor-pointer flex flex-row items-center gap-3 px-2 py-2 min-h-[64px]"
      onClick={onView}
    >
      {/* 缩略图，尺寸更小，左侧显示 */}
      <div className="flex-shrink-0 w-14 h-14 rounded overflow-hidden border bg-muted">
        <ItemCardImage
          initialPrimaryImage={item.primary_image}
          images={item.images}
          itemName={item.name}
          status={item.status}
          isPublic={item.is_public}
          size={56} // 传递自定义尺寸
        />
      </div>
      {/* 右侧信息区，紧凑排列 */}
      <div className="flex flex-col flex-grow min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-medium truncate text-base max-w-[120px] sm:max-w-[200px]">{item.name}</h3>
          <span className="text-xs text-muted-foreground flex-shrink-0">{item.category?.name || '未分类'}</span>
        </div>
        {item.description && (
          <p className="text-xs text-muted-foreground truncate max-w-full">{item.description}</p>
        )}
        <div className="flex items-center gap-2 mt-1">
          {item.tags && item.tags.length > 0 && (
            <TagList tags={item.tags} />
          )}
          <span className="text-xs text-muted-foreground ml-auto">
            <LocationDisplay spot={item.spot} />
          </span>
        </div>
      </div>
    </Card>
  )
}