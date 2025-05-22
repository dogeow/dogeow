import { Spot } from "@/lib/types/spot"; // Assuming Spot type is defined here
import FolderIcon from "./FolderIcon"; // 改为默认导入

interface LocationDisplayProps {
  spot?: Spot | null;
}

export function LocationDisplay({ spot }: LocationDisplayProps) {
  if (!spot) {
    return <div className="text-sm text-muted-foreground">No location</div>;
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
      <FolderIcon className="mr-2 h-4 w-4" />
      <span>{fullLocationPath}</span>
    </div>
  );
}
