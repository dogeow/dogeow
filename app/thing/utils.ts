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
