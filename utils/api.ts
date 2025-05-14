import useSWR, { mutate } from 'swr';
import useAuthStore from '../stores/authStore';
import type { Category, Area, Room, Spot, Item } from '@/app/thing/types';
import type { User, ApiError } from '@/app';
import { toast } from 'sonner';

export const API_URL = process.env.NEXT_PUBLIC_API_URL;

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
  data?: any,
  options?: {
    handleError?: boolean; // 是否自动处理错误，默认为true
  }
): Promise<T> {
  const { handleError = true } = options || {};
  const url = `${API_URL}/api${endpoint}`;
  
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
      } catch (parseError) {
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
    // 检查是否为自定义API错误，并且未设置自动处理错误
    if (error instanceof ApiRequestError) {
      // 如果设置了自动处理错误但尚未处理，则显示错误提示
      if (handleError && error.status !== 401) { // 401错误已在上面处理
        handleApiError(error);
      }
      throw error;
    }
    
    // 检查是否为网络错误或跨域错误
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // 记录详细错误信息
    console.error('API请求错误:', {
      url,
      method,
      error: errorMessage,
      isFormData: data instanceof FormData,
      hasAbortSignal: requestOptions.signal instanceof AbortSignal
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
      
      // 为用户提供更友好的错误信息
      if (/iPad|iPhone|iPod/.test(navigator.userAgent) && data instanceof FormData) {
        const iosError = new Error('文件上传失败，这可能是由于网络连接问题或iOS设备限制导致的。请尝试：\n1. 使用WiFi网络\n2. 选择较小的图片\n3. 稍后再试');
        if (handleError) {
          handleApiError(iosError);
        }
        throw iosError;
      }
    }
    
    // 处理其他错误
    if (handleError && error instanceof Error) {
      handleApiError(error);
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
  // 使用符合spatie/laravel-query-builder的参数格式
  const queryParams = new URLSearchParams();
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        // 页码不需要加filter前缀
        if (key === 'page') {
          queryParams.append(key, String(value));
        } else {
          queryParams.append(`filter[${key}]`, String(value));
        }
      }
    });
  }
  
  const queryString = queryParams.toString();
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
  API_URL,
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

// 用于构建图片URL的辅助函数
export const getImageUrl = (path: string) => {
  if (!path) return '';
  
  // 如果已经是完整URL，则直接返回（但需要清理掉错误的参数格式）
  if (path.startsWith('http://') || path.startsWith('https://')) {
    // 移除错误格式的参数，如&w=3D1200&q=3D75
    return path.replace(/&w=3D\d+&q=3D\d+/g, '');
  }

  // 确保path不以斜杠开头
  const normalizedPath = path.startsWith('/') ? path.substring(1) : path;
  
  return `${API_URL}/storage/${normalizedPath}`;
}; 