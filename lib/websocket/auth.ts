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
    // Listen for storage changes to sync tokens across tabs
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
          // Token changed in another tab, reconnect with new token
          this.reconnectWithNewToken(token)
        }
      } catch (error) {
        console.warn('Failed to parse auth storage data:', error)
      }
    }
  }

  private reconnectWithNewToken(token: string | null) {
    if (token) {
      // Destroy current connection and create new one with updated token
      destroyEchoInstance()
      createEchoInstance()
    } else {
      // Token removed, disconnect
      destroyEchoInstance()
    }
  }

  public getToken(): string | null {
    if (typeof window === 'undefined') return null

    try {
      // Try to get token from Zustand store first
      const authStorage = localStorage.getItem('auth-storage')
      if (authStorage) {
        const authData = JSON.parse(authStorage)
        return authData.state?.token || null
      }
    } catch (error) {
      console.warn('Failed to get token from auth storage:', error)
    }

    return null
  }

  public setToken(token: string): void {
    if (typeof window === 'undefined') return

    // Update Zustand store
    try {
      const authStorage = localStorage.getItem('auth-storage')
      if (authStorage) {
        const authData = JSON.parse(authStorage)
        authData.state = { ...authData.state, token }
        localStorage.setItem('auth-storage', JSON.stringify(authData))
      }
    } catch (error) {
      console.warn('Failed to update auth storage:', error)
    }

    // Reconnect with new token
    this.reconnectWithNewToken(token)
  }

  public removeToken(): void {
    if (typeof window === 'undefined') return

    // Remove token from Zustand store
    try {
      const authStorage = localStorage.getItem('auth-storage')
      if (authStorage) {
        const authData = JSON.parse(authStorage)
        delete authData.state?.token
        localStorage.setItem('auth-storage', JSON.stringify(authData))
      }
    } catch (error) {
      console.warn('Failed to remove token from auth storage:', error)
    }

    // Disconnect when token is removed
    destroyEchoInstance()
  }

  public setRefreshCallback(callback: () => Promise<string | null>): void {
    this.refreshCallback = callback
  }

  public async refreshToken(): Promise<string | null> {
    if (!this.refreshCallback) {
      console.warn('No refresh callback set for WebSocket auth')
      return null
    }

    try {
      const newToken = await this.refreshCallback()
      if (newToken) {
        this.setToken(newToken)
        return newToken
      }
    } catch (error) {
      console.error('Failed to refresh WebSocket auth token:', error)
    }

    return null
  }

  public async initializeConnection(): Promise<boolean> {
    const token = this.getToken()
    console.log('WebSocket Auth: Token check:', token ? 'Token found' : 'No token')

    if (!token) {
      console.warn('No auth token available for WebSocket connection')
      return false
    }

    try {
      console.log('WebSocket Auth: Creating Echo instance with token')
      const instance = createEchoInstance()

      if (instance) {
        console.log('WebSocket Auth: Echo instance created successfully')
        return true
      } else {
        console.error('WebSocket Auth: Failed to create Echo instance')
        return false
      }
    } catch (error) {
      console.error('WebSocket Auth: Error creating Echo instance:', error)
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

// Singleton instance
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
    console.log('WebSocket Auth: Refreshing Echo authentication')

    // Destroy current instance
    destroyEchoInstance()

    // Create new instance with updated token
    try {
      console.log('WebSocket Auth: Retrying with refreshed token')
      const retryInstance = createEchoInstance()

      if (retryInstance) {
        console.log('WebSocket Auth: Retry successful')
        return retryInstance
      }
    } catch (retryError) {
      console.error('WebSocket Auth: Retry failed:', retryError)
    }

    console.log('WebSocket Auth: Echo authentication refreshed successfully')
    return true
  } catch (error) {
    console.error('WebSocket Auth: Failed to refresh Echo authentication:', error)
    return false
  }
}
