import { Spot } from '@/app/thing/types'
import { MapPin } from 'lucide-react'

interface LocationDisplayProps {
  spot?: Spot | null
}

export function LocationDisplay({ spot }: LocationDisplayProps) {
  if (!spot) {
    return null
  }

  // Function to recursively build the location string
  const getLocationPath = (currentSpot: Spot): string => {
    if (currentSpot.parent_spot) {
      return `${getLocationPath(currentSpot.parent_spot)} > ${currentSpot.name}`
    }
    return currentSpot.name
  }

  const fullLocationPath = getLocationPath(spot)

  return (
    <div className="text-muted-foreground flex items-center text-sm">
      <MapPin className="mr-2 h-4 w-4" />
      <span>{fullLocationPath}</span>
    </div>
  )
}
