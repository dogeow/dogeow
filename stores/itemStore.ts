import { create } from 'zustand';
import { API_BASE_URL } from '@/configs/api';

interface Item {
  id: number;
  name: string;
  description: string | null;
  quantity: number;
  status: string;
  purchase_date: string | null;
  expiry_date: string | null;
  purchase_price: number | null;
  category_id: number | null;
  spot_id: number | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  user?: {
    id: number;
    name: string;
  };
  category?: {
    id: number;
    name: string;
  };
  spot?: {
    id: number;
    name: string;
    room?: {
      id: number;
      name: string;
      area?: {
        id: number;
        name: string;
      };
    };
  };
  images?: Array<{
    id: number;
    path: string;
    thumbnail_path: string;
    is_primary: boolean;
  }>;
  primary_image?: {
    id: number;
    path: string;
    thumbnail_path: string;
  };
}

interface Category {
  id: number;
  name: string;
  user_id: number;
}

interface ItemState {
  items: Item[];
  categories: Category[];
  loading: boolean;
  error: string | null;
  
  fetchItems: (params?: Record<string, any>) => Promise<void>;
  fetchCategories: () => Promise<void>;
  getItem: (id: number) => Promise<Item | null>;
  createItem: (data: Omit<Partial<Item>, 'images'> & { images?: File[] }) => Promise<Item>;
  updateItem: (id: number, data: Omit<Partial<Item>, 'images'> & { images?: File[] }) => Promise<Item>;
  deleteItem: (id: number) => Promise<void>;
}

export const useItemStore = create<ItemState>((set, get) => ({
  items: [],
  categories: [],
  loading: false,
  error: null,
  
  fetchItems: async (params = {}) => {
    set({ loading: true, error: null });
    
    try {
      // 构建查询参数
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, String(value));
        }
      });
      
      const queryString = queryParams.toString();
      const url = `${API_BASE_URL}/items${queryString ? `?${queryString}` : ''}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`,
          'Accept': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('获取物品列表失败');
      }
      
      const data = await response.json();
      
      set({
        items: data.data || [],
        loading: false,
      });
      
      return data;
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : '未知错误',
      });
    }
  },
  
  fetchCategories: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/categories`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`,
          'Accept': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('获取分类列表失败');
      }
      
      const data = await response.json();
      set({ categories: data });
      
      return data;
    } catch (error) {
      console.error('获取分类失败:', error);
    }
  },
  
  getItem: async (id) => {
    set({ loading: true, error: null });
    
    try {
      const response = await fetch(`${API_BASE_URL}/items/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`,
          'Accept': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('获取物品详情失败');
      }
      
      const item = await response.json();
      set({ loading: false });
      
      return item;
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : '未知错误',
      });
      return null;
    }
  },
  
  createItem: async (data) => {
    set({ loading: true, error: null });
    
    try {
      // 使用FormData处理文件上传
      const formData = new FormData();
      
      // 添加基本字段
      Object.entries(data).forEach(([key, value]) => {
        if (key !== 'images' && value !== undefined && value !== null) {
          formData.append(key, String(value));
        }
      });
      
      // 添加图片
      if (data.images && Array.isArray(data.images)) {
        data.images.forEach((image, index) => {
          formData.append(`images[${index}]`, image);
        });
      }
      
      const response = await fetch(`${API_BASE_URL}/items`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`,
          'Accept': 'application/json',
        },
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '创建物品失败');
      }
      
      const result = await response.json();
      set({ loading: false });
      
      // 刷新物品列表
      get().fetchItems();
      
      return result.item;
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : '未知错误',
      });
      throw error;
    }
  },
  
  updateItem: async (id, data) => {
    set({ loading: true, error: null });
    
    try {
      // 使用FormData处理文件上传
      const formData = new FormData();
      formData.append('_method', 'PUT'); // Laravel需要这个来模拟PUT请求
      
      // 添加基本字段
      Object.entries(data).forEach(([key, value]) => {
        if (key !== 'images' && value !== undefined && value !== null) {
          formData.append(key, String(value));
        }
      });
      
      // 添加图片
      if (data.images && Array.isArray(data.images)) {
        data.images.forEach((image, index) => {
          formData.append(`images[${index}]`, image);
        });
      }
      
      const response = await fetch(`${API_BASE_URL}/items/${id}`, {
        method: 'POST', // 使用POST方法，但添加_method=PUT
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`,
          'Accept': 'application/json',
        },
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '更新物品失败');
      }
      
      const result = await response.json();
      set({ loading: false });
      
      // 刷新物品列表
      get().fetchItems();
      
      return result.item;
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : '未知错误',
      });
      throw error;
    }
  },
  
  deleteItem: async (id) => {
    set({ loading: true, error: null });
    
    try {
      const response = await fetch(`${API_BASE_URL}/items/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`,
          'Accept': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('删除物品失败');
      }
      
      set({ loading: false });
      
      // 从列表中移除已删除的物品
      const currentItems = get().items;
      set({ items: currentItems.filter(item => item.id !== id) });
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : '未知错误',
      });
      throw error;
    }
  },
})); 