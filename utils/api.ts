import useSWR, { mutate } from 'swr';
import useAuthStore from '../stores/authStore';
import type { Category, Area, Room, Spot, Item } from '@/app/thing/types';
import type { User, ApiError } from '@/app';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000/api';

/**
 * 创建带有认证token的请求头
 */
const getHeaders = () => {
  const token = useAuthStore.getState().token;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

/**
 * 通用API请求函数
 */
export async function apiRequest<T>(
  endpoint: string, 
  method: string = 'GET', 
  data?: any
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const options: RequestInit = {
    method,
    headers: getHeaders(),
  };
  
  if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    options.body = JSON.stringify(data);
  }
  
  const response = await fetch(url, options);
  
  // 处理401未授权错误
  if (response.status === 401) {
    // token过期或无效，登出用户
    useAuthStore.getState().logout();
    // 如果在浏览器环境，重定向到登录页
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    throw new Error('登录已过期，请重新登录');
  }
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({})) as ApiError;
    throw new Error(errorData.message || '请求失败');
  }
  
  return response.json();
}

/**
 * GET 请求
 */
export function get<T>(endpoint: string): Promise<T> {
  return apiRequest<T>(endpoint, 'GET');
}

/**
 * POST 请求
 */
export function post<T>(endpoint: string, data: any): Promise<T> {
  return apiRequest<T>(endpoint, 'POST', data);
}

/**
 * PUT 请求
 */
export function put<T>(endpoint: string, data: any): Promise<T> {
  return apiRequest<T>(endpoint, 'PUT', data);
}

/**
 * PATCH 请求
 */
export function patch<T>(endpoint: string, data: any): Promise<T> {
  return apiRequest<T>(endpoint, 'PATCH', data);
}

/**
 * DELETE 请求
 */
export function del<T>(endpoint: string): Promise<T> {
  return apiRequest<T>(endpoint, 'DELETE');
}

// 通用 fetcher 函数 (用于 SWR)
const fetcher = async <T>(url: string): Promise<T> => {
  return apiRequest<T>(url);
};

/**
 * 获取当前用户信息
 */
export const fetchCurrentUser = () => get<User>('/user');

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

export default {
  get,
  post,
  put,
  patch,
  delete: del,
  fetchCurrentUser,
  API_BASE_URL,
  useUser,
  useItems,
  useItem,
  useCategories,
  useCategory,
  useAreas,
  useArea,
  useRooms,
  useRoom,
  useSpots,
  useSpot,
  useNavCategories,
  useNavItems
}; 