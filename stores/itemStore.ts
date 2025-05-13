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
  filters: Record<string, any>;
  
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
  saveFilters: (filters: Record<string, any>) => void;
}

export const useItemStore = create<ItemState>((set, get) => ({
  items: [],
  categories: [],
  tags: [],
  loading: false,
  error: null,
  meta: null,
  filters: {},
  
  fetchItems: async (params = {}) => {
    set({ loading: true, error: null });
    
    try {
      const finalParams = Object.keys(params).length === 0 ? { ...get().filters } : params;
      
      const queryParams = new URLSearchParams();
      Object.entries(finalParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (value instanceof Date) {
            queryParams.append(`filter[${key}]`, format(value, 'yyyy-MM-dd'));
          } else {
            queryParams.append(`filter[${key}]`, String(value));
          }
        }
      });
      
      if (finalParams.page) {
        queryParams.delete('filter[page]');
        queryParams.append('page', String(finalParams.page));
      }
      
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
      const formData = new FormData();
      
      Object.entries(data).forEach(([key, value]) => {
        if (key !== 'images' && key !== 'image_paths' && key !== 'tags' && value !== undefined && value !== null) {
          
          if (key === 'is_public') {
            formData.append(key, value === true ? "1" : "0");
          } else {
            formData.append(key, String(value));
          }
        }
      });
      
      if (data.images && Array.isArray(data.images)) {
        data.images.forEach((image, index) => {
          formData.append(`images[${index}]`, image);
        });
      }
      
      if (data.image_paths && Array.isArray(data.image_paths)) {
        data.image_paths.forEach((path, index) => {
          formData.append(`image_paths[${index}]`, path);
        });
      }
      
      if (data.tags && Array.isArray(data.tags)) {
        data.tags.forEach((tagId, index) => {
          formData.append(`tags[${index}]`, String(tagId));
        });
      }
      
      const authToken = useAuthStore.getState().token;
      
      const result = await apiRequest<{item: Item}>(`/items`, 'POST', formData);
      
      set({ loading: false });
      
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
      const formData = new FormData();
      
      formData.append('_method', 'PUT');
      
      Object.entries(data).forEach(([key, value]) => {
        if (key !== 'images' && key !== 'image_paths' && key !== 'image_ids' && key !== 'tags' && value !== undefined && value !== null) {
          if (key === 'is_public') {
            formData.append(key, value === true ? "1" : "0");
          } else {
            formData.append(key, String(value));
          }
        }
      });
      
      if (data.images && Array.isArray(data.images)) {
        data.images.forEach((image, index) => {
          formData.append(`images[${index}]`, image);
        });
      }
      
      if (data.image_paths && Array.isArray(data.image_paths)) {
        data.image_paths.forEach((path, index) => {
          formData.append(`image_paths[${index}]`, path);
        });
      }
      
      if (data.image_ids && Array.isArray(data.image_ids)) {
        data.image_ids.forEach((id, index) => {
          formData.append(`image_ids[${index}]`, String(id));
        });
      }
      
      if (data.tags && Array.isArray(data.tags)) {
        data.tags.forEach((tagId, index) => {
          formData.append(`tags[${index}]`, String(tagId));
        });
      }
      
      const result = await apiRequest<{item: Item}>(`/items/${id}`, 'POST', formData);
      
      set({ loading: false });
      
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
      
      set(state => ({
        items: state.items.filter(item => item.id !== id),
        loading: false
      }));
      
      get().fetchItems();
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : '未知错误',
      });
      throw error;
    }
  },
  
  saveFilters: (filters) => {
    set({ filters });
  }
})); 