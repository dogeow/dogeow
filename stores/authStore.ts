import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { User, AuthResponse } from '../app'
import { post } from '@/lib/api'

// 常量定义
const AUTH_TOKEN_KEY = 'auth-token'
const STORAGE_KEY = 'auth-storage'

interface AuthState {
  readonly user: User | null
  readonly token: string | null
  readonly loading: boolean
  readonly isAuthenticated: boolean

  // 操作方法
  setLoading: (loading: boolean) => void
  login: (email: string, password: string) => Promise<AuthResponse>
  logout: () => Promise<void>
  setUser: (user: User | null) => void
  setToken: (token: string | null) => Promise<void>
  getToken: () => string | null
}

// WebSocket 认证管理器同步
const syncWithWebSocketAuth = async (token: string | null): Promise<void> => {
  if (typeof window === 'undefined') return

  try {
    const { getAuthManager } = await import('@/lib/websocket/auth')
    const authManager = getAuthManager()

    if (token) {
      authManager.setToken(token)
    } else {
      authManager.removeToken()
    }
  } catch (error) {
    console.warn('与WebSocket认证管理器同步失败:', error)
  }
}

// 创建持久化的认证存储
const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      loading: true, // 初始化时设置为true，等待从localStorage恢复状态
      isAuthenticated: false,

      setLoading: loading => set({ loading }),

      setUser: user => set({ user, isAuthenticated: !!user }),

      setToken: async (token: string | null) => {
        set({ token, isAuthenticated: !!token })
        await syncWithWebSocketAuth(token)
      },

      getToken: () => get().token,

      login: async (email: string, password: string) => {
        set({ loading: true })

        try {
          const data = await post<AuthResponse>('/login', { email, password })

          // 更新状态
          set({
            user: data.user,
            token: data.token,
            loading: false,
            isAuthenticated: true,
          })

          // 备份到 localStorage
          if (typeof window !== 'undefined') {
            localStorage.setItem(AUTH_TOKEN_KEY, data.token)
          }

          // 同步到 WebSocket
          await syncWithWebSocketAuth(data.token)

          return data
        } catch (error) {
          set({ loading: false })
          throw error
        }
      },

      logout: async () => {
        // 清除状态
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        })

        // 清除 localStorage
        if (typeof window !== 'undefined') {
          localStorage.removeItem(AUTH_TOKEN_KEY)
        }

        // 同步到 WebSocket
        await syncWithWebSocketAuth(null)
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: state => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => state => {
        if (state) {
          state.loading = false
        }
      },
    }
  )
)

// 初始化认证状态
const initializeAuth = async (): Promise<void> => {
  if (typeof window === 'undefined') return

  const { setToken, setLoading } = useAuthStore.getState()

  try {
    const token = localStorage.getItem(AUTH_TOKEN_KEY)
    if (token) {
      await setToken(token)
    }
  } catch (error) {
    console.warn('初始化认证状态失败:', error)
  } finally {
    setLoading(false)
  }
}

// 延迟初始化避免阻塞
if (typeof window !== 'undefined') {
  setTimeout(initializeAuth, 0)
}

export default useAuthStore
