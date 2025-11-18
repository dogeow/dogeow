'use client'

import useAuthStore from '@/stores/authStore'
import { fetchCurrentUser } from './api'

/**
 * 检查当前用户是否为管理员
 */
export const isAdmin = async (): Promise<boolean> => {
  const user = useAuthStore.getState().user

  if (!user) {
    return false
  }

  // 如果用户对象已经有 is_admin 字段，直接返回
  if (typeof user.is_admin === 'boolean') {
    return user.is_admin
  }

  // 否则从 API 获取最新用户信息
  try {
    const currentUser = await fetchCurrentUser()
    // 更新 store 中的用户信息
    useAuthStore.getState().setUser(currentUser)
    return currentUser.is_admin ?? false
  } catch {
    return false
  }
}

/**
 * 同步检查（使用 store 中的用户信息，不发起 API 请求）
 */
export const isAdminSync = (): boolean => {
  const user = useAuthStore.getState().user
  return user?.is_admin ?? false
}

/**
 * 获取认证 token
 */
export const getAuthToken = (): string | null => {
  return useAuthStore.getState().token
}
