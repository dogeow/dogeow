import { Spot } from "@/app/thing/types";
import FolderIcon from "./FolderIcon"; // 改为默认导入

interface LocationDisplayProps {
  spot?: Spot | null;
}

export function LocationDisplay({ spot }: LocationDisplayProps) {
  if (!spot) {
    return null;
  }

  // Function to recursively build the location string
  const getLocationPath = (currentSpot: Spot): string => {
    if (currentSpot.parent_spot) {
      return `${getLocationPath(currentSpot.parent_spot)} > ${currentSpot.name}`;
    }
    return currentSpot.name;
  };

  const fullLocationPath = getLocationPath(spot);

  return (
    <div className="flex items-center text-sm text-muted-foreground">
      <FolderIcon className="mr-2 h-4 w-4" isOpen={false} />
      <span>{fullLocationPath}</span>
    </div>
  );
}
