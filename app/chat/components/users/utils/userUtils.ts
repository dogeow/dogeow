import type { OnlineUser } from '../../types'

export type UserRole = 'admin' | 'moderator' | 'user'

/**
 * 用户角色判断工具函数
 * 提供判断用户是否为管理员、版主的方法
 */
export const userRoleUtils = {
  isAdmin: (user: OnlineUser): boolean => {
    return user.email.includes('admin')
  },

  isModerator: (user: OnlineUser): boolean => {
    return user.email.includes('admin') || user.email.includes('mod')
  },

  getUserRole: (user: OnlineUser): UserRole => {
    if (userRoleUtils.isAdmin(user)) return 'admin'
    if (userRoleUtils.isModerator(user)) return 'moderator'
    return 'user'
  },
}

/**
 * 时间格式化工具函数
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
