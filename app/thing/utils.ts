import { Item, Spot } from "@/app/thing/types";

export const getLocationPath = (spot?: Spot | null): string => {
  if (!spot) return "No location specified";
  
  const pathParts: string[] = [];
  let currentSpot: Spot | undefined | null = spot;
  while(currentSpot) {
    pathParts.unshift(currentSpot.name);
    currentSpot = currentSpot.parent_spot;
  }
  return pathParts.join(" > ");
};

export const getFullImageUrl = (item: Item): string | undefined => {
  if (item.primary_image?.path) return item.primary_image.path;
  if (item.images && item.images.length > 0 && item.images[0].path) return item.images[0].path;
  return undefined;
};

export const getThumbnailUrl = (item: Item): string | undefined => {
  if (item.primary_image?.thumbnail_path) return item.primary_image.thumbnail_path;
  if (item.images && item.images.length > 0 && item.images[0].thumbnail_path) {
    return item.images[0].thumbnail_path;
  }
  return undefined;
};
