import { useState } from 'react'
import { toast } from 'sonner'
import {
  useLocations,
  updateArea,
  deleteArea,
  updateRoom,
  deleteRoom,
  updateSpot,
  deleteSpot,
} from '../../services/api'
import { post } from '@/lib/api'
import { LocationTreeResponse } from '@/app/thing/types'
import { getLocationTypeText } from '../constants'
import { useTranslation } from '@/hooks/useTranslation'

// 定义类型
export type LocationType = 'area' | 'room' | 'spot'
export type Area = { id: number; name: string; is_default?: boolean }
export type Room = {
  id: number
  name: string
  area_id: number
  area?: { id: number; name: string }
}
export type Spot = {
  id: number
  name: string
  room_id: number
  room?: {
    id: number
    name: string
    area?: { id: number; name: string }
  }
}

export const useLocationManagement = () => {
  const { t } = useTranslation()
  // 获取统一的位置数据
  const { data: locationData, mutate: refreshLocations } = useLocations()

  // 从统一接口中提取各类位置数据
  const areas = (locationData as LocationTreeResponse)?.areas || []
  const rooms = (locationData as LocationTreeResponse)?.rooms || []
  const spots = (locationData as LocationTreeResponse)?.spots || []

  // 统一的刷新函数
  const refreshAreas = refreshLocations
  const refreshRooms = refreshLocations
  const refreshSpots = refreshLocations

  // 通用状态
  const [loading, setLoading] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<{ id: number; type: LocationType } | null>(null)
  const [selectedLocation, setSelectedLocation] = useState<
    { type: LocationType; id: number } | undefined
  >(undefined)

  // 通用操作处理函数
  const handleOperation = async (
    operation: () => Promise<unknown>,
    successMessage: string,
    errorMessage: string,
    refreshFunction: () => void
  ) => {
    setLoading(true)
    try {
      await operation()
      toast.success(successMessage)
      refreshFunction()
      return true
    } catch (error) {
      toast.error(error instanceof Error ? error.message : errorMessage)
      return false
    } finally {
      setLoading(false)
    }
  }

  // 验证名称
  const validateName = (name: string, entityType: LocationType): boolean => {
    if (!name.trim()) {
      const keyMap = {
        area: 'location.area_name_required',
        room: 'location.room_name_required',
        spot: 'location.spot_name_required',
      }
      toast.error(t(keyMap[entityType], t('location.name_required')))
      return false
    }
    return true
  }

  // 添加区域
  const handleAddArea = async (name: string) => {
    if (!validateName(name, 'area')) return false
    return handleOperation(
      () => post<Area>('/areas', { name }),
      t('location.area_created'),
      t('location.create_failed'),
      refreshAreas
    )
  }

  // 更新区域
  const handleUpdateArea = async (areaId: number, newName: string) => {
    if (!validateName(newName, 'area')) return false
    return handleOperation(
      () => updateArea(areaId)({ name: newName }),
      t('location.area_updated'),
      t('location.update_failed'),
      refreshAreas
    )
  }

  // 设置默认区域
  const handleSetDefaultArea = async (areaId: number) => {
    return handleOperation(
      () => post(`/areas/${areaId}/set-default`, {}),
      t('location.default_area_set'),
      t('location.set_default_failed'),
      refreshAreas
    )
  }

  // 添加房间
  const handleAddRoom = async (name: string, area_id: number) => {
    if (!validateName(name, 'room')) return false
    if (!area_id) {
      toast.error(t('location.select_area_required'))
      return false
    }
    return handleOperation(
      () => post<Room>('/rooms', { name, area_id }),
      t('location.room_created'),
      t('location.create_failed'),
      refreshRooms
    )
  }

  // 更新房间
  const handleUpdateRoom = async (roomId: number, data: { name: string; area_id: number }) => {
    if (!validateName(data.name, 'room')) return false
    return handleOperation(
      () => updateRoom(roomId)(data),
      t('location.room_updated'),
      t('location.update_failed'),
      refreshRooms
    )
  }

  // 添加位置
  const handleAddSpot = async (name: string, room_id: number) => {
    if (!validateName(name, 'spot')) return false
    if (!room_id) {
      toast.error(t('location.select_room_required'))
      return false
    }
    return handleOperation(
      () => post<Spot>('/spots', { name, room_id }),
      t('location.spot_created'),
      t('location.create_failed'),
      refreshSpots
    )
  }

  // 更新位置
  const handleUpdateSpot = async (spotId: number, data: { name: string; room_id: number }) => {
    if (!validateName(data.name, 'spot')) return false
    return handleOperation(
      () => updateSpot(spotId)(data),
      t('location.spot_updated'),
      t('location.update_failed'),
      refreshSpots
    )
  }

  // 删除确认
  const confirmDelete = (id: number, type: LocationType) => {
    setItemToDelete({ id, type })
    setDeleteDialogOpen(true)
  }

  // 执行删除
  const handleDelete = async () => {
    if (!itemToDelete) return false

    const deleteOperations = {
      area: { fn: deleteArea, refresh: refreshAreas },
      room: { fn: deleteRoom, refresh: refreshRooms },
      spot: { fn: deleteSpot, refresh: refreshSpots },
    }

    const { fn, refresh } = deleteOperations[itemToDelete.type]
    const successMessageMap = {
      area: t('location.area_deleted'),
      room: t('location.room_deleted'),
      spot: t('location.spot_deleted'),
    }
    const successMessage = successMessageMap[itemToDelete.type]

    try {
      setLoading(true)
      await fn(itemToDelete.id)
      refresh()
      toast.success(successMessage)
      return true
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('location.delete_failed'))
      return false
    } finally {
      setLoading(false)
      setDeleteDialogOpen(false)
      setItemToDelete(null)
    }
  }

  // 处理位置选择
  const handleLocationSelect = (type: LocationType, id: number) => {
    setSelectedLocation({ type, id })
  }

  return {
    // 数据
    areas,
    rooms,
    spots,
    // 状态
    loading,
    deleteDialogOpen,
    setDeleteDialogOpen,
    itemToDelete,
    selectedLocation,
    setSelectedLocation,
    // 操作方法
    handleAddArea,
    handleUpdateArea,
    handleSetDefaultArea,
    handleAddRoom,
    handleUpdateRoom,
    handleAddSpot,
    handleUpdateSpot,
    confirmDelete,
    handleDelete,
    handleLocationSelect,
    // 刷新方法
    refreshAreas,
    refreshRooms,
    refreshSpots,
  }
}
