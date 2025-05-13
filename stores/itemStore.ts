import { create } from 'zustand';
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
  tags?: Tag[];
}

interface Category {
  id: number;
  name: string;
  user_id: number;
  items_count?: number;
}

interface Tag {
  id: number;
  name: string;
  color: string;
  user_id: number;
}

interface ItemState {
  items: Item[];
  categories: Category[];
  tags: Tag[];
  loading: boolean;
  error: string | null;
  meta: any | null;
  
  fetchItems: (params?: Record<string, any>) => Promise<any>;
  fetchCategories: () => Promise<Category[] | undefined>;
  fetchTags: () => Promise<Tag[] | undefined>;
  getItem: (id: number) => Promise<Item | null>;
  createItem: (data: Omit<Partial<Item>, 'images'> & { 
    images?: File[],
    image_paths?: string[],
    tags?: number[]
  }) => Promise<Item>;
  updateItem: (id: number, data: Omit<Partial<Item>, 'images'> & { 
    images?: File[], 
    image_ids?: number[],
    image_paths?: string[],
    tags?: number[]
  }) => Promise<Item>;
  deleteItem: (id: number) => Promise<void>;
}

export const useItemStore = create<ItemState>((set, get) => ({
  items: [],
  categories: [],
  tags: [],
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
      
      const url = `/items${queryString ? `?${queryString}` : ''}`;

      
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
  
  fetchTags: async () => {
    try {
      const data = await apiRequest<Tag[]>(`/thing-tags`);
      set({ tags: data });
      
      return data;
    } catch (error) {
      console.error('获取标签失败:', error);
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
        if (key !== 'images' && key !== 'image_paths' && key !== 'tags' && value !== undefined && value !== null) {
          
          // 特殊处理is_public字段，确保它是布尔值
          if (key === 'is_public') {
            // 将布尔值转换为"1"或"0"，这样在PHP端会被正确解析为布尔值
            formData.append(key, value === true ? "1" : "0");
          } else {
            formData.append(key, String(value));
          }
        }
      });
      
      // 添加图片（直接上传方式）
      if (data.images && Array.isArray(data.images)) {
        data.images.forEach((image, index) => {
          formData.append(`images[${index}]`, image);
        });
      }
      
      // 添加图片路径（预上传方式）
      if (data.image_paths && Array.isArray(data.image_paths)) {
        data.image_paths.forEach((path, index) => {
          formData.append(`image_paths[${index}]`, path);
        });
      }
      
      // 添加标签
      if (data.tags && Array.isArray(data.tags)) {
        data.tags.forEach((tagId, index) => {
          formData.append(`tags[${index}]`, String(tagId));
        });
      }
      
      // 检查当前的授权token
      const authToken = useAuthStore.getState().token;
      
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
  
  updateItem: async (id, data) => {
    set({ loading: true, error: null });
    
    try {
      // 使用FormData处理文件上传
      const formData = new FormData();
      
      // 由于使用FormData，需要手动添加_method字段模拟PUT请求
      formData.append('_method', 'PUT');
      
      // 添加基本字段
      Object.entries(data).forEach(([key, value]) => {
        if (key !== 'images' && key !== 'image_paths' && key !== 'image_ids' && key !== 'tags' && value !== undefined && value !== null) {
          // 特殊处理is_public字段，确保它是布尔值
          if (key === 'is_public') {
            // 将布尔值转换为"1"或"0"
            formData.append(key, value === true ? "1" : "0");
          } else {
            formData.append(key, String(value));
          }
        }
      });
      
      // 添加图片（直接上传方式）
      if (data.images && Array.isArray(data.images)) {
        data.images.forEach((image, index) => {
          formData.append(`images[${index}]`, image);
        });
      }
      
      // 添加图片路径（预上传方式）
      if (data.image_paths && Array.isArray(data.image_paths)) {
        data.image_paths.forEach((path, index) => {
          formData.append(`image_paths[${index}]`, path);
        });
      }
      
      // 添加其他需要的字段
      if (data.image_ids && Array.isArray(data.image_ids)) {
        data.image_ids.forEach((id, index) => {
          formData.append(`image_ids[${index}]`, String(id));
        });
      }
      
      // 添加标签
      if (data.tags && Array.isArray(data.tags)) {
        data.tags.forEach((tagId, index) => {
          formData.append(`tags[${index}]`, String(tagId));
        });
      }
      
      // 使用apiRequest发送请求，它会自动携带认证令牌
      const result = await apiRequest<{item: Item}>(`/items/${id}`, 'POST', formData);
      
      set({ loading: false });
      
      // 刷新物品列表
      get().fetchItems();
      
      return result.item;
    } catch (error) {
      console.error('更新物品错误:', error);
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