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
];

// 处理表单数据的辅助函数
const prepareFormData = (data: Record<string, any>) => {
  const formData = new FormData();
  
  // 处理基本字段
  Object.entries(data).forEach(([key, value]) => {
    if (
      key !== 'images' && 
      key !== 'image_paths' && 
      key !== 'image_ids' && 
      key !== 'tags' && 
      value !== undefined && 
      value !== null
    ) {
      if (key === 'is_public') {
        formData.append(key, value === true ? "1" : "0");
      } else {
        formData.append(key, String(value));
      }
    }
  });
  
  // 处理图片文件
  if (data.images && Array.isArray(data.images)) {
    data.images.forEach((image, index) => {
      formData.append(`images[${index}]`, image);
    });
  }
  
  // 处理图片路径
  if (data.image_paths && Array.isArray(data.image_paths)) {
    data.image_paths.forEach((path, index) => {
      formData.append(`image_paths[${index}]`, path);
    });
  }
  
  // 处理图片ID
  if (data.image_ids && Array.isArray(data.image_ids)) {
    data.image_ids.forEach((id, index) => {
      formData.append(`image_ids[${index}]`, String(id));
    });
  }
  
  // 处理标签
  if (data.tags && Array.isArray(data.tags)) {
    data.tags.forEach((tagId, index) => {
      formData.append(`tags[${index}]`, String(tagId));
    });
  }
  
  return formData;
};

interface ItemState {
  items: Item[];
  categories: Category[];
  tags: Tag[];
  loading: boolean;
  error: string | null;
  meta: any | null;
  filters: Record<string, any>;
  
  fetchItems: (params?: Record<string, any>, itemsOnly?: boolean) => Promise<any>;
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
    tags?: Tag[]
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
  
  fetchItems: async (params = {}, itemsOnly = false) => {
    // 如果已经在加载中，则不重复请求
    if (get().loading) {
      console.log('ItemStore: 已有请求正在进行，跳过重复请求');
      return Promise.resolve(get().items);
    }
    
    set({ loading: true, error: null });
    
    try {
      const finalParams = Object.keys(params).length === 0 ? { ...get().filters } : params;
      
      // 移除itemsOnly参数
      if ('itemsOnly' in finalParams) {
        delete finalParams.itemsOnly;
      }
      
      // 准备发送到后端的参数
      const backendParams = { ...finalParams };
      
      // 移除前端专用过滤器
      FRONTEND_ONLY_FILTERS.forEach(filter => {
        if (filter in backendParams) {
          delete backendParams[filter];
        }
      });
      
      // 构建查询字符串
      const queryParams = new URLSearchParams();
      
      // 添加请求去重标记
      const requestId = Date.now().toString();
      console.log('ItemStore: 请求ID:', requestId);
      
      Object.entries(backendParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (value instanceof Date) {
            queryParams.append(`filter[${key}]`, format(value, 'yyyy-MM-dd'));
          } else if (Array.isArray(value)) {
            queryParams.append(`filter[${key}]`, value.join(','));
          } else {
            // 特殊处理search参数，发送名称过滤器
            if (key === 'search') {
              // 使用filter[name]来过滤名称，这是后端API的预期格式
              queryParams.append('filter[name]', String(value));
              // 记录日志，便于调试
              console.log('添加过滤参数 filter[name]:', value);
            } else {
              queryParams.append(`filter[${key}]`, String(value));
            }
          }
        }
      });
      
      // 处理分页参数
      if (finalParams.page) {
        queryParams.delete('filter[page]');
        queryParams.append('page', String(finalParams.page));
      }
      
      const queryString = queryParams.toString();
      const url = `/things/items${queryString ? `?${queryString}` : ''}`;
      
      // 记录完整请求URL，方便调试
      console.log(`请求后端API: ${API_URL}/api/things/items${queryString ? `?${queryString}` : ''}`);
      
      try {
        const data = await apiRequest<{data: Item[], meta: any}>(url);
        console.log('API请求成功，获取到数据:', data);
        
        set({
          items: data.data || [],
          loading: false,
          meta: data.meta || null,
        });
        
        return data;
      } catch (error) {
        console.error('API请求失败:', error);
        set({
          loading: false,
          error: error instanceof Error ? error.message : '未知错误',
        });
      }
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : '未知错误',
      });
    }
  },
  
  fetchCategories: async () => {
    try {
      const data = await apiRequest<Category[]>(`/things/categories`);
      set({ categories: data });
      return data;
    } catch (error) {
      console.error('获取分类失败:', error);
      return undefined;
    }
  },
  
  fetchTags: async () => {
    try {
      const data = await apiRequest<Tag[]>(`/things/tags`);
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
      const item = await apiRequest<Item>(`/things/items/${id}`);
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
      const formData = prepareFormData(data);
      const result = await apiRequest<{item: Item}>(`/things/items`, 'POST', formData);
      
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
      const formData = prepareFormData(data);
      formData.append('_method', 'PUT'); // 添加PUT方法模拟
      
      const result = await apiRequest<{item: Item}>(`/things/items/${id}`, 'POST', formData);
      
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
      await apiRequest(`/things/items/${id}`, 'DELETE');
      
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