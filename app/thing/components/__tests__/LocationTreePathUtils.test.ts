import { describe, expect, it } from 'vitest'
import { buildPath } from '../location-tree/utils/pathUtils'

const areas = [
  { id: 1, name: '客厅' },
  { id: 2, name: '卧室' },
]

const rooms = [
  { id: 11, name: '电视区', area_id: 1 },
  { id: 12, name: '主卧', area_id: 2 },
  { id: 13, name: '神秘房间', area_id: 999 },
]

const spots = [
  { id: 101, name: '沙发角落', room_id: 11 },
  { id: 102, name: '床头柜', room_id: 12 },
  { id: 103, name: '未知房间位置', room_id: 999 },
  { id: 104, name: '未知区域位置', room_id: 13 },
]

const t = (key: string) => key

describe('location-tree/utils/pathUtils', () => {
  it('builds area and room paths with fallbacks', () => {
    expect(buildPath('area', 1, areas, rooms, spots, t)).toBe('客厅')
    expect(buildPath('area', 999, areas, rooms, spots, t)).toBe('location.unknown_area')
    expect(buildPath('room', 11, areas, rooms, spots, t)).toBe('客厅 / 电视区')
    expect(buildPath('room', 13, areas, rooms, spots, t)).toBe('location.unknown_area / 神秘房间')
    expect(buildPath('room', 999, areas, rooms, spots, t)).toBe('location.unknown_room')
  })

  it('builds spot path for normal, unknown room, unknown area, and missing spot cases', () => {
    expect(buildPath('spot', 101, areas, rooms, spots, t)).toBe('客厅 / 电视区 / 沙发角落')
    expect(buildPath('spot', 103, areas, rooms, spots, t)).toBe(
      'location.unknown_room / 未知房间位置'
    )
    expect(buildPath('spot', 104, areas, rooms, spots, t)).toBe(
      'location.unknown_area / 神秘房间 / 未知区域位置'
    )
    expect(buildPath('spot', 999, areas, rooms, spots, t)).toBe('location.unknown_spot')
  })
})
