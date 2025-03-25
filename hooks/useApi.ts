import useSWR, { mutate } from 'swr';
import { apiRequest } from '@/utils/api';
import type { User, ApiError, Category, Area, Room, Spot, Item } from '@/types';

// 通用 fetcher 函数
const fetcher = async <T>(url: string): Promise<T> => {
  return apiRequest<T>(url);
};

// 用户相关 hooks
export const useUser = () => {
  return useSWR<User>('/user', fetcher);
};

// 物品相关 hooks
export const useItems = (params?: Record<string, any>) => {
  const queryString = new URLSearchParams(params || {}).toString();
  const url = `/items${queryString ? `?${queryString}` : ''}`;
  return useSWR<{ data: Item[]; meta: any }>(url, fetcher);
};

export const useItem = (id: number) => {
  return useSWR<Item>(id ? `/items/${id}` : null, fetcher);
};

// 分类相关 hooks
export const useCategories = () => {
  return useSWR<Category[]>('/categories', fetcher);
};

export const useCategory = (id: number) => {
  return useSWR<Category>(id ? `/categories/${id}` : null, fetcher);
};

// 区域相关 hooks
export const useAreas = () => {
  return useSWR<Area[]>('/areas', fetcher);
};

export const useArea = (id: number) => {
  return useSWR<Area>(id ? `/areas/${id}` : null, fetcher);
};

// 房间相关 hooks
export const useRooms = (areaId?: number) => {
  const url = areaId ? `/areas/${areaId}/rooms` : '/rooms';
  return useSWR<Room[]>(url, fetcher);
};

export const useRoom = (id: number) => {
  return useSWR<Room>(id ? `/rooms/${id}` : null, fetcher);
};

// 位置相关 hooks
export const useSpots = (roomId?: number) => {
  const url = roomId ? `/rooms/${roomId}/spots` : '/spots';
  return useSWR<Spot[]>(url, fetcher);
};

export const useSpot = (id: number) => {
  return useSWR<Spot>(id ? `/spots/${id}` : null, fetcher);
};

// 统计相关 hooks
export const useStatistics = () => {
  return useSWR<{
    total_items: number;
    total_categories: number;
    total_areas: number;
    total_rooms: number;
    total_spots: number;
  }>('/statistics', fetcher);
};

// 导航相关 hooks
export const useNavCategories = () => {
  return useSWR<Category[]>('/nav/categories', fetcher);
};

export const useNavItems = (categoryId?: number) => {
  const url = categoryId ? `/nav/items?category_id=${categoryId}` : '/nav/items';
  return useSWR<Item[]>(url, fetcher);
};

// 通用 mutation 函数
export const createMutation = <T>(endpoint: string, method: string = 'POST') => {
  return async (data: any) => {
    const result = await apiRequest<T>(endpoint, method, data);
    // 重新验证相关数据
    await mutate(endpoint);
    return result;
  };
};

// 导出一些常用的 mutation
export const createItem = createMutation<Item>('/items', 'POST');
export const updateItem = (id: number) => createMutation<Item>(`/items/${id}`, 'PUT');
export const deleteItem = (id: number) => createMutation<void>(`/items/${id}`, 'DELETE');

export const createCategory = createMutation<Category>('/categories', 'POST');
export const updateCategory = (id: number) => createMutation<Category>(`/categories/${id}`, 'PUT');
export const deleteCategory = (id: number) => createMutation<void>(`/categories/${id}`, 'DELETE');

export const createArea = createMutation<Area>('/areas', 'POST');
export const updateArea = (id: number) => createMutation<Area>(`/areas/${id}`, 'PUT');
export const deleteArea = (id: number) => createMutation<void>(`/areas/${id}`, 'DELETE');

export const createRoom = createMutation<Room>('/rooms', 'POST');
export const updateRoom = (id: number) => createMutation<Room>(`/rooms/${id}`, 'PUT');
export const deleteRoom = (id: number) => createMutation<void>(`/rooms/${id}`, 'DELETE');

export const createSpot = createMutation<Spot>('/spots', 'POST');
export const updateSpot = (id: number) => createMutation<Spot>(`/spots/${id}`, 'PUT');
export const deleteSpot = (id: number) => createMutation<void>(`/spots/${id}`, 'DELETE'); 