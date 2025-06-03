import { LocationType } from './hooks/useLocationManagement'

/**
 * 位置类型到中文名称的映射
 */
export const LOCATION_TYPE_TEXT_MAP: Record<LocationType, string> = {
  area: '区域',
  room: '房间',
  spot: '位置'
}

/**
 * 获取位置类型的中文名称
 */
export const getLocationTypeText = (type: LocationType): string => {
  return LOCATION_TYPE_TEXT_MAP[type]
} 