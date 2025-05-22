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
  if (item.primary_image?.url) return item.primary_image.url;
  if (item.images && item.images.length > 0 && item.images[0].url) return item.images[0].url;
  // Fallback for path-based images if needed, could prefix with API_URL or similar
  if (item.primary_image?.path) return item.primary_image.path;
  if (item.images && item.images.length > 0 && item.images[0].path) return item.images[0].path;
  return undefined;
};

export const getThumbnailUrl = (item: Item): string | undefined => {
  if (item.primary_image?.thumbnail_url) return item.primary_image.thumbnail_url;
  if (item.images && item.images.length > 0 && item.images[0].thumbnail_url) {
    return item.images[0].thumbnail_url;
  }
  // Fallback for non-URL paths
  if (item.primary_image?.thumbnail_path) return item.primary_image.thumbnail_path;
  if (item.images && item.images.length > 0 && item.images[0].thumbnail_path) {
    return item.images[0].thumbnail_path;
  }
  return undefined;
};
