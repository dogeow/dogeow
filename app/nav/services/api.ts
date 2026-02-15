import { NavCategory, NavItem } from '@/app/nav/types'
import { apiRequest, post, put, del } from '@/lib/api'

// 获取所有导航分类（及其导航项）
export async function getCategories(filterName?: string) {
  try {
    let url = `/nav/categories`
    if (filterName) {
      url += `?filter[name]=${encodeURIComponent(filterName)}`
    }
    const result = await apiRequest<NavCategory[]>(url)
    return Array.isArray(result) ? result : []
  } catch (error) {
    console.error('获取分类API错误:', error)
    return []
  }
}

// 获取所有导航项
export async function getItems(categoryId?: number) {
  let url = `/nav/items`
  if (categoryId) {
    url += `?category_id=${categoryId}`
  }
  return await apiRequest<NavItem[]>(url)
}

// 记录点击
export async function recordClick(itemId: number) {
  return await post<{ success: boolean }>(`/nav/items/${itemId}/click`, {})
}

// 管理员接口
export async function getAllCategories() {
  try {
    const result = await apiRequest<NavCategory[]>(`/nav/categories?show_all=1`)
    return Array.isArray(result) ? result : []
  } catch (error) {
    console.error('获取所有分类API错误:', error)
    return []
  }
}

export async function createCategory(category: Partial<NavCategory>) {
  const result = await post<{ message: string; category: NavCategory }>(`/nav/categories`, category)
  return result.category
}

export async function updateCategory(id: number, category: Partial<NavCategory>) {
  const result = await put<{ message: string; category: NavCategory }>(
    `/nav/categories/${id}`,
    category
  )
  return result.category
}

export async function deleteCategory(id: number) {
  return await del<{ success: boolean }>(`/nav/categories/${id}`)
}

export async function createItem(item: Partial<NavItem>) {
  return await post<NavItem>(`/nav/items`, item)
}

export async function updateItem(id: number, item: Partial<NavItem>) {
  return await put<NavItem>(`/nav/items/${id}`, item)
}

export async function deleteItem(id: number) {
  return await del<{ success: boolean }>(`/nav/items/${id}`)
}
