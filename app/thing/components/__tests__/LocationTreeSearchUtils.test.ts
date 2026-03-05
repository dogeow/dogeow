import { describe, expect, it } from 'vitest'
import {
  buildLocationMaps,
  filterSearchResults,
  matchesSearch,
} from '../location-tree/utils/searchUtils'

const areas = [
  { id: 1, name: '客厅' },
  { id: 2, name: '卧室' },
]

const rooms = [
  { id: 11, name: '电视区', area_id: 1 },
  { id: 12, name: '主卧', area_id: 2 },
]

const spots = [
  { id: 101, name: '沙发角落', room_id: 11 },
  { id: 102, name: '床头柜', room_id: 12 },
  { id: 103, name: '孤儿位置', room_id: 999 },
]

describe('location-tree/utils/searchUtils', () => {
  it('matchesSearch should be case-insensitive', () => {
    expect(matchesSearch('Living Room', 'living')).toBe(true)
    expect(matchesSearch('LIVING ROOM', 'room')).toBe(true)
    expect(matchesSearch('Bedroom', 'kitchen')).toBe(false)
  })

  it('buildLocationMaps should group rooms and spots by parent id', () => {
    const { areaRoomsMap, roomSpotsMap } = buildLocationMaps(rooms, spots)
    expect(areaRoomsMap.get(1)?.map(r => r.id)).toEqual([11])
    expect(areaRoomsMap.get(2)?.map(r => r.id)).toEqual([12])
    expect(roomSpotsMap.get(11)?.map(s => s.id)).toEqual([101])
    expect(roomSpotsMap.get(12)?.map(s => s.id)).toEqual([102])
    expect(roomSpotsMap.get(999)?.map(s => s.id)).toEqual([103])
  })

  it('returns expanded-set visibility when search term is empty', () => {
    const result = filterSearchResults(
      areas,
      rooms,
      spots,
      '',
      null,
      new Set([2]),
      new Set([12]),
      false
    )

    expect(result.filteredAreas.map(a => a.id)).toEqual([1, 2])
    expect(result.filteredRooms.map(r => r.id)).toEqual([11, 12])
    expect(result.filteredSpots.map(s => s.id)).toEqual([101, 102, 103])
    expect(result.visibleAreaIds).toEqual([2])
    expect(result.visibleRoomIds).toEqual([12])
  })

  it('returns all ids when expanded globally and search term is empty', () => {
    const result = filterSearchResults(areas, rooms, spots, '', null, new Set(), new Set(), true)
    expect(result.visibleAreaIds).toEqual([1, 2])
    expect(result.visibleRoomIds).toEqual([11, 12])
  })

  it('finds descendant matches and keeps parent nodes visible', () => {
    const result = filterSearchResults(
      areas,
      rooms,
      spots,
      '床头',
      null,
      new Set(),
      new Set(),
      false
    )

    expect(result.filteredAreas.map(a => a.id)).toEqual([2])
    expect(result.filteredRooms.map(r => r.id)).toEqual([12])
    expect(result.filteredSpots.map(s => s.id)).toEqual([102])
    expect(result.visibleAreaIds).toEqual([2])
    expect(result.visibleRoomIds).toEqual([12])
  })

  it('respects area/room filterType outputs', () => {
    const areaOnly = filterSearchResults(
      areas,
      rooms,
      spots,
      '沙发',
      'area',
      new Set(),
      new Set(),
      false
    )
    expect(areaOnly.filteredAreas.map(a => a.id)).toEqual([1])
    expect(areaOnly.filteredSpots).toEqual([])

    const roomOnly = filterSearchResults(
      areas,
      rooms,
      spots,
      '主卧',
      'room',
      new Set(),
      new Set(),
      false
    )
    expect(roomOnly.filteredAreas).toEqual([])
    expect(roomOnly.filteredRooms.map(r => r.id)).toEqual([12])
  })

  it('drops orphan spots from filtered spots when parent room is missing', () => {
    const result = filterSearchResults(
      areas,
      rooms,
      spots,
      '孤儿',
      null,
      new Set(),
      new Set(),
      false
    )

    expect(result.filteredAreas).toEqual([])
    expect(result.filteredRooms).toEqual([])
    expect(result.filteredSpots).toEqual([])
    expect(result.visibleAreaIds).toEqual([])
    expect(result.visibleRoomIds).toEqual([])
  })
})
