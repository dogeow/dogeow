import type Echo from 'laravel-echo'
import { getAuthManager } from '@/lib/websocket'
import type { ConnectionError } from '@/lib/websocket/error-handler'

/**
 * 检查 Echo 实例是否已连接
 */
export const isEchoConnected = (echo: Echo<'reverb'> | null): boolean => {
  if (!echo) return false

  try {
    if (echo.connector && 'pusher' in echo.connector) {
      const connector = echo.connector as { pusher?: { connection?: { state?: string } } }
      const state = connector.pusher?.connection?.state
      return state === 'connected' || state === 'connecting'
    }
  } catch (error) {
    console.warn('WebSocket: Error checking connection state:', error)
  }

  return false
}

/**
 * 获取认证 token，如果不存在则尝试刷新
 */
export const getAuthToken = async (
  authTokenRefreshCallback?: () => Promise<string | null>
): Promise<string | null> => {
  const authManager = getAuthManager()
  let token = authManager.getToken()

  if (!token && authTokenRefreshCallback) {
    console.log('WebSocket: Refreshing auth token')
    token = await authTokenRefreshCallback()
  }

  return token
}

/**
 * 创建连接错误对象
 */
export const createConnectionError = (
  message: string,
  retryable: boolean = true
): ConnectionError => ({
  type: 'connection',
  message,
  timestamp: new Date(),
  retryable,
})
