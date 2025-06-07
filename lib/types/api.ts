// 基础 API 响应类型
export interface ApiResponse<T = unknown> {
  data: T;
  message?: string;
  status?: number;
}

// 分页响应类型
export interface PaginatedResponse<T = unknown> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
  links: {
    first: string;
    last: string;
    prev: string | null;
    next: string | null;
  };
}

// 错误响应类型
export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
  status?: number;
}

// 认证相关类型
export interface User {
  id: number;
  name: string;
  email: string;
  email_verified_at?: string;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  expires_at?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  remember?: boolean;
}

// 文件上传类型
export interface UploadResponse {
  url: string;
  path: string;
  filename: string;
  size: number;
  mime_type: string;
}

// 通用查询参数
export interface QueryParams {
  page?: number;
  per_page?: number;
  search?: string;
  sort?: string;
  order?: 'asc' | 'desc';
  filter?: Record<string, unknown>;
}

// HTTP 方法类型
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

// API 请求配置
export interface ApiRequestConfig {
  method?: HttpMethod;
  headers?: Record<string, string>;
  params?: QueryParams;
  data?: unknown;
  timeout?: number;
  handleError?: boolean;
}

// SWR 配置类型
export interface SWRConfig {
  revalidateOnFocus?: boolean;
  revalidateOnReconnect?: boolean;
  refreshInterval?: number;
  dedupingInterval?: number;
  errorRetryCount?: number;
  errorRetryInterval?: number;
}

// 通用实体类型
export interface BaseEntity {
  id: number;
  created_at: string;
  updated_at: string;
}

// 软删除实体类型
export interface SoftDeleteEntity extends BaseEntity {
  deleted_at?: string;
} 