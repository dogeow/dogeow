import { describe, expect, it } from 'vitest'
import { buildPath } from '../pathUtils'

const areas = [
  { id: 1, name: '客厅' },
  { id: 2, name: '卧室' },
]

const rooms = [
  { id: 11, name: '电视区', area_id: 1 },
  { id: 12, name: '主卧', area_id: 2 },
  { id: 13, name: '阁楼', area_id: 999 },
]

const spots = [
  { id: 101, name: '沙发角落', room_id: 11 },
  { id: 102, name: '床头柜', room_id: 12 },
  { id: 103, name: '未知房间位置', room_id: 998 },
  { id: 104, name: '未知区域位置', room_id: 13 },
]

const t = (key: string) => key

describe('pathUtils', () => {
  it('builds area path and unknown-area fallback', () => {
    expect(buildPath('area', 1, areas, rooms, spots, t)).toBe('客厅')
    expect(buildPath('area', 999, areas, rooms, spots, t)).toBe('location.unknown_area')
  })

  it('builds room path and unknown-room fallback', () => {
    expect(buildPath('room', 11, areas, rooms, spots, t)).toBe('客厅 / 电视区')
    expect(buildPath('room', 999, areas, rooms, spots, t)).toBe('location.unknown_room')
  })

  it('builds room path with unknown area fallback', () => {
    expect(buildPath('room', 13, areas, rooms, spots, t)).toBe('location.unknown_area / 阁楼')
  })

  it('builds spot path including area and room', () => {
    expect(buildPath('spot', 101, areas, rooms, spots, t)).toBe('客厅 / 电视区 / 沙发角落')
  })

  it('builds spot path with unknown room fallback', () => {
    expect(buildPath('spot', 103, areas, rooms, spots, t)).toBe(
      'location.unknown_room / 未知房间位置'
    )
  })

  it('builds spot path with unknown area fallback when room exists', () => {
    expect(buildPath('spot', 104, areas, rooms, spots, t)).toBe(
      'location.unknown_area / 阁楼 / 未知区域位置'
    )
  })

  it('returns unknown spot fallback when spot does not exist', () => {
    expect(buildPath('spot', 999, areas, rooms, spots, t)).toBe('location.unknown_spot')
  })
})
