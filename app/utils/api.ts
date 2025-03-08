import useAuthStore from '../stores/authStore';
import type { User, ApiError } from '../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000/api';

/**
 * 创建带有认证token的请求头
 */
const getHeaders = () => {
  const token = useAuthStore.getState().token;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

/**
 * 通用API请求函数
 */
export const apiRequest = async <T>(
  endpoint: string, 
  method: string = 'GET', 
  data?: any
): Promise<T> => {
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
};

// 便捷方法
export const get = <T>(endpoint: string) => apiRequest<T>(endpoint);

export const post = <T>(endpoint: string, data: any) => 
  apiRequest<T>(endpoint, 'POST', data);

export const put = <T>(endpoint: string, data: any) => 
  apiRequest<T>(endpoint, 'PUT', data);

export const patch = <T>(endpoint: string, data: any) => 
  apiRequest<T>(endpoint, 'PATCH', data);

export const del = <T>(endpoint: string) => 
  apiRequest<T>(endpoint, 'DELETE');

/**
 * 获取当前用户信息
 */
export const fetchCurrentUser = () => get<User>('/user');

export default {
  get,
  post,
  put,
  patch,
  delete: del,
  fetchCurrentUser,
}; 