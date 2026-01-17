import React, { memo } from 'react'
import { Label } from '@/components/ui/label'
import LocationComboboxSelectSimple from '../../LocationComboboxSelectSimple'
import type { LocationSelection } from '../../LocationComboboxSelectSimple'
import type { LocationType } from '../formConstants'

interface LocationSectionProps {
  locationPath?: string
  selectedLocation?: LocationSelection
  onLocationSelect: (type: LocationType, id: number, fullPath?: string) => void
  getCurrentValue: (field: string) => unknown
  isCreateMode: boolean
}

export const LocationSection = memo<LocationSectionProps>(
  ({ locationPath, selectedLocation, onLocationSelect, getCurrentValue, isCreateMode }) => {
    const renderLocationInfo = () => {
      const currentLocationPath = locationPath || ''
      const currentAreaId = getCurrentValue('area_id')
      const currentRoomId = getCurrentValue('room_id')
      const currentSpotId = getCurrentValue('spot_id')

      if (currentLocationPath) {
        return <p className="text-muted-foreground mt-2 text-sm">{currentLocationPath}</p>
      }

      if (currentAreaId || currentRoomId || currentSpotId) {
        return <p className="mt-2 text-sm text-orange-500">位置数据不完整，请重新选择</p>
      }

      return <p className="text-muted-foreground mt-2 text-sm">未指定位置</p>
    }

    return (
      <div className="space-y-2">
        <Label className="mb-2 block">存放位置</Label>
        <LocationComboboxSelectSimple
          onSelect={onLocationSelect}
          selectedLocation={selectedLocation}
        />
        {renderLocationInfo()}
      </div>
    )
  }
)

LocationSection.displayName = 'LocationSection'
