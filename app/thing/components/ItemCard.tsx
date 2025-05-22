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

export default function ItemCard({ item, onEdit, onView }: ItemCardProps) {
  // deleteDialogOpen, fetchItems, imageError, primaryImage states and related useEffect removed
  // itemStatusColors, getStatusBorderColor, renderImage, handleDelete functions removed

  return (
    <Card 
      className="hover:shadow-md transition-shadow cursor-pointer flex flex-col" // Added flex flex-col
      onClick={onView} // Assuming onView is for navigating to a detailed view
    >
      <ItemCardImage
        initialPrimaryImage={item.primary_image}
        images={item.images}
        itemName={item.name}
        status={item.status}
        isPublic={item.is_public}
      />
      <div className="p-3 flex-grow"> {/* Added flex-grow to allow this part to take available space */}
        {/* Content previously in the card, now below the image */}
        <div className="flex justify-between items-center mb-1">
          <h3 className="font-semibold truncate text-base flex-grow">{item.name}</h3>
          <p className="text-xs text-muted-foreground ml-2 flex-shrink-0">{item.category?.name || '未分类'}</p>
        </div>
        
        {item.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
            {item.description}
          </p>
        )}
        
        {(item.tags && item.tags.length > 0) && (
          <div className="mb-2">
            <TagList tags={item.tags} />
          </div>
        )}
        
        <LocationDisplay spot={item.spot} />
        
        {/* Action buttons like Edit could be placed here or outside */}
        {/* For example, if onEdit is to be used:
        <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="mt-2 text-blue-500">
          Edit
        </button>
        */}
      </div>
      
      {/* DeleteConfirmationDialog removed */}
    </Card>
  )
}