import { createEchoInstance, destroyEchoInstance } from './echo'

export interface AuthTokenManager {
  getToken: () => string | null
  setToken: (token: string) => void
  removeToken: () => void
  refreshToken: () => Promise<string | null>
}

class WebSocketAuthManager {
  private refreshCallback: (() => Promise<string | null>) | null = null

  constructor() {
    // 监听 storage 事件，实现多标签页 token 同步
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', this.handleStorageChange.bind(this))
    }
  }

  private handleStorageChange(event: StorageEvent) {
    if (event.key === 'auth-storage' && event.newValue !== event.oldValue) {
      try {
        const authData = JSON.parse(event.newValue || '{}')
        const token = authData.state?.token
        if (token) {
          // 其他标签页的 token 发生变化，使用新 token 重新连接
          this.reconnectWithNewToken(token)
        }
      } catch (error) {
        console.warn('解析 auth storage 数据失败:', error)
      }
    }
  }

  private reconnectWithNewToken(token: string | null) {
    if (token) {
      // 销毁当前连接，并用新 token 创建新连接
      destroyEchoInstance()
      createEchoInstance()
    } else {
      // token 被移除，断开连接
      destroyEchoInstance()
    }
  }

  public getToken(): string | null {
    if (typeof window === 'undefined') return null

    try {
      // 优先从 Zustand store 获取 token
      const authStorage = localStorage.getItem('auth-storage')
      if (authStorage) {
        const authData = JSON.parse(authStorage)
        return authData.state?.token || null
      }
    } catch (error) {
      console.warn('从 auth storage 获取 token 失败:', error)
    }

    return null
  }

  public setToken(token: string): void {
    if (typeof window === 'undefined') return

    // 更新 Zustand store
    try {
      const authStorage = localStorage.getItem('auth-storage')
      if (authStorage) {
        const authData = JSON.parse(authStorage)
        authData.state = { ...authData.state, token }
        localStorage.setItem('auth-storage', JSON.stringify(authData))
      }
    } catch (error) {
      console.warn('更新 auth storage 失败:', error)
    }

    // 用新 token 重新连接
    this.reconnectWithNewToken(token)
  }

  public removeToken(): void {
    if (typeof window === 'undefined') return

    // 从 Zustand store 移除 token
    try {
      const authStorage = localStorage.getItem('auth-storage')
      if (authStorage) {
        const authData = JSON.parse(authStorage)
        delete authData.state?.token
        localStorage.setItem('auth-storage', JSON.stringify(authData))
      }
    } catch (error) {
      console.warn('从 auth storage 移除 token 失败:', error)
    }

    // token 被移除时断开连接
    destroyEchoInstance()
  }

  public setRefreshCallback(callback: () => Promise<string | null>): void {
    this.refreshCallback = callback
  }

  public async refreshToken(): Promise<string | null> {
    if (!this.refreshCallback) {
      console.warn('WebSocket 认证未设置刷新回调')
      return null
    }

    try {
      const newToken = await this.refreshCallback()
      if (newToken) {
        this.setToken(newToken)
        return newToken
      }
    } catch (error) {
      console.error('WebSocket 认证 token 刷新失败:', error)
    }

    return null
  }

  public async initializeConnection(): Promise<boolean> {
    const token = this.getToken()
    console.log('WebSocket 认证: Token 检查:', token ? '已找到 Token' : '未找到 Token')

    if (!token) {
      console.warn('WebSocket 连接缺少认证 token')
      return false
    }

    try {
      console.log('WebSocket 认证: 使用 token 创建 Echo 实例')
      const instance = createEchoInstance()

      if (instance) {
        console.log('WebSocket 认证: Echo 实例创建成功')
        return true
      } else {
        console.error('WebSocket 认证: Echo 实例创建失败')
        return false
      }
    } catch (error) {
      console.error('WebSocket 认证: 创建 Echo 实例出错:', error)
      return false
    }
  }

  public destroy(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', this.handleStorageChange.bind(this))
    }
    destroyEchoInstance()
  }
}

// 单例实例
let authManager: WebSocketAuthManager | null = null

export const getAuthManager = (): WebSocketAuthManager => {
  if (!authManager) {
    authManager = new WebSocketAuthManager()
  }
  return authManager
}

export const destroyAuthManager = (): void => {
  if (authManager) {
    authManager.destroy()
    authManager = null
  }
}

export const refreshEchoAuth = async () => {
  try {
    console.log('WebSocket 认证: 正在刷新 Echo 认证')

    // 销毁当前实例
    destroyEchoInstance()

    // 用新 token 创建新实例
    try {
      console.log('WebSocket 认证: 使用刷新后的 token 重试')
      const retryInstance = createEchoInstance()

      if (retryInstance) {
        console.log('WebSocket 认证: 重试成功')
        return retryInstance
      }
    } catch (retryError) {
      console.error('WebSocket 认证: 重试失败:', retryError)
    }

    console.log('WebSocket 认证: Echo 认证刷新成功')
    return true
  } catch (error) {
    console.error('WebSocket 认证: 刷新 Echo 认证失败:', error)
    return false
  }
}
