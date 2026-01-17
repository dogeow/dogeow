import type { OnlineUser } from '../../types'
import { userRoleUtils } from './userUtils'

export type SortOption = 'name' | 'joined' | 'status'
export type FilterOption = 'all' | 'online' | 'moderators'

/**
 * 搜索过滤用户
 */
export const filterUsers = (users: OnlineUser[], query: string): OnlineUser[] => {
  if (!query.trim()) return users

  const normalizedQuery = query.toLowerCase()
  return users.filter(
    user =>
      user.name.toLowerCase().includes(normalizedQuery) ||
      user.email.toLowerCase().includes(normalizedQuery)
  )
}

/**
 * 按状态过滤用户
 */
export const filterByStatus = (users: OnlineUser[], filter: FilterOption): OnlineUser[] => {
  switch (filter) {
    case 'online':
      return users.filter(user => user.is_online)
    case 'moderators':
      return users.filter(user => userRoleUtils.isModerator(user))
    default:
      return users
  }
}

/**
 * 排序用户
 */
export const sortUsers = (users: OnlineUser[], sortOption: SortOption): OnlineUser[] => {
  return [...users].sort((a, b) => {
    switch (sortOption) {
      case 'name':
        return a.name.localeCompare(b.name)
      case 'joined':
        return new Date(b.joined_at).getTime() - new Date(a.joined_at).getTime()
      case 'status':
        // 在线用户优先，然后按名字排序
        if (a.is_online === b.is_online) {
          return a.name.localeCompare(b.name)
        }
        return a.is_online ? -1 : 1
      default:
        return 0
    }
  })
}
