import type { NavCategory, NavItem } from '@/app/nav/types'

/**
 * 生成示例分类数据
 */
export function getSampleCategories(): NavCategory[] {
  const now = new Date().toISOString()
  return [
    {
      id: 1,
      name: '常用',
      icon: null,
      description: '常用站点快捷入口',
      sort_order: 1,
      is_visible: true,
      created_at: now,
      updated_at: now,
      deleted_at: null,
    },
    {
      id: 2,
      name: '开发',
      icon: null,
      description: '开发相关资源',
      sort_order: 2,
      is_visible: true,
      created_at: now,
      updated_at: now,
      deleted_at: null,
    },
    {
      id: 3,
      name: '学习',
      icon: null,
      description: '学习与阅读',
      sort_order: 3,
      is_visible: true,
      created_at: now,
      updated_at: now,
      deleted_at: null,
    },
  ]
}

/**
 * 生成示例导航项数据
 */
export function getSampleItems(): NavItem[] {
  const now = new Date().toISOString()
  return [
    {
      id: 101,
      nav_category_id: 1,
      name: 'Google',
      url: 'https://www.google.com',
      icon: null,
      description: '搜索引擎',
      sort_order: 1,
      is_visible: true,
      is_new_window: true,
      clicks: 0,
      created_at: now,
      updated_at: now,
      deleted_at: null,
    },
    {
      id: 102,
      nav_category_id: 1,
      name: 'GitHub',
      url: 'https://github.com',
      icon: null,
      description: '代码托管与协作',
      sort_order: 2,
      is_visible: true,
      is_new_window: true,
      clicks: 0,
      created_at: now,
      updated_at: now,
      deleted_at: null,
    },
    {
      id: 103,
      nav_category_id: 1,
      name: 'Notion',
      url: 'https://www.notion.so',
      icon: null,
      description: '笔记与知识库',
      sort_order: 3,
      is_visible: true,
      is_new_window: true,
      clicks: 0,
      created_at: now,
      updated_at: now,
      deleted_at: null,
    },
    {
      id: 201,
      nav_category_id: 2,
      name: 'MDN',
      url: 'https://developer.mozilla.org',
      icon: null,
      description: 'Web 文档',
      sort_order: 1,
      is_visible: true,
      is_new_window: true,
      clicks: 0,
      created_at: now,
      updated_at: now,
      deleted_at: null,
    },
    {
      id: 202,
      nav_category_id: 2,
      name: 'Stack Overflow',
      url: 'https://stackoverflow.com',
      icon: null,
      description: '技术问答社区',
      sort_order: 2,
      is_visible: true,
      is_new_window: true,
      clicks: 0,
      created_at: now,
      updated_at: now,
      deleted_at: null,
    },
    {
      id: 203,
      nav_category_id: 2,
      name: 'Vercel',
      url: 'https://vercel.com',
      icon: null,
      description: '前端部署平台',
      sort_order: 3,
      is_visible: true,
      is_new_window: true,
      clicks: 0,
      created_at: now,
      updated_at: now,
      deleted_at: null,
    },
    {
      id: 301,
      nav_category_id: 3,
      name: '掘金',
      url: 'https://juejin.cn',
      icon: null,
      description: '中文技术社区',
      sort_order: 1,
      is_visible: true,
      is_new_window: true,
      clicks: 0,
      created_at: now,
      updated_at: now,
      deleted_at: null,
    },
    {
      id: 302,
      nav_category_id: 3,
      name: '阮一峰的网络日志',
      url: 'https://www.ruanyifeng.com/blog/',
      icon: null,
      description: '技术文章与随笔',
      sort_order: 2,
      is_visible: true,
      is_new_window: true,
      clicks: 0,
      created_at: now,
      updated_at: now,
      deleted_at: null,
    },
    {
      id: 303,
      nav_category_id: 3,
      name: '语雀',
      url: 'https://www.yuque.com',
      icon: null,
      description: '团队知识库',
      sort_order: 3,
      is_visible: true,
      is_new_window: true,
      clicks: 0,
      created_at: now,
      updated_at: now,
      deleted_at: null,
    },
  ]
}

/**
 * 将分类和导航项组合，生成带导航项的分类数据
 */
export function combineCategoriesWithItems(
  categories: NavCategory[],
  items: NavItem[]
): NavCategory[] {
  return categories.map(category => {
    const categoryItems = items.filter(item => item.nav_category_id === category.id)
    return {
      ...category,
      items: categoryItems,
      items_count: categoryItems.length,
    }
  })
}
