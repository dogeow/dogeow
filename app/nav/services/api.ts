import { NavCategory, NavItem } from '@/types/nav';
import { apiRequest, post, put, del } from '@/utils/api';
import { API_BASE_URL } from '@/configs/api';

const BASE_URL = API_BASE_URL;

// 获取所有导航分类（及其导航项）
export async function getCategories() {
  return await apiRequest<NavCategory[]>(`${BASE_URL}/nav/categories`);
}

// 获取所有导航项
export async function getItems(categoryId?: number) {
  let url = `${BASE_URL}/nav/items`;
  if (categoryId) {
    url += `?category_id=${categoryId}`;
  }
  return await apiRequest<NavItem[]>(url);
}

// 记录点击
export async function recordClick(itemId: number) {
  return await post<any>(`${BASE_URL}/nav/items/${itemId}/click`, {});
}

// 管理员接口
export async function getAllCategories() {
  return await apiRequest<NavCategory[]>(`${BASE_URL}/nav/admin/categories`);
}

export async function createCategory(category: Partial<NavCategory>) {
  return await post<NavCategory>(`${BASE_URL}/nav/categories`, category);
}

export async function updateCategory(id: number, category: Partial<NavCategory>) {
  return await put<NavCategory>(`${BASE_URL}/nav/categories/${id}`, category);
}

export async function deleteCategory(id: number) {
  return await del<any>(`${BASE_URL}/nav/categories/${id}`);
}

export async function createItem(item: Partial<NavItem>) {
  return await post<NavItem>(`${BASE_URL}/nav/items`, item);
}

export async function updateItem(id: number, item: Partial<NavItem>) {
  return await put<NavItem>(`${BASE_URL}/nav/items/${id}`, item);
}

export async function deleteItem(id: number) {
  return await del<any>(`${BASE_URL}/nav/items/${id}`);
}