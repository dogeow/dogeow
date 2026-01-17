import type { Area, Room, Spot } from '../../../types'

export interface SelectOption {
  value: string
  label: string
}

/**
 * 将区域列表转换为选项
 */
export const areaToOptions = (areas: Area[]): SelectOption[] => [
  { value: '', label: '请选择区域' },
  ...areas.map(area => ({
    value: area.id.toString(),
    label: area.name,
  })),
]

/**
 * 将房间列表转换为选项
 */
export const roomToOptions = (rooms: Room[]): SelectOption[] => [
  { value: '', label: '请选择房间' },
  ...rooms.map(room => ({
    value: room.id.toString(),
    label: room.name,
  })),
]

/**
 * 将位置列表转换为选项
 */
export const spotToOptions = (spots: Spot[]): SelectOption[] => [
  { value: '', label: '请选择具体位置' },
  ...spots.map(spot => ({
    value: spot.id.toString(),
    label: spot.name,
  })),
]
