'use client'

/**
 * useAuth Hook
 * 提供认证相关的状态和方法
 * 这是 useAuthStore 的包装器，提供更简洁的 API
 */
import useAuthStore from '@/stores/authStore'

export function useAuth() {
  const { user, token, isAuthenticated, loading } = useAuthStore()

  return {
    user,
    token,
    isAuthenticated,
    loading,
  }
}
