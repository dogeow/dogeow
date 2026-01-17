import type { NavCategory, NavItem } from '@/app/nav/types'

/**
 * 更新导航项列表中的导航项
 */
export function updateItemInList(items: NavItem[], id: number, updatedItem: NavItem): NavItem[] {
  return items.map(i => (i.id === id ? updatedItem : i))
}

/**
 * 从导航项列表中删除导航项
 */
export function removeItemFromList(items: NavItem[], id: number): NavItem[] {
  return items.filter(i => i.id !== id)
}

/**
 * 添加导航项到列表
 */
export function addItemToList(items: NavItem[], newItem: NavItem): NavItem[] {
  return [...items, newItem]
}

/**
 * 更新分类中的导航项
 */
export function updateItemInCategories(
  categories: NavCategory[],
  itemId: number,
  updatedItem: NavItem
): NavCategory[] {
  return categories.map(category => {
    if (category.items) {
      return {
        ...category,
        items: category.items.map(i => (i.id === itemId ? updatedItem : i)),
      }
    }
    return category
  })
}

/**
 * 从分类中删除导航项
 */
export function removeItemFromCategories(
  categories: NavCategory[],
  itemId: number,
  categoryId: number
): NavCategory[] {
  return categories.map(category => {
    if (category.id === categoryId) {
      return {
        ...category,
        items: (category.items || []).filter(i => i.id !== itemId),
        items_count: Math.max(0, (category.items_count || 0) - 1),
      }
    }
    return category
  })
}

/**
 * 添加导航项到分类
 */
export function addItemToCategory(categories: NavCategory[], newItem: NavItem): NavCategory[] {
  return categories.map(category => {
    if (category.id === newItem.nav_category_id) {
      return {
        ...category,
        items: [...(category.items || []), newItem],
        items_count: (category.items_count || 0) + 1,
      }
    }
    return category
  })
}

/**
 * 更新导航项的点击数
 */
export function incrementItemClicks(categories: NavCategory[], itemId: number): NavCategory[] {
  return categories.map(category => {
    if (category.items) {
      return {
        ...category,
        items: category.items.map(item => {
          if (item.id === itemId) {
            return { ...item, clicks: (item.clicks || 0) + 1 }
          }
          return item
        }),
      }
    }
    return category
  })
}
