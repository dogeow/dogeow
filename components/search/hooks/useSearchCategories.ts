import { useMemo } from 'react'

export interface Category {
  id: string
  name: string
  path: string
  icon?: React.ReactNode
  requireAuth?: boolean // 是否需要认证
}

export function useSearchCategories(isAuthenticated: boolean): Category[] {
  return useMemo(() => {
    const allCategories: Category[] = [
      { id: 'all', name: '全部', path: '/search' },
      { id: 'thing', name: '物品', path: '/thing', requireAuth: false }, // 物品有公开的，不需要认证
      { id: 'lab', name: '实验室', path: '/lab', requireAuth: false },
      { id: 'note', name: '笔记', path: '/note', requireAuth: true }, // 笔记需要认证
      { id: 'file', name: '文件', path: '/file', requireAuth: true }, // 文件需要认证
      { id: 'game', name: '游戏', path: '/game', requireAuth: false }, // 游戏不需要认证
      { id: 'tool', name: '工具', path: '/tool', requireAuth: false },
      { id: 'nav', name: '导航', path: '/nav', requireAuth: true }, // 导航需要认证
    ]

    // 如果用户未认证，过滤掉需要认证的类别
    if (!isAuthenticated) {
      return allCategories.filter(category => !category.requireAuth)
    }

    return allCategories
  }, [isAuthenticated])
}
