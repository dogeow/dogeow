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
const prepareFormData = (data: Record<string, unknown>) => {
  const formData = new FormData();

  // 处理基本字段
  Object.entries(data).forEach(([key, value]) => {
    if (!SPECIAL_FIELDS.includes(key as typeof SPECIAL_FIELDS[number]) && value != null) {
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
const buildQueryParams = (params: ItemFilters) => {
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
const filterBackendParams = (params: ItemFilters) => {
  const filtered = { ...params };

  // 移除前端专用参数
  ['itemsOnly', ...FRONTEND_ONLY_FILTERS].forEach(key => {
    delete filtered[key];
  });

  return filtered;
};

export type ItemFormData = Omit<Partial<Item>, 'images' | 'tags'> & {
  images?: File[];
  image_paths?: string[];
  image_ids?: number[];
  tags?: Tag[] | number[];
};

// 分页元数据类型
interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from?: number;
  to?: number;
}

// 过滤器类型
interface ItemFilters {
  search?: string;
  category_id?: number | string;
  tag_id?: number;
  area_id?: number;
  room_id?: number;
  spot_id?: number;
  is_public?: boolean;
  purchase_date?: Date;
  expiry_date?: Date;
  page?: number;
  itemsOnly?: boolean;
  include_null_purchase_date?: boolean;
  include_null_expiry_date?: boolean;
  exclude_null_purchase_date?: boolean;
  exclude_null_expiry_date?: boolean;
  tags?: string[] | number[] | string;
  [key: string]: unknown;
}

interface ItemState {
  items: Item[];
  categories: Category[];
  tags: Tag[];
  loading: boolean;
  error: string | null;
  meta: PaginationMeta | null;
  filters: ItemFilters;

  fetchItems: (params?: ItemFilters) => Promise<{ data: Item[], meta: PaginationMeta } | undefined>;
  fetchCategories: () => Promise<Category[] | undefined>;
  fetchTags: () => Promise<Tag[] | undefined>;
  createCategory: (data: { name: string; parent_id?: number | null }) => Promise<Category>;
  getItem: (id: number) => Promise<Item | null>;
  createItem: (data: ItemFormData) => Promise<Item>;
  updateItem: (id: number, data: ItemFormData) => Promise<Item>;
  deleteItem: (id: number) => Promise<void>;
  saveFilters: (filters: ItemFilters) => void;
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

      const data = await apiRequest<{ data: Item[], meta: PaginationMeta }>(url);

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

  createCategory: async (data) => {
    try {
      const response = await apiRequest<unknown>('/things/categories', 'POST', data);
      console.log('创建分类API响应:', response);

      // 刷新分类列表
      await get().fetchCategories();

      // 根据实际API响应结构返回分类数据
      // 如果响应直接是分类对象
      if (response && (response as { id?: number }).id) {
        return response as Category;
      }
      // 如果响应包含分类对象在某个字段中
      if (response && (response as { category?: { id?: number } }).category?.id) {
        return (response as { category: Category }).category;
      }
      // 如果响应包含分类对象在data字段中
      if (response && (response as { data?: { id?: number } }).data?.id) {
        return (response as { data: Category }).data;
      }

      // 如果无法从响应中获取分类ID，从刷新后的分类列表中找到新创建的分类
      const categories = get().categories;
      const newCategory = categories.find(cat => cat.name === data.name && cat.parent_id === data.parent_id);
      if (newCategory) {
        return newCategory;
      }

      throw new Error('无法获取新创建的分类信息');
    } catch (error) {
      const errorMessage = handleError(error, '创建分类失败');
      throw new Error(errorMessage);
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
      const result = await apiRequest<{ item: Item }>('/things/items', 'POST', formData);

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

      const result = await apiRequest<{ item: Item }>(`/things/items/${id}`, 'POST', formData);

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