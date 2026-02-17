import useSWR, { mutate } from 'swr'
import { apiRequest, createMutation } from '@/lib/api'
import type { Category, Area, Room, Spot, Item } from '../types'

// Fetcher function
const fetcher = <T>(url: string): Promise<T> => apiRequest<T>(url)

// SWR 默认缓存配置
const swrOptions = {
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  dedupingInterval: 5000,
}

// ==================== SWR Hooks ====================

// 物品相关 hooks
export const useItems = (params?: Record<string, unknown>) => {
  const buildQueryString = (params?: Record<string, unknown>): string => {
    if (!params || Object.keys(params).length === 0) return ''

    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value))
      }
    })

    return searchParams.toString() ? `?${searchParams.toString()}` : ''
  }

  const queryString = buildQueryString(params)
  return useSWR(`/things/items${queryString}`, fetcher, swrOptions)
}

export const useItem = (id: number) =>
  useSWR<Item>(id ? `/things/items/${id}` : null, fetcher, swrOptions)

// 分类相关 hooks
export const useCategories = () => useSWR('/things/categories', fetcher, swrOptions)

export const useCategory = (id: number) =>
  useSWR(id ? `/things/categories/${id}` : null, fetcher, swrOptions)

// 位置相关 hooks
export const useLocations = () => useSWR('/locations/tree', fetcher, swrOptions)

export const useAreas = <T = unknown>() => useSWR<T>('/areas', fetcher, swrOptions)

export const useArea = (id?: number) => useSWR(id ? `/areas/${id}` : null, fetcher, swrOptions)

export const useRooms = <T = unknown>(areaId?: number) =>
  useSWR<T>(areaId ? `/areas/${areaId}/rooms` : '/rooms', fetcher, swrOptions)

export const useRoom = (id?: number) => useSWR(id ? `/rooms/${id}` : null, fetcher, swrOptions)

export const useSpots = <T = unknown>(roomId?: number) =>
  useSWR<T>(roomId ? `/rooms/${roomId}/spots` : '/spots', fetcher, swrOptions)

export const useSpot = (id?: number) => useSWR(id ? `/spots/${id}` : null, fetcher, swrOptions)

// ==================== Mutation Functions ====================

// 物品操作
export const createItem = () => createMutation<Item>('/things/items', 'POST')
export const updateItem = (id: number) => createMutation<Item>(`/things/items/${id}`, 'PUT')
export const deleteItem = (id: number) => createMutation<void>(`/things/items/${id}`, 'DELETE')

// 分类操作
export const createCategory = () => createMutation<Category>('/things/categories', 'POST')
export const updateCategory = (id: number) =>
  createMutation<Category>(`/things/categories/${id}`, 'PUT')
export const deleteCategory = (id: number) =>
  createMutation<void>(`/things/categories/${id}`, 'DELETE')

// 区域操作
export const createArea = () => createMutation<Area>('/areas', 'POST')
export const updateArea = (id: number) => createMutation<Area>(`/areas/${id}`, 'PUT')
export const deleteArea = (id: number) => createMutation<void>(`/areas/${id}`, 'DELETE')

// 房间操作
export const createRoom = () => createMutation<Room>('/rooms', 'POST')
export const updateRoom = (id: number) => createMutation<Room>(`/rooms/${id}`, 'PUT')
export const deleteRoom = (id: number) => createMutation<void>(`/rooms/${id}`, 'DELETE')

// 位置操作
export const createSpot = () => createMutation<Spot>('/spots', 'POST')
export const updateSpot = (id: number) => createMutation<Spot>(`/spots/${id}`, 'PUT')
export const deleteSpot = (id: number) => createMutation<void>(`/spots/${id}`, 'DELETE')

// ==================== 便捷函数 ====================

/**
 * 刷新物品列表
 */
export const refreshItems = (params?: Record<string, unknown>) => {
  const buildQueryString = (params?: Record<string, unknown>): string => {
    if (!params || Object.keys(params).length === 0) return ''

    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value))
      }
    })

    return searchParams.toString() ? `?${searchParams.toString()}` : ''
  }

  const queryString = buildQueryString(params)
  return mutate(`/things/items${queryString}`)
}

/**
 * 刷新分类列表
 */
export const refreshCategories = () => {
  return mutate('/things/categories')
}

/**
 * 刷新位置树
 */
export const refreshLocations = () => {
  return mutate('/locations/tree')
}

/**
 * 刷新区域列表
 */
export const refreshAreas = () => {
  return mutate('/areas')
}

/**
 * 刷新房间列表
 */
export const refreshRooms = (areaId?: number) => {
  const key = areaId ? `/areas/${areaId}/rooms` : '/rooms'
  return mutate(key)
}

/**
 * 刷新位置列表
 */
export const refreshSpots = (roomId?: number) => {
  const key = roomId ? `/rooms/${roomId}/spots` : '/spots'
  return mutate(key)
}
