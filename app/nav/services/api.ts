import { NavCategory, NavItem } from '@/types/nav';
import { API_BASE_URL } from '@/configs/api';

const BASE_URL = API_BASE_URL;

// 获取所有导航分类（及其导航项）
export async function getCategories() {
  const response = await fetch(`${BASE_URL}/nav/categories`);
  const data = await response.json();
  return data as NavCategory[];
}

// 获取所有导航项
export async function getItems(categoryId?: number) {
  let url = `${BASE_URL}/nav/items`;
  if (categoryId) {
    url += `?category_id=${categoryId}`;
  }
  const response = await fetch(url);
  const data = await response.json();
  return data as NavItem[];
}

// 记录点击
export async function recordClick(itemId: number) {
  const response = await fetch(`${BASE_URL}/nav/items/${itemId}/click`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return await response.json();
}

// 管理员接口
export async function getAllCategories() {
  const response = await fetch(`${BASE_URL}/nav/admin/categories`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
  });
  const data = await response.json();
  return data as NavCategory[];
}

export async function createCategory(category: Partial<NavCategory>) {
  const response = await fetch(`${BASE_URL}/nav/categories`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
    body: JSON.stringify(category),
  });
  return await response.json();
}

export async function updateCategory(id: number, category: Partial<NavCategory>) {
  const response = await fetch(`${BASE_URL}/nav/categories/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
    body: JSON.stringify(category),
  });
  return await response.json();
}

export async function deleteCategory(id: number) {
  const response = await fetch(`${BASE_URL}/nav/categories/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
  });
  return await response.json();
}

export async function createItem(item: Partial<NavItem>) {
  const response = await fetch(`${BASE_URL}/nav/items`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
    body: JSON.stringify(item),
  });
  return await response.json();
}

export async function updateItem(id: number, item: Partial<NavItem>) {
  const response = await fetch(`${BASE_URL}/nav/items/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
    body: JSON.stringify(item),
  });
  return await response.json();
}

export async function deleteItem(id: number) {
  const response = await fetch(`${BASE_URL}/nav/items/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
  });
  return await response.json();
}