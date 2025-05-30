"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Item, Spot } from "@/app/thing/types";
import { ItemDetailDialog } from "./ItemDetailDialog";
import { ImageSizeControl } from "./ImageSizeControl";
import { GalleryItem } from "./GalleryItem";

interface ItemGalleryProps {
  items: Item[];
}

export default function ItemGallery({ items }: ItemGalleryProps) {
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [imageSize, setImageSize] = useState(120);
  const [galleryContainerWidth, setGalleryContainerWidth] = useState(0);

  const router = useRouter();

  // 获取缩略图URL的函数
  const getThumbnailUrl = (item: Item): string | undefined => {
    if (item.primary_image?.thumbnail_path) {
      return `/storage/${item.primary_image.thumbnail_path}`;
    }
    if (item.images && item.images.length > 0) {
      return `/storage/${item.images[0].thumbnail_path}`;
    }
    return undefined;
  };

  useEffect(() => {
    const container = document.getElementById("item-gallery-container");
    if (container) {
      setGalleryContainerWidth(container.offsetWidth);
    }
    const handleResize = () => {
      if (container) {
        setGalleryContainerWidth(container.offsetWidth);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);


  const handleViewDetails = (id: number) => {
    setSelectedItem(null);
    router.push(`/thing/${id}`);
  };

  const handleItemClick = (item: Item) => {
    setSelectedItem(item);
  };

  const handleDialogClose = () => {
    setSelectedItem(null);
  };
  
  const handleImageSizeChange = useCallback((newSize: number) => {
    setImageSize(newSize);
  }, []);

  const maxImageSizeForControl = galleryContainerWidth > 0 ? Math.min(520, galleryContainerWidth - 20) : 300;

  return (
    <div id="item-gallery-container" className="w-full">
      <ImageSizeControl
        initialSize={120}
        maxSize={maxImageSizeForControl}
        onSizeChange={handleImageSizeChange}
      />

      {items.length === 0 ? (
         <div className="text-center text-muted-foreground py-10">
            No items to display.
         </div>
      ) : (
        <div className="grid gap-2" style={{
          gridTemplateColumns: `repeat(auto-fill, minmax(${imageSize}px, 1fr))`,
          justifyItems: 'center'
        }}>
          {items.map((item) => (
            <GalleryItem
              key={item.id}
              item={item}
              imageSize={imageSize}
              onClick={handleItemClick}
              getThumbnailUrl={getThumbnailUrl}
            />
          ))}
        </div>
      )}

      <ItemDetailDialog
        item={selectedItem}
        open={!!selectedItem}
        onOpenChange={handleDialogClose}
        onViewDetails={handleViewDetails}
      />
    </div>
  );
}