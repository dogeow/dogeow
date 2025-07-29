'use client'

import useSWR, { mutate } from 'swr'
import useAuthStore from '../../stores/authStore'

import type { User, ApiError } from '@/app'
import { toast } from 'sonner'

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

// 自定义API错误类
export class ApiRequestError extends Error {
  status: number
  data?: ApiError

  constructor(message: string, status: number, data?: ApiError) {
    super(message)
    this.name = 'ApiRequestError'
    this.status = status
    this.data = data
  }
}

/**
 * 统一处理API错误
 */
export const handleApiError = (error: unknown): void => {
  if (error instanceof ApiRequestError) {
    const { status, data, message } = error

    if (status >= 400 && status < 500) {
      // 处理验证错误
      if (status === 422 && data?.errors) {
        const firstErrorField = Object.keys(data.errors)[0]
        if (
          firstErrorField &&
          Array.isArray(data.errors[firstErrorField]) &&
          data.errors[firstErrorField].length > 0
        ) {
          toast.error(data.errors[firstErrorField][0])
          return
        }
      }

      toast.error(message || `请求失败 (${status})`)
    } else if (status >= 500) {
      toast.error('服务器错误，请稍后重试')
    }
  } else if (error instanceof Error) {
    toast.error(error.message || '请求失败，请重试')
  } else {
    toast.error('请求失败，请重试')
  }
}

/**
 * 创建请求头
 */
const createHeaders = (isFormData = false): Record<string, string> => {
  const token = useAuthStore.getState().token

  const headers: Record<string, string> = {
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  }

  if (!isFormData) {
    headers['Content-Type'] = 'application/json'
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  return headers
}

/**
 * 处理响应
 */
const handleResponse = async <T>(response: Response): Promise<T> => {
  // 处理401未授权
  if (response.status === 401) {
    useAuthStore.getState().logout()
    if (typeof window !== 'undefined') {
      window.location.href = '/'
    }
    throw new Error('登录已过期，请重新登录')
  }

  if (!response.ok) {
    let errorMessage = '请求失败'
    let errorData: ApiError | undefined

    try {
      errorData = (await response.json()) as ApiError
      errorMessage = errorData?.message || `请求失败 (${response.status})`

      // 记录错误详情
      if (errorData?.errors && Object.keys(errorData.errors).length > 0) {
        if (process.env.NODE_ENV !== 'production') {
          if (response.status === 422) {
            console.warn('验证失败:', errorData.errors)
          } else {
            console.error('API错误详情:', errorData.errors)
          }
        }
      }
    } catch {
      errorMessage = `请求失败: ${response.statusText || response.status}`
    }

    throw new ApiRequestError(errorMessage, response.status, errorData)
  }

  // 处理空响应
  const contentType = response.headers.get('content-type')
  if (response.status === 204 || !contentType?.includes('application/json')) {
    if (response.status === 204) {
      return {} as T
    }

    const text = await response.text()
    if (text) {
      return text as unknown as T
    }

    return {} as T
  }

  try {
    return (await response.json()) as T
  } catch (error) {
    console.error('解析JSON响应失败:', error)
    throw new Error('解析响应失败')
  }
}

/**
 * 创建超时控制器
 */
const createTimeoutController = (isFormData: boolean) => {
  const controller = new AbortController()
  const timeoutDuration = isFormData ? 60000 : 30000

  const timeoutId = window.setTimeout(() => {
    controller.abort()
  }, timeoutDuration)

  return { controller, timeoutId, timeoutDuration }
}

/**
 * 通用API请求函数
 */
export async function apiRequest<T>(
  endpoint: string,
  method: string = 'GET',
  data?: unknown,
  options?: { handleError?: boolean }
): Promise<T> {
  const { handleError = true } = options || {}

  // 构建URL
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint
  const url = `${API_URL}/api/${normalizedEndpoint}`

  const isFormData = data instanceof FormData
  const headers = createHeaders(isFormData)

  const requestOptions: RequestInit = {
    method,
    headers,
  }

  // 处理请求体
  if (data && ['POST', 'PUT', 'PATCH'].includes(method)) {
    requestOptions.body = isFormData ? data : JSON.stringify(data)

    if (isFormData && process.env.NODE_ENV !== 'production') {
      console.log('发送FormData请求:', endpoint)
    }
  }

  try {
    const { controller, timeoutId, timeoutDuration } = createTimeoutController(isFormData)
    requestOptions.signal = controller.signal

    // 创建超时Promise
    const timeoutPromise = new Promise<Response>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`请求超时 (${timeoutDuration / 1000}秒)`))
      }, timeoutDuration)
    })

    // 竞争获取响应
    const response = (await Promise.race([fetch(url, requestOptions), timeoutPromise])) as Response

    clearTimeout(timeoutId)

    return await handleResponse<T>(response)
  } catch (error) {
    // 添加错误调试信息
    if (process.env.NODE_ENV === 'development') {
      console.group('API Request Error Debug')
      console.error('Error type:', typeof error)
      console.error('Error value:', error)
      console.error('Error instanceof Error:', error instanceof Error)
      console.error('Error instanceof ApiRequestError:', error instanceof ApiRequestError)
      console.error('Error instanceof DOMException:', error instanceof DOMException)
      if (error instanceof Error) {
        console.error('Error name:', error.name)
        console.error('Error message:', error.message)
        console.error('Error stack:', error.stack)
      }
      console.groupEnd()
    }

    // 处理各种错误类型
    if (error instanceof DOMException && error.name === 'AbortError') {
      const timeoutError = new Error('请求超时，请重试')
      if (handleError) handleApiError(timeoutError)
      throw timeoutError
    }

    if (error instanceof Error && error.message === 'Failed to fetch') {
      const networkError = new Error('网络连接失败，请检查网络')
      if (handleError) handleApiError(networkError)
      throw networkError
    }

    if (error instanceof ApiRequestError) {
      if (handleError) handleApiError(error)
      throw error
    }

    // 确保所有错误都是Error实例
    if (!(error instanceof Error)) {
      const genericError = new Error(`API请求失败: ${String(error)}`)
      if (handleError) handleApiError(genericError)
      throw genericError
    }

    if (handleError) {
      handleApiError(error)
    }

    throw error
  }
}

// HTTP方法包装器
export const get = <T>(endpoint: string): Promise<T> => {
  if (process.env.NODE_ENV !== 'production') {
    console.log('[SWR GET]', endpoint)
  }
  return apiRequest<T>(endpoint, 'GET')
}

export const post = <T>(endpoint: string, data: unknown): Promise<T> =>
  apiRequest<T>(endpoint, 'POST', data)

export const put = <T>(endpoint: string, data: unknown): Promise<T> =>
  apiRequest<T>(endpoint, 'PUT', data)

export const patch = <T>(endpoint: string, data: unknown): Promise<T> =>
  apiRequest<T>(endpoint, 'PATCH', data)

export const del = <T>(endpoint: string): Promise<T> => apiRequest<T>(endpoint, 'DELETE')

export const uploadFile = <T>(endpoint: string, formData: FormData): Promise<T> =>
  apiRequest<T>(endpoint, 'POST', formData)

// SWR fetcher
const fetcher = <T>(url: string): Promise<T> => get<T>(url)

// 用户相关API
export const fetchCurrentUser = () => get<User>('/user')
export const useUser = () => useSWR<User>('/user', fetcher)

// 创建变更函数
export const createMutation = <T>(endpoint: string, method: string = 'POST') => {
  return async (data: unknown): Promise<T> => {
    const result = await apiRequest<T>(endpoint, method, data)

    // 自动重新验证相关资源
    await mutate(key => {
      if (typeof key !== 'string') return false
      return key === endpoint || key.startsWith(endpoint.split('/')[1])
    })

    return result
  }
}
