import { NavCategory, NavItem } from '@/app/nav/types';
import { apiRequest, post, put, del } from '@/utils/api';

// 获取所有导航分类（及其导航项）
export async function getCategories() {
  return await apiRequest<NavCategory[]>(`/nav/categories`);
}

// 获取所有导航项
export async function getItems(categoryId?: number) {
  let url = `/nav/items`;
  if (categoryId) {
    url += `?category_id=${categoryId}`;
  }
  return await apiRequest<NavItem[]>(url);
}

// 记录点击
export async function recordClick(itemId: number) {
  return await post<any>(`/nav/items/${itemId}/click`, {});
}

// 管理员接口
export async function getAllCategories() {
  return await apiRequest<NavCategory[]>(`/nav/admin/categories`);
}

export async function createCategory(category: Partial<NavCategory>) {
  return await post<NavCategory>(`/nav/categories`, category);
}

export async function updateCategory(id: number, category: Partial<NavCategory>) {
  return await put<NavCategory>(`/nav/categories/${id}`, category);
}

export async function deleteCategory(id: number) {
  return await del<any>(`/nav/categories/${id}`);
}

export async function createItem(item: Partial<NavItem>) {
  return await post<NavItem>(`/nav/items`, item);
}

export async function updateItem(id: number, item: Partial<NavItem>) {
  return await put<NavItem>(`/nav/items/${id}`, item);
}

export async function deleteItem(id: number) {
  return await del<any>(`/nav/items/${id}`);
}