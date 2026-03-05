import { describe, expect, it } from 'vitest'
import { buildLocationMaps, filterSearchResults, matchesSearch } from '../searchUtils'

const areas = [
  { id: 1, name: '客厅' },
  { id: 2, name: '卧室' },
]

const rooms = [
  { id: 11, name: '电视区', area_id: 1 },
  { id: 22, name: '主卧', area_id: 2 },
]

const spots = [
  { id: 101, name: '沙发角落', room_id: 11 },
  { id: 202, name: '床头柜', room_id: 22 },
]

describe('searchUtils', () => {
  it('matchesSearch is case-insensitive', () => {
    expect(matchesSearch('Living Room', 'living')).toBe(true)
    expect(matchesSearch('LIVING ROOM', 'room')).toBe(true)
    expect(matchesSearch('Bedroom', 'kitchen')).toBe(false)
  })

  it('buildLocationMaps groups rooms and spots by parent id', () => {
    const { areaRoomsMap, roomSpotsMap } = buildLocationMaps(rooms, spots)

    expect(areaRoomsMap.get(1)?.map(r => r.id)).toEqual([11])
    expect(areaRoomsMap.get(2)?.map(r => r.id)).toEqual([22])
    expect(roomSpotsMap.get(11)?.map(s => s.id)).toEqual([101])
    expect(roomSpotsMap.get(22)?.map(s => s.id)).toEqual([202])
  })

  it('buildLocationMaps appends multiple spots for the same room id', () => {
    const { roomSpotsMap } = buildLocationMaps(rooms, [
      { id: 301, name: 'A', room_id: 11 } as (typeof spots)[number],
      { id: 302, name: 'B', room_id: 11 } as (typeof spots)[number],
    ])

    expect(roomSpotsMap.get(11)?.map(s => s.id)).toEqual([301, 302])
  })

  it('returns full visibility from expanded sets when search term is empty', () => {
    const result = filterSearchResults(
      areas,
      rooms,
      spots,
      '',
      null,
      new Set([2]),
      new Set([22]),
      false
    )

    expect(result.filteredAreas.map(a => a.id)).toEqual([1, 2])
    expect(result.filteredRooms.map(r => r.id)).toEqual([11, 22])
    expect(result.filteredSpots.map(s => s.id)).toEqual([101, 202])
    expect(result.visibleAreaIds).toEqual([2])
    expect(result.visibleRoomIds).toEqual([22])
  })

  it('returns no areas when filterType is room and search term is empty', () => {
    const result = filterSearchResults(
      areas,
      rooms,
      spots,
      '',
      'room',
      new Set([1]),
      new Set([11]),
      false
    )

    expect(result.filteredAreas).toEqual([])
    expect(result.filteredRooms.map(r => r.id)).toEqual([11, 22])
    expect(result.filteredSpots.map(s => s.id)).toEqual([101, 202])
  })

  it('returns no spots when filterType is area and search term is empty', () => {
    const result = filterSearchResults(
      areas,
      rooms,
      spots,
      '',
      'area',
      new Set([1]),
      new Set([11]),
      false
    )

    expect(result.filteredAreas.map(a => a.id)).toEqual([1, 2])
    expect(result.filteredRooms.map(r => r.id)).toEqual([11, 22])
    expect(result.filteredSpots).toEqual([])
  })

  it('uses all ids as visible when globally expanded and search term is empty', () => {
    const result = filterSearchResults(areas, rooms, spots, '', null, new Set(), new Set(), true)

    expect(result.visibleAreaIds).toEqual([1, 2])
    expect(result.visibleRoomIds).toEqual([11, 22])
  })

  it('searches descendants and keeps parent nodes visible', () => {
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
    expect(result.filteredRooms.map(r => r.id)).toEqual([22])
    expect(result.filteredSpots.map(s => s.id)).toEqual([202])
    expect(result.visibleAreaIds).toEqual([2])
    expect(result.visibleRoomIds).toEqual([22])
  })

  it('respects filterType area by hiding spots', () => {
    const result = filterSearchResults(
      areas,
      rooms,
      spots,
      '沙发',
      'area',
      new Set(),
      new Set(),
      false
    )

    expect(result.filteredAreas.map(a => a.id)).toEqual([1])
    expect(result.filteredSpots).toEqual([])
  })

  it('respects filterType room by hiding areas in output', () => {
    const result = filterSearchResults(
      areas,
      rooms,
      spots,
      '主卧',
      'room',
      new Set(),
      new Set(),
      false
    )

    expect(result.filteredAreas).toEqual([])
    expect(result.filteredRooms.map(r => r.id)).toEqual([22])
  })

  it('keeps matched area visible even when area has no rooms', () => {
    const areasWithEmptyArea = [...areas, { id: 3, name: '书房' }]
    const result = filterSearchResults(
      areasWithEmptyArea,
      rooms,
      spots,
      '书房',
      null,
      new Set(),
      new Set(),
      false
    )

    expect(result.filteredAreas.map(a => a.id)).toEqual([3])
    expect(result.filteredRooms).toEqual([])
    expect(result.filteredSpots).toEqual([])
    expect(result.visibleAreaIds).toEqual([3])
    expect(result.visibleRoomIds).toEqual([])
  })

  it('ignores orphan spots whose room cannot be found when matching search term', () => {
    const orphanSpots = [...spots, { id: 303, name: '孤儿位置', room_id: 999 }]
    const result = filterSearchResults(
      areas,
      rooms,
      orphanSpots,
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

  it('handles rooms without spot mapping when evaluating matching children', () => {
    const roomsWithEmptySpotRoom = [...rooms, { id: 33, name: '储物间', area_id: 1 }]
    const result = filterSearchResults(
      areas,
      roomsWithEmptySpotRoom,
      spots,
      '床头',
      null,
      new Set(),
      new Set(),
      false
    )

    expect(result.filteredAreas.map(a => a.id)).toEqual([2])
    expect(result.filteredRooms.map(r => r.id)).toEqual([22])
    expect(result.filteredSpots.map(s => s.id)).toEqual([202])
  })

  it('handles areaRooms iteration when some rooms have no spots and do not match search', () => {
    const roomsMixed = [
      { id: 11, name: '电视区', area_id: 1 },
      { id: 33, name: '储物间', area_id: 1 },
    ]
    const spotsOnlyFirstRoom = [{ id: 101, name: '沙发角落', room_id: 11 }]

    const result = filterSearchResults(
      [{ id: 1, name: '客厅' }],
      roomsMixed as typeof rooms,
      spotsOnlyFirstRoom as typeof spots,
      '沙发',
      null,
      new Set(),
      new Set(),
      false
    )

    expect(result.filteredAreas.map(a => a.id)).toEqual([1])
    expect(result.filteredRooms.map(r => r.id)).toEqual([11])
    expect(result.filteredSpots.map(s => s.id)).toEqual([101])
  })
})
