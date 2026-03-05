import { describe, it, expect } from 'vitest'
import { buildLocationPath } from '../location-combobox/utils/pathUtils'
import type { Area, Room, Spot } from '@/app/thing/types'

describe('location-combobox/pathUtils', () => {
  const areas: Area[] = [
    { id: 1, name: '客厅' },
    { id: 2, name: '卧室' },
  ]
  const rooms: Room[] = [
    { id: 11, name: '电视墙', area_id: 1 },
    { id: 22, name: '床边', area_id: 2 },
  ]
  const spots: Spot[] = [
    { id: 111, name: '抽屉', room_id: 11 },
    { id: 222, name: '床头柜', room_id: 22 },
  ]

  it('should build area path by area id', () => {
    expect(buildLocationPath('area', 1, areas, rooms, spots, '', '')).toBe('客厅')
    expect(buildLocationPath('area', 999, areas, rooms, spots, '', '')).toBe('')
  })

  it('should build room path when room and selected area exist', () => {
    expect(buildLocationPath('room', 11, areas, rooms, spots, '1', '')).toBe('客厅 > 电视墙')
  })

  it('should return empty room path when room or area is missing', () => {
    expect(buildLocationPath('room', 11, areas, rooms, spots, '', '')).toBe('')
    expect(buildLocationPath('room', 999, areas, rooms, spots, '1', '')).toBe('')
  })

  it('should build spot path when spot, room and area exist', () => {
    expect(buildLocationPath('spot', 111, areas, rooms, spots, '1', '11')).toBe(
      '客厅 > 电视墙 > 抽屉'
    )
  })

  it('should return empty spot path when any level is missing', () => {
    expect(buildLocationPath('spot', 111, areas, rooms, spots, '', '11')).toBe('')
    expect(buildLocationPath('spot', 111, areas, rooms, spots, '1', '')).toBe('')
    expect(buildLocationPath('spot', 999, areas, rooms, spots, '1', '11')).toBe('')
  })
})
