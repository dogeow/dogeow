import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Globe, AlertTriangleIcon } from "lucide-react";
import { Item } from "@/app/thing/types";

interface GalleryItemProps {
  item: Item;
  imageSize: number;
  onClick: (item: Item) => void;
}

export function GalleryItem({
  item,
  imageSize,
  onClick,
}: GalleryItemProps) {
  const thumbnailUrl = item.thumbnail_url;

  // Determine border color based on status
  let borderColorClass = "border-transparent";
  if (item.status === "expired") borderColorClass = "border-red-500";
  else if (item.status === "damaged") borderColorClass = "border-orange-500";
  else if (item.status === "idle") borderColorClass = "border-amber-500";


  return (
    <div
      key={item.id}
      className={`relative group cursor-pointer overflow-hidden rounded-lg shadow-sm hover:shadow-md transition-all duration-200 ease-in-out border-2 ${borderColorClass}`}
      style={{ width: `${imageSize}px`, height: `${imageSize}px` }}
      onClick={() => onClick(item)}
    >
      {thumbnailUrl ? (
        <Image
          src={thumbnailUrl}
          alt={item.name}
          fill
          sizes={`${imageSize}px`}
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
      ) : (
        <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground">
          <AlertTriangleIcon className="w-1/2 h-1/2 opacity-50" />
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-2 flex flex-col justify-end">
        <h3 className="text-sm font-semibold text-white truncate">
          {item.name}
        </h3>
        <p className="text-xs text-gray-200 truncate">
          {item.category?.name || "Uncategorized"}
        </p>
      </div>
      {item.is_public && (
        <Badge
          variant="outline"
          className="absolute top-1.5 right-1.5 bg-background/70 backdrop-blur-sm p-1"
        >
          <Globe className="h-3 w-3" />
        </Badge>
      )}
       {/* Minimal status indicator if needed, or rely on border */}
       {/* Example: <div className={`absolute top-1 left-1 w-2 h-2 rounded-full ${item.status === 'active' ? 'bg-green-500' : 'bg-yellow-500'}`} title={`Status: ${item.status}`}></div> */}
    </div>
  );
}
