import { create } from 'zustand';
import { format } from 'date-fns';
import { apiRequest, API_URL } from '@/lib/api';
import { Item, Category, Tag } from '@/app/thing/types';

// 前端专用过滤器，不发送到后端
const FRONTEND_ONLY_FILTERS = [
  'include_null_purchase_date', 
  'include_null_expiry_date', 
  'exclude_null_purchase_date', 
  'exclude_null_expiry_date'
] as const;

// 需要特殊处理的字段
const SPECIAL_FIELDS = ['images', 'image_paths', 'image_ids', 'tags'] as const;

// 统一错误处理
const handleError = (error: unknown, defaultMessage = '未知错误'): string => {
  const message = error instanceof Error ? error.message : defaultMessage;
  console.error('ItemStore 错误:', error);
  return message;
};

// 处理表单数据的辅助函数
const prepareFormData = (data: Record<string, any>) => {
  const formData = new FormData();
  
  // 处理基本字段
  Object.entries(data).forEach(([key, value]) => {
    if (!SPECIAL_FIELDS.includes(key as any) && value != null) {
      formData.append(key, key === 'is_public' ? (value ? "1" : "0") : String(value));
    }
  });
  
  // 处理数组字段
  const arrayFields = {
    images: data.images,
    image_paths: data.image_paths,
    image_ids: data.image_ids,
    tags: data.tags
  };
  
  Object.entries(arrayFields).forEach(([fieldName, fieldValue]) => {
    if (Array.isArray(fieldValue)) {
      fieldValue.forEach((item, index) => {
        const value = fieldName === 'image_ids' || fieldName === 'tags' ? String(item) : item;
        formData.append(`${fieldName}[${index}]`, value);
      });
    }
  });
  
  return formData;
};

// 构建查询参数
const buildQueryParams = (params: Record<string, any>) => {
  const queryParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value != null && value !== '') {
      let paramValue: string;
      
      if (value instanceof Date) {
        paramValue = format(value, 'yyyy-MM-dd');
      } else if (Array.isArray(value)) {
        paramValue = value.join(',');
      } else {
        paramValue = String(value);
      }
      
      // 特殊处理 search 参数
      const paramKey = key === 'search' ? 'filter[name]' : `filter[${key}]`;
      queryParams.append(paramKey, paramValue);
    }
  });
  
  return queryParams;
};

// 过滤前端专用参数
const filterBackendParams = (params: Record<string, any>) => {
  const filtered = { ...params };
  
  // 移除前端专用参数
  ['itemsOnly', ...FRONTEND_ONLY_FILTERS].forEach(key => {
    delete filtered[key];
  });
  
  return filtered;
};

type ItemFormData = Omit<Partial<Item>, 'images'> & {
  images?: File[];
  image_paths?: string[];
  image_ids?: number[];
  tags?: Tag[] | number[];
};

interface ItemState {
  items: Item[];
  categories: Category[];
  tags: Tag[];
  loading: boolean;
  error: string | null;
  meta: any | null;
  filters: Record<string, any>;
  
  fetchItems: (params?: Record<string, any>) => Promise<{data: Item[], meta: any} | undefined>;
  fetchCategories: () => Promise<Category[] | undefined>;
  fetchTags: () => Promise<Tag[] | undefined>;
  getItem: (id: number) => Promise<Item | null>;
  createItem: (data: ItemFormData) => Promise<Item>;
  updateItem: (id: number, data: ItemFormData) => Promise<Item>;
  deleteItem: (id: number) => Promise<void>;
  saveFilters: (filters: Record<string, any>) => void;
  clearError: () => void;
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
    const state = get();
    
    // 防止重复请求
    if (state.loading) {
      console.log('ItemStore: 请求已在进行中，跳过重复请求');
      return;
    }
    
    set({ loading: true, error: null });
    
    try {
      const finalParams = Object.keys(params).length === 0 ? state.filters : params;
      const backendParams = filterBackendParams(finalParams);
      const queryParams = buildQueryParams(backendParams);
      
      // 处理分页参数
      if (finalParams.page) {
        queryParams.delete('filter[page]');
        queryParams.append('page', String(finalParams.page));
      }
      
      const queryString = queryParams.toString();
      const url = `/things/items${queryString ? `?${queryString}` : ''}`;
      
      console.log(`请求 API: ${API_URL}/api/things/items${queryString ? `?${queryString}` : ''}`);
      
      const data = await apiRequest<{data: Item[], meta: any}>(url);
      
      set({
        items: data.data || [],
        loading: false,
        meta: data.meta || null,
      });
      
      return data;
    } catch (error) {
      const errorMessage = handleError(error, '获取物品列表失败');
      set({ loading: false, error: errorMessage });
    }
  },
  
  fetchCategories: async () => {
    try {
      const data = await apiRequest<Category[]>('/things/categories');
      set({ categories: data });
      return data;
    } catch (error) {
      handleError(error, '获取分类失败');
      return undefined;
    }
  },
  
  fetchTags: async () => {
    try {
      const data = await apiRequest<Tag[]>('/things/tags');
      set({ tags: data });
      return data;
    } catch (error) {
      handleError(error, '获取标签失败');
      return undefined;
    }
  },
  
  getItem: async (id) => {
    set({ loading: true, error: null });
    
    try {
      const item = await apiRequest<Item>(`/things/items/${id}`);
      set({ loading: false });
      return item;
    } catch (error) {
      const errorMessage = handleError(error, '获取物品详情失败');
      set({ loading: false, error: errorMessage });
      return null;
    }
  },
  
  createItem: async (data) => {
    set({ loading: true, error: null });
    
    try {
      const formData = prepareFormData(data);
      const result = await apiRequest<{item: Item}>('/things/items', 'POST', formData);
      
      set({ loading: false });
      // 刷新列表
      await get().fetchItems();
      
      return result.item;
    } catch (error) {
      const errorMessage = handleError(error, '创建物品失败');
      set({ loading: false, error: errorMessage });
      throw error;
    }
  },
  
  updateItem: async (id, data) => {
    set({ loading: true, error: null });
    
    try {
      const formData = prepareFormData(data);
      formData.append('_method', 'PUT');
      
      const result = await apiRequest<{item: Item}>(`/things/items/${id}`, 'POST', formData);
      
      set({ loading: false });
      // 刷新列表
      await get().fetchItems();
      
      return result.item;
    } catch (error) {
      const errorMessage = handleError(error, '更新物品失败');
      set({ loading: false, error: errorMessage });
      throw error;
    }
  },
  
  deleteItem: async (id: number) => {
    set({ loading: true, error: null });
    
    try {
      await apiRequest(`/things/items/${id}`, 'DELETE');
      
      set(state => ({
        items: state.items.filter(item => item.id !== id),
        loading: false
      }));
      
      // 刷新列表以确保数据一致性
      await get().fetchItems();
    } catch (error) {
      const errorMessage = handleError(error, '删除物品失败');
      set({ loading: false, error: errorMessage });
      throw error;
    }
  },
  
  saveFilters: (filters) => {
    set({ filters });
  },
  
  clearError: () => {
    set({ error: null });
  }
}));