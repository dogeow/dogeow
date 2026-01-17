/**
 * 用户工具函数
 */
import type { OnlineUser } from '@/app/chat/types'

export type UserRole = 'admin' | 'moderator' | 'user'

/**
 * 判断用户是否为管理员
 */
export const isAdmin = (user: OnlineUser): boolean => {
  return user.email.includes('admin')
}

/**
 * 判断用户是否为版主
 */
export const isModerator = (user: OnlineUser): boolean => {
  return user.email.includes('admin') || user.email.includes('mod')
}

/**
 * 获取用户角色
 */
export const getUserRole = (user: OnlineUser): UserRole => {
  if (isAdmin(user)) return 'admin'
  if (isModerator(user)) return 'moderator'
  return 'user'
}

/**
 * 格式化加入时间
 */
export const formatJoinedDate = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

  if (diffInMinutes < 1) return 'Just now'
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
  return date.toLocaleDateString()
}

/**
 * 获取用户名首字母
 */
export const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}
