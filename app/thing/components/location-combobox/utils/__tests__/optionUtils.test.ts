import { describe, expect, it } from 'vitest'
import { getAreaOptions, getRoomOptions, getSpotOptions } from '../optionUtils'

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

describe('location-combobox optionUtils', () => {
  it('getAreaOptions prepends placeholder and maps id/name', () => {
    expect(getAreaOptions(areas)).toEqual([
      { value: '', label: '请选择区域' },
      { value: '1', label: '客厅' },
      { value: '2', label: '卧室' },
    ])
  })

  it('getRoomOptions returns empty list when selectedAreaId is empty', () => {
    expect(getRoomOptions('', rooms)).toEqual([])
  })

  it('getRoomOptions prepends placeholder and maps room options', () => {
    expect(getRoomOptions('1', rooms)).toEqual([
      { value: '', label: '请选择房间' },
      { value: '11', label: '电视区' },
      { value: '22', label: '主卧' },
    ])
  })

  it('getSpotOptions returns empty list when selectedRoomId is empty', () => {
    expect(getSpotOptions('', spots)).toEqual([])
  })

  it('getSpotOptions prepends placeholder and maps spot options', () => {
    expect(getSpotOptions('11', spots)).toEqual([
      { value: '', label: '请选择具体位置' },
      { value: '101', label: '沙发角落' },
      { value: '202', label: '床头柜' },
    ])
  })
})
