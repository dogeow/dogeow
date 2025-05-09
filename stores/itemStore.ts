import { create } from 'zustand';
import { API_BASE_URL } from '@/utils/api';
import { format } from 'date-fns';
import { apiRequest, get, post, put, del } from '@/utils/api';
import useAuthStore from '@/stores/authStore';

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
  area_id: number | null;
  room_id: number | null;
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
  meta: any | null;
  
  fetchItems: (params?: Record<string, any>) => Promise<any>;
  fetchCategories: () => Promise<Category[] | undefined>;
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
  meta: null,
  
  fetchItems: async (params = {}) => {
    set({ loading: true, error: null });
    
    try {
      // 构建查询参数
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        // 过滤 undefined、null 和空字符串
        if (value !== undefined && value !== null && value !== '') {
          // 处理日期对象
          if (value instanceof Date) {
            queryParams.append(key, format(value, 'yyyy-MM-dd'));
          } else {
            queryParams.append(key, String(value));
          }
        }
      });
      
      const queryString = queryParams.toString();
      console.log('查询字符串:', queryString); // 添加日志
      
      const url = `/items${queryString ? `?${queryString}` : ''}`;
      
      console.log('筛选请求URL:', API_BASE_URL + url);
      
      const data = await apiRequest<{data: Item[], meta: any}>(url);
      
      set({
        items: data.data || [],
        loading: false,
        meta: data.meta || null,
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
      const data = await apiRequest<Category[]>(`/categories`);
      set({ categories: data });
      
      return data;
    } catch (error) {
      console.error('获取分类失败:', error);
      return undefined;
    }
  },
  
  getItem: async (id) => {
    set({ loading: true, error: null });
    
    try {
      const item = await apiRequest<Item>(`/items/${id}`);
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
          console.log(`创建物品 - 字段 ${key}:`, value, typeof value);
          
          // 特殊处理is_public字段，确保它是布尔值
          if (key === 'is_public') {
            // 将布尔值转换为"1"或"0"，这样在PHP端会被正确解析为布尔值
            formData.append(key, value === true ? "1" : "0");
          } else {
            formData.append(key, String(value));
          }
        }
      });
      
      // 添加图片
      if (data.images && Array.isArray(data.images)) {
        data.images.forEach((image, index) => {
          formData.append(`images[${index}]`, image);
        });
      }
      
      // 检查当前的授权token
      const authToken = useAuthStore.getState().token;
      console.log('创建物品 - 授权Token状态:', authToken ? '已设置' : '未设置');
      
      // 使用apiRequest发送请求，它会自动携带认证令牌
      const result = await apiRequest<{item: Item}>(`/items`, 'POST', formData);
      
      set({ loading: false });
      
      // 刷新物品列表
      get().fetchItems();
      
      return result.item;
    } catch (error) {
      console.error('创建物品异常:', error);
      set({
        loading: false,
        error: error instanceof Error ? error.message : '未知错误',
      });
      throw error;
    }
  },
  
  updateItem: async (id: number, data: Omit<Partial<Item>, 'images'> & { images?: File[] }) => {
    set({ loading: true, error: null });
    
    try {
      // 使用FormData处理文件上传
      const formData = new FormData();
      formData.append('_method', 'PUT'); // Laravel需要这个来模拟PUT请求
      
      // 添加基本字段
      Object.entries(data).forEach(([key, value]) => {
        if (key !== 'images' && value !== undefined && value !== null) {
          // 特殊处理is_public字段，确保它是布尔值
          if (key === 'is_public') {
            formData.append(key, value === true ? "1" : "0");
          } else {
            formData.append(key, String(value));
          }
        }
      });
      
      // 添加图片
      if (data.images && Array.isArray(data.images)) {
        data.images.forEach((image, index) => {
          formData.append(`images[${index}]`, image);
        });
      }
      
      // 使用apiRequest发送请求，它会自动携带认证令牌
      const result = await apiRequest<{item: Item}>(`/items/${id}`, 'POST', formData);
      
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
  
  deleteItem: async (id: number) => {
    set({ loading: true, error: null });
    
    try {
      await del(`/items/${id}`);
      
      // 从状态中移除已删除的项目
      set(state => ({
        items: state.items.filter(item => item.id !== id),
        loading: false
      }));
      
      // 刷新物品列表
      get().fetchItems();
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : '未知错误',
      });
      throw error;
    }
  }
})); 