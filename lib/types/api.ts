// 标准 API 响应信封（后端统一格式）
export interface ApiEnvelope<T = unknown> {
  success: boolean
  message: string
  data?: T
  errors?: Record<string, string[]> | unknown
  pagination?: PaginationMeta
  meta?: Record<string, unknown>
}

// 前端解包后的业务数据类型（由 unwrapApiPayload 自动提取 data 字段）
export interface ApiResponse<T = unknown> {
  data: T
  message?: string
  status?: number
}

// 分页元数据
export interface PaginationMeta {
  current_page: number
  last_page: number
  per_page: number
  total: number
  from: number | null
  to: number | null
  has_more_pages: boolean
  prev_page_url: string | null
  next_page_url: string | null
}

// 分页响应类型（解包后）
export interface PaginatedResponse<T = unknown> {
  data: T[]
  current_page: number
  last_page: number
  per_page: number
  total: number
  from: number
  to: number
  links: {
    first: string
    last: string
    prev: string | null
    next: string | null
  }
}

// 错误响应类型
export interface ApiError {
  success: false
  message: string
  errors?: Record<string, string[]>
  status?: number
}

// 认证相关类型
export interface User {
  id: number
  name: string
  email: string
  email_verified_at?: string
  created_at: string
  updated_at: string
}

export interface AuthResponse {
  user: User
  token: string
  expires_at?: string
}

export interface LoginRequest {
  email: string
  password: string
  remember?: boolean
}

// 文件上传类型
export interface UploadResponse {
  url: string
  path: string
  filename: string
  size: number
  mime_type: string
}

// 通用查询参数
export interface QueryParams {
  page?: number
  per_page?: number
  search?: string
  sort?: string
  order?: 'asc' | 'desc'
  filter?: Record<string, unknown>
}

// HTTP 方法类型
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

// API 请求配置
export interface ApiRequestConfig {
  method?: HttpMethod
  headers?: Record<string, string>
  params?: QueryParams
  data?: unknown
  timeout?: number
  handleError?: boolean
}

// SWR 配置类型
export interface SWRConfig {
  revalidateOnFocus?: boolean
  revalidateOnReconnect?: boolean
  refreshInterval?: number
  dedupingInterval?: number
  errorRetryCount?: number
  errorRetryInterval?: number
}

// 通用实体类型
export interface BaseEntity {
  id: number
  created_at: string
  updated_at: string
}

// 软删除实体类型
export interface SoftDeleteEntity extends BaseEntity {
  deleted_at?: string
}
