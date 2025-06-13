'use client'

import useSWR, { mutate } from 'swr';
import useAuthStore from '../../stores/authStore';
import type { Category, Area, Room, Spot, Item } from '@/app/thing/types';
import type { User, ApiError } from '@/app';
import { toast } from 'sonner';

// 确保API URL正确设置，避免环境变量问题
let API_URL = process.env.NEXT_PUBLIC_API_URL;
// 如果环境变量不可用，使用默认值
if (!API_URL) {
  API_URL = 'http://127.0.0.1:8000';
  console.warn('未找到NEXT_PUBLIC_API_URL环境变量，使用默认值:', API_URL);
}
// 移除末尾的斜杠，确保统一格式
if (API_URL.endsWith('/')) {
  API_URL = API_URL.slice(0, -1);
}

export { API_URL };

// 自定义API错误类，包含完整的错误信息
export class ApiRequestError extends Error {
  status: number;
  data?: ApiError;
  
  constructor(message: string, status: number, data?: ApiError) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.data = data;
  }
}

/**
 * 统一处理API错误，显示提示信息
 */
export const handleApiError = (error: unknown): void => {
  if (error instanceof ApiRequestError) {
    const { status, data, message } = error;
    
    // 处理400系列错误（客户端错误）
    if (status >= 400 && status < 500) {
      // 处理特定的验证错误
      if (status === 422 && data?.errors) {
        // 查找第一个验证错误消息
        const firstErrorField = Object.keys(data.errors)[0];
        if (firstErrorField && Array.isArray(data.errors[firstErrorField]) && data.errors[firstErrorField].length > 0) {
          const errorMsg = data.errors[firstErrorField][0];
            toast.error(errorMsg);
          return;
        }
      }
      
      // 处理其他400系列错误
      toast.error(message || `请求失败 (${status})`);
    } 
    // 处理500系列错误（服务器错误）
    else if (status >= 500) {
      toast.error('服务器错误，请稍后再试');
    }
  } else if (error instanceof Error) {
    // 处理其他类型的错误
    toast.error(error.message || '请求失败，请重试');
  } else {
    // 处理未知错误
    toast.error('请求失败，请重试');
  }
};

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
  data?: unknown,
  options?: {
    handleError?: boolean; // 是否自动处理错误，默认为true
  }
): Promise<T> {
  const { handleError = true } = options || {};
  
  // 标准化 endpoint：确保它不以斜杠开头
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
  
  // 构建完整的 URL
  const url = `${API_URL}/api/${normalizedEndpoint}`;
  
  const headers = getHeaders();
  const requestOptions: RequestInit = {
    method,
    headers,
  };
  
  if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    // 检查是否为 FormData 类型
    if (data instanceof FormData) {
      // FormData 不需要设置 Content-Type，浏览器会自动设置正确的 boundary
      const headersObj = requestOptions.headers as Record<string, string>;
      // 保存授权信息
      const authToken = headersObj['Authorization'];
      // 重新设置headers
      requestOptions.headers = {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      };
      
      // 确保授权头部被正确设置
      if (authToken) {
        (requestOptions.headers as Record<string, string>)['Authorization'] = authToken;
      }
      
      requestOptions.body = data;
      
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
      requestOptions.body = JSON.stringify(data);
    }
  }
  
  try {
    // 为FormData请求增加超时处理
    let timeoutId: number | null = null;
    const isFormDataRequest = data instanceof FormData;
    
    // 创建用于取消请求的控制器
    const controller = new AbortController();
    requestOptions.signal = controller.signal;
    
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
    const fetchPromise = fetch(url, requestOptions);
    
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
      let errorData: ApiError | undefined;
      
      try {
        errorData = await response.json() as ApiError;
        errorMessage = errorData?.message || `请求失败 (${response.status})`;
        
        // 安全地记录错误详情，避免空对象或无效对象导致的问题
        if (errorData && errorData.errors) {
          // 只有当 errors 是非空对象时才记录
          const hasErrors = typeof errorData.errors === 'object' && 
                           errorData.errors !== null && 
                           Object.keys(errorData.errors).length > 0;
          
          if (hasErrors) {
            // 对验证错误(422)使用warn级别，对其他错误使用error级别
            if (response.status === 422) {
              console.warn('验证失败:', errorData.errors);
            } else {
              console.error('API错误详情:', errorData.errors);
            }
          }
        }
      } catch {
        // 如果无法解析JSON，使用HTTP状态文本
        errorMessage = `请求失败: ${response.statusText || response.status}`;
      }
      
      // 在开发环境下打印详细的错误信息（避免在生产环境显示过多错误）
      if (process.env.NODE_ENV !== 'production') {
        if (response.status === 422) {
          // 对于验证错误使用warn而不是error
          console.warn('API请求验证失败:', { 
            url: endpoint, 
            status: response.status, 
            message: errorMessage
          });
        } else {
          console.error('API请求失败:', { 
            url: endpoint, 
            status: response.status, 
            message: errorMessage
          });
        }
      }
      
      // 创建API错误对象
      const apiError = new ApiRequestError(errorMessage, response.status, errorData);
      
      // 如果设置了自动处理错误，则显示错误提示
      if (handleError) {
        handleApiError(apiError);
      }
      
      // 抛出错误供调用者捕获
      throw apiError;
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
        url: endpoint,
        status: response.status,
        contentType,
        text: text.substring(0, 200) // 只记录前200个字符
      });
      
      // 如果响应为文本且不为空，尝试将其作为响应返回
      if (text) {
        return text as unknown as T;
      }
      
      // 返回空对象
      return {} as T;
    }
    
    // 尝试解析JSON响应
    try {
      return await response.json() as T;
    } catch (error) {
      console.error('解析JSON响应失败:', error);
      throw new Error('解析服务器响应失败');
    }
  } catch (error) {
    // 处理AbortError（由于超时或手动取消而被中止的请求）
    if (error instanceof DOMException && error.name === 'AbortError') {
      const timeoutError = new Error('请求超时，请重试');
      if (options?.handleError !== false) {
        handleApiError(timeoutError);
      }
      throw timeoutError;
    }
    
    // 处理网络错误或其他未处理的错误
    if (error instanceof Error && error.message === 'Failed to fetch') {
      const networkError = new Error('网络连接失败，请检查您的网络连接');
      if (options?.handleError !== false) {
        handleApiError(networkError);
      }
      throw networkError;
    }
    
    // 重新抛出ApiRequestError类型的错误而不进一步处理
    if (error instanceof ApiRequestError) {
      throw error;
    }
    
    // 处理其他类型的错误
    if (options?.handleError !== false && error instanceof Error) {
      handleApiError(error);
    }
    
    throw error;
  }
}

// 简便的HTTP方法包装器
export function get<T>(endpoint: string): Promise<T> {
  console.log('[SWR GET]', endpoint); // 调试用
  return apiRequest<T>(endpoint, 'GET');
}

export function post<T>(endpoint: string, data: unknown): Promise<T> {
  return apiRequest<T>(endpoint, 'POST', data);
}

export function put<T>(endpoint: string, data: unknown): Promise<T> {
  return apiRequest<T>(endpoint, 'PUT', data);
}

export function patch<T>(endpoint: string, data: unknown): Promise<T> {
  return apiRequest<T>(endpoint, 'PATCH', data);
}

export function del<T>(endpoint: string): Promise<T> {
  return apiRequest<T>(endpoint, 'DELETE');
}

export function uploadFile<T>(endpoint: string, formData: FormData): Promise<T> {
  return apiRequest<T>(endpoint, 'POST', formData);
}

// SWR fetcher
const fetcher = async <T>(url: string): Promise<T> => {
  return get<T>(url);
};

// 用户相关
export const fetchCurrentUser = () => get<User>('/user');

export const useUser = () => {
  return useSWR<User>('/user', fetcher);
};

// 物品相关
export const useItems = (params?: Record<string, unknown>) => {
  // 构建查询字符串
  let queryString = '';
  if (params) {
    const urlParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      // 过滤掉undefined和null值
      if (value !== undefined && value !== null) {
        // 特殊处理search参数，不加前缀
        if (key === 'search') {
          urlParams.append('search', String(value));
          console.log('API添加搜索参数:', value);
        } else {
          // 其他参数添加filter前缀
          urlParams.append(`filter[${key}]`, String(value));
        }
      }
    });
    queryString = urlParams.toString();
  }
  
  const endpoint = `/items${queryString ? `?${queryString}` : ''}`;
  console.log('API请求URL:', endpoint);
  return useSWR(endpoint, fetcher);
};

export const useItem = (id: number) => {
  return useSWR(id ? `/items/${id}` : null, fetcher);
};

// 分类相关
export const useCategories = () => {
  return useSWR('/things/categories', fetcher);
};

export const useCategory = (id: number) => {
  return useSWR(id ? `/things/categories/${id}` : null, fetcher);
};

// 位置相关 - 统一获取所有位置数据
export const useLocations = () => {
  return useSWR('/locations/tree', fetcher);
};

// 区域相关
export const useAreas = <T = unknown>() => {
  return useSWR<T>('/areas', fetcher);
};

export const useArea = (id?: number) => {
  return useSWR(id ? `/areas/${id}` : null, fetcher);
};

// 房间相关
export const useRooms = <T = unknown>(areaId?: number) => {
  return useSWR<T>(areaId ? `/areas/${areaId}/rooms` : '/rooms', fetcher);
};

export const useRoom = (id?: number) => {
  return useSWR(id ? `/rooms/${id}` : null, fetcher);
};

// 位置相关
export const useSpots = <T = unknown>(roomId?: number) => {
  return useSWR<T>(roomId ? `/rooms/${roomId}/spots` : '/spots', fetcher);
};

export const useSpot = (id?: number) => {
  return useSWR(id ? `/spots/${id}` : null, fetcher);
};

// 导航相关
export const useNavCategories = () => {
  return useSWR('/nav-categories', fetcher);
};

export const useNavItems = (categoryId?: number) => {
  return useSWR(categoryId ? `/nav-categories/${categoryId}/items` : null, fetcher);
};

// 创建通用的变更函数
export const createMutation = <T>(endpoint: string, method: string = 'POST') => {
  return async (data: unknown): Promise<T> => {
    const result = await apiRequest<T>(endpoint, method, data);
    // 自动重新验证相关资源
    await mutate((key) => {
      // 精确匹配或前缀匹配
      return typeof key === 'string' && (key === endpoint || key.startsWith(endpoint.split('/')[1]));
    });
    return result;
  };
};

// 物品操作
export const updateItem = (id: number) => createMutation<Item>(`/items/${id}`, 'PUT');
export const deleteItem = (id: number) => createMutation<void>(`/items/${id}`, 'DELETE');

// 分类操作
export const updateCategory = (id: number) => createMutation<Category>(`/things/categories/${id}`, 'PUT');
export const deleteCategory = (id: number) => createMutation<void>(`/things/categories/${id}`, 'DELETE');

// 区域操作
export const updateArea = (id: number) => createMutation<Area>(`/areas/${id}`, 'PUT');
export const deleteArea = (id: number) => createMutation<void>(`/areas/${id}`, 'DELETE');

// 房间操作
export const updateRoom = (id: number) => createMutation<Room>(`/rooms/${id}`, 'PUT');
export const deleteRoom = (id: number) => createMutation<void>(`/rooms/${id}`, 'DELETE');

// 位置操作
export const updateSpot = (id: number) => createMutation<Spot>(`/spots/${id}`, 'PUT');
export const deleteSpot = (id: number) => createMutation<void>(`/spots/${id}`, 'DELETE');