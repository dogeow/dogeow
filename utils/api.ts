import useSWR, { mutate } from 'swr';
import useAuthStore from '../stores/authStore';
import type { Category, Area, Room, Spot, Item } from '@/app/thing/types';
import type { User, ApiError } from '@/app';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000';

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
  
  const headers = getHeaders();
  const options: RequestInit = {
    method,
    headers,
  };
  
  if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    // 检查是否为 FormData 类型
    if (data instanceof FormData) {
      // FormData 不需要设置 Content-Type，浏览器会自动设置正确的 boundary
      const headersObj = options.headers as Record<string, string>;
      // 保存授权信息
      const authToken = headersObj['Authorization'];
      // 重新设置headers
      options.headers = {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      };
      
      // 确保授权头部被正确设置
      if (authToken) {
        (options.headers as Record<string, string>)['Authorization'] = authToken;
      }
      
      options.body = data;
      
      // 记录FormData详情（不包括文件内容）
      console.log('发送FormData请求:', endpoint);
      if (data.has('images[0]')) {
        const imageFiles = [];
        for (let i = 0; data.has(`images[${i}]`); i++) {
          const file = data.get(`images[${i}]`) as File;
          if (file) {
            imageFiles.push({
              name: file.name,
              type: file.type,
              size: file.size
            });
          }
        }
        console.log('包含图片:', imageFiles);
      }
    } else {
      options.body = JSON.stringify(data);
    }
  }
  
  try {
    // 为FormData请求增加超时处理
    let timeoutId: number | null = null;
    const isFormDataRequest = data instanceof FormData;
    
    // 创建用于取消请求的控制器
    const controller = new AbortController();
    options.signal = controller.signal;
    
    // 对于图片上传请求使用更长的超时时间
    const timeoutDuration = isFormDataRequest ? 60000 : 30000; // 60秒用于文件上传，30秒用于普通请求
    
    // 创建超时Promise
    const timeoutPromise = new Promise<Response>((_, reject) => {
      timeoutId = window.setTimeout(() => {
        controller.abort();
        reject(new Error(`请求超时 (${timeoutDuration / 1000}秒)`));
      }, timeoutDuration);
    });
    
    // 创建fetch Promise
    const fetchPromise = fetch(url, options);
    
    // 使用Promise.race竞争超时
    const response = await Promise.race([fetchPromise, timeoutPromise]) as Response;
    
    // 清除超时定时器
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    
    // 处理401未授权错误
    if (response.status === 401) {
      // token过期或无效，登出用户
      useAuthStore.getState().logout();
      // 如果在浏览器环境，重定向到根路径
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
      throw new Error('登录已过期，请重新登录');
    }
    
    if (!response.ok) {
      // 尝试解析错误信息
      let errorMessage = '请求失败';
      try {
        const errorData = await response.json() as ApiError;
        errorMessage = errorData.message || `请求失败 (${response.status})`;
        
        // 如果有详细错误信息，记录到控制台
        if (errorData.errors) {
          console.error('API错误详情:', errorData.errors);
        }
      } catch (parseError) {
        // 如果无法解析JSON，使用HTTP状态文本
        errorMessage = `请求失败: ${response.statusText || response.status}`;
      }
      
      throw new Error(errorMessage);
    }
    
    // 对于空响应或非JSON响应进行特殊处理
    const contentType = response.headers.get('content-type');
    if (response.status === 204 || !contentType || !contentType.includes('application/json')) {
      // 处理非JSON响应或空响应
      if (response.status === 204) {
        return {} as T; // 204 No Content
      }
      
      // 尝试获取响应文本
      const text = await response.text();
      console.warn('收到非JSON响应:', {
        status: response.status,
        contentType,
        text: text.substring(0, 100) // 只显示前100个字符
      });
      
      // 尝试将其解析为JSON，如果失败则返回空对象
      try {
        return JSON.parse(text) as T;
      } catch (e) {
        return {} as T;
      }
    }
    
    return response.json();
  } catch (error) {
    // 检查是否为网络错误或跨域错误
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // 记录详细错误信息
    console.error('API请求错误:', {
      url,
      method,
      error: errorMessage,
      isFormData: data instanceof FormData,
      hasAbortSignal: options.signal instanceof AbortSignal
    });
    
    // 记录特定iOS错误模式
    if (errorMessage.includes('Load failed') || 
        errorMessage.includes('network error') || 
        errorMessage.includes('aborted')) {
      
      // 收集错误上下文
      const errorContext = {
        url,
        method,
        isFormData: data instanceof FormData,
        userAgent: navigator.userAgent,
        isIOS: /iPad|iPhone|iPod/.test(navigator.userAgent),
        connectionType: (navigator as any).connection ? (navigator as any).connection.effectiveType : 'unknown',
        timestamp: new Date().toISOString()
      };
      
      // 使用自定义函数记录iOS错误
      if (typeof logErrorToServer === 'function') {
        logErrorToServer('ios_network_error', `iOS上传错误: ${errorMessage}`, errorContext);
      }
      
      // 为用户提供更友好的错误信息
      if (/iPad|iPhone|iPod/.test(navigator.userAgent) && data instanceof FormData) {
        throw new Error('文件上传失败，这可能是由于网络连接问题或iOS设备限制导致的。请尝试：\n1. 使用WiFi网络\n2. 选择较小的图片\n3. 稍后再试');
      }
    }
    
    throw error;
  }
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

/**
 * 文件上传请求
 */
export function uploadFile<T>(endpoint: string, formData: FormData): Promise<T> {
  return apiRequest<T>(endpoint, 'POST', formData);
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

/**
 * 记录错误日志到后端
 */
export async function logErrorToServer(
  errorType: string, 
  errorMessage: string, 
  errorDetails: Record<string, any> = {}
): Promise<void> {
  try {
    const errorLog = {
      error_type: errorType,
      error_message: errorMessage,
      error_details: errorDetails,
      user_agent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      url: window.location.href
    };
    
    console.log('发送错误日志到服务器:', errorLog);
    
    // 发送日志到后端
    await apiRequest('/debug/log-error', 'POST', errorLog);
  } catch (err) {
    // 如果记录日志失败，只在控制台记录，不抛出异常
    console.error('记录错误日志到服务器失败:', err);
  }
} 