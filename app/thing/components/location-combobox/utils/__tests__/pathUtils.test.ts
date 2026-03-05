import { describe, expect, it } from 'vitest'
import { buildLocationPath } from '../pathUtils'

const areas = [
  { id: 1, name: '客厅' },
  { id: 2, name: '卧室' },
] as any

const rooms = [
  { id: 11, name: '电视区', area_id: 1 },
  { id: 22, name: '主卧', area_id: 2 },
] as any

const spots = [
  { id: 101, name: '沙发角落', room_id: 11 },
  { id: 202, name: '床头柜', room_id: 22 },
] as any

describe('location-combobox pathUtils', () => {
  it('builds path for area', () => {
    expect(buildLocationPath('area', 1, areas, rooms, spots, '', '')).toBe('客厅')
  })

  it('returns empty string for missing area', () => {
    expect(buildLocationPath('area', 999, areas, rooms, spots, '', '')).toBe('')
  })

  it('builds path for room when room and selected area exist', () => {
    expect(buildLocationPath('room', 11, areas, rooms, spots, '1', '')).toBe('客厅 > 电视区')
  })

  it('returns empty string for room when selected area is missing', () => {
    expect(buildLocationPath('room', 11, areas, rooms, spots, '999', '')).toBe('')
  })

  it('builds path for spot when spot, selected room and selected area exist', () => {
    expect(buildLocationPath('spot', 101, areas, rooms, spots, '1', '11')).toBe(
      '客厅 > 电视区 > 沙发角落'
    )
  })

  it('returns empty string for spot when any linked node is missing', () => {
    expect(buildLocationPath('spot', 101, areas, rooms, spots, '1', '999')).toBe('')
    expect(buildLocationPath('spot', 999, areas, rooms, spots, '1', '11')).toBe('')
    expect(buildLocationPath('spot', 101, areas, rooms, spots, '999', '11')).toBe('')
  })
})
