import type { NavCategory } from '@/app/nav/types'

/**
 * 更新分类列表中的分类
 */
export function updateCategoryInList(
  categories: NavCategory[],
  id: number,
  updatedCategory: NavCategory
): NavCategory[] {
  return categories.map(c => (c.id === id ? updatedCategory : c))
}

/**
 * 从分类列表中删除分类
 */
export function removeCategoryFromList(categories: NavCategory[], id: number): NavCategory[] {
  return categories.filter(c => c.id !== id)
}

/**
 * 添加分类到列表
 */
export function addCategoryToList(
  categories: NavCategory[],
  newCategory: NavCategory
): NavCategory[] {
  return [...categories, newCategory]
}
