import React from 'react'
import { useTranslation } from '@/hooks/useTranslation'
import { AreaNode } from './AreaNode'
import { RoomNode } from './RoomNode'
import { SpotNode } from './SpotNode'
import { matchesSearch } from '../utils/searchUtils'
import type { LocationTreeResponse, Room, Spot, LocationSelection } from '../../../types'

interface LocationTreeContentProps {
  filteredAreas: LocationTreeResponse['areas']
  filteredRooms: Room[]
  filteredSpots: Spot[]
  visibleAreaIds: number[]
  visibleRoomIds: number[]
  rooms: Room[]
  spots: Spot[]
  filterType: 'area' | 'room' | null
  searchTerm: string
  selectedLocation?: LocationSelection
  expandedAreas: Set<number>
  expandedRooms: Set<number>
  onSelect: (type: 'area' | 'room' | 'spot', id: number) => void
  onToggleArea: (e: React.MouseEvent, areaId: number) => void
  onToggleRoom: (e: React.MouseEvent, roomId: number) => void
  getRoomAreaName: (room: Room) => string
  isSelected: (type: 'area' | 'room' | 'spot', id: number) => boolean
}

export const LocationTreeContent: React.FC<LocationTreeContentProps> = ({
  filteredAreas,
  filteredRooms,
  filteredSpots,
  visibleAreaIds,
  visibleRoomIds,
  rooms,
  spots,
  filterType,
  searchTerm,
  selectedLocation,
  expandedAreas,
  expandedRooms,
  onSelect,
  onToggleArea,
  onToggleRoom,
  getRoomAreaName,
  isSelected,
}) => {
  const { t } = useTranslation()

  const hasNoResults =
    filteredAreas.length === 0 && filteredRooms.length === 0 && filteredSpots.length === 0

  if (hasNoResults) {
    return (
      <div className="text-muted-foreground py-2 text-center text-sm">
        {searchTerm ? t('location.no_results') : t('location.no_available')}
      </div>
    )
  }

  return (
    <>
      {/* 区域列表 */}
      {filteredAreas.map(area => (
        <AreaNode
          key={`area-${area.id}`}
          area={area}
          isSelected={isSelected('area', area.id)}
          isExpanded={visibleAreaIds.includes(area.id)}
          onSelect={() => onSelect('area', area.id)}
          onToggle={e => onToggleArea(e, area.id)}
        >
          {/* 区域下的房间 */}
          {visibleAreaIds.includes(area.id) &&
            rooms
              .filter(room => room.area_id === area.id && visibleRoomIds.includes(room.id))
              .map(room => (
                <RoomNode
                  key={`room-${room.id}`}
                  room={room}
                  isSelected={isSelected('room', room.id)}
                  onSelect={() => onSelect('room', room.id)}
                  onToggle={e => onToggleRoom(e, room.id)}
                >
                  {/* 房间下的位置 */}
                  {filterType !== 'area' &&
                    visibleRoomIds.includes(room.id) &&
                    spots
                      .filter(spot => spot.room_id === room.id)
                      .filter(spot => !searchTerm || matchesSearch(spot.name, searchTerm))
                      .map(spot => (
                        <SpotNode
                          key={`spot-${spot.id}`}
                          spot={spot}
                          isSelected={isSelected('spot', spot.id)}
                          onSelect={() => onSelect('spot', spot.id)}
                        />
                      ))}
                </RoomNode>
              ))}
        </AreaNode>
      ))}

      {/* 当过滤模式为房间时，直接显示房间列表 */}
      {filterType === 'room' &&
        filteredRooms.map(room => (
          <div key={`direct-room-${room.id}`}>
            <RoomNode
              room={room}
              isSelected={isSelected('room', room.id)}
              onSelect={() => onSelect('room', room.id)}
              showAreaName
              areaName={getRoomAreaName(room)}
            >
              {/* 房间下的位置 */}
              {visibleRoomIds.includes(room.id) &&
                spots
                  .filter(spot => spot.room_id === room.id)
                  .filter(spot => !searchTerm || matchesSearch(spot.name, searchTerm))
                  .map(spot => (
                    <SpotNode
                      key={`direct-spot-${spot.id}`}
                      spot={spot}
                      isSelected={isSelected('spot', spot.id)}
                      onSelect={() => onSelect('spot', spot.id)}
                    />
                  ))}
            </RoomNode>
          </div>
        ))}
    </>
  )
}
