import type { Category } from '../../types'

// 扩展的分类类型，包含子分类
export interface CategoryWithChildren extends Category {
  children?: Category[]
}

// 将扁平的分类数据转换为树形结构
export function buildCategoryTree(categories: Category[]): CategoryWithChildren[] {
  const parentCategories: CategoryWithChildren[] = []
  const childCategories: Category[] = []

  // 分离父分类和子分类
  categories.forEach(category => {
    if (category.parent_id) {
      childCategories.push(category)
    } else {
      parentCategories.push({
        ...category,
        children: [],
      })
    }
  })

  // 将子分类添加到对应的父分类下
  childCategories.forEach(child => {
    const parent = parentCategories.find(p => p.id === child.parent_id)
    if (parent) {
      parent.children!.push(child)
    }
  })

  return parentCategories
}
