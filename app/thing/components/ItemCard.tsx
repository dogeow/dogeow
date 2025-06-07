"use client"

// import { useState, useEffect } from 'react' // State for image and dialog removed
import { Card } from "@/components/ui/card"
// import { Badge } from "@/components/ui/badge" // Moved to ItemCardImage
// import { Globe } from "lucide-react" // Moved to ItemCardImage
// import { toast } from "sonner" // For delete, removed
// import Image from "next/image" // Moved to ItemCardImage
// import { useItemStore } from '@/app/thing/stores/itemStore' // For fetchItems after delete, removed
// import { del } from '@/lib/api' // For delete, removed
import { Item } from '@/app/thing/types'
// import { DeleteConfirmationDialog } from "@/components/ui/DeleteConfirmationDialog" // Removed
import { TagList } from "./TagList"
import { LocationDisplay } from "./LocationDisplay"
import ItemCardImage from './ItemCardImage' // Import the new component

// ImageData interface removed, now in ItemCardImage.tsx

interface ItemCardProps {
  item: Item
  onEdit: () => void // Retained as per original, though not used in provided snippet
  onView: () => void
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function ItemCard({ item, onEdit, onView }: ItemCardProps) {
  // deleteDialogOpen, fetchItems, imageError, primaryImage states and related useEffect removed
  // itemStatusColors, getStatusBorderColor, renderImage, handleDelete functions removed

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