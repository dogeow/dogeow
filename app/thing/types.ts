import { User } from '@/app';

// 物品表单数据类型
export interface ItemFormData {
  name: string;
  description: string;
  quantity: number;
  status: string;
  purchase_date: Date | null;
  expiry_date: Date | null;
  purchase_price: number | null;
  category_id: string;
  area_id: string;
  room_id: string;
  spot_id: string;
  is_public: boolean;
}

// 物品图片类型
export interface ItemImage {
  id: number;
  thumbnail_path: string;
  thumbnail_url?: string;
  path?: string;
  url?: string;
}

// 上传图片类型
export type UploadedImage = {
  path: string;
  thumbnail_path: string;
  url: string;
  thumbnail_url: string;
  id?: number;
  is_primary?: boolean;
}

// 图片预览类型
export type ImagePreview = {
  url: string;
  name: string;
}

// 位置选择类型
export type LocationSelection = { 
  type: 'area' | 'room' | 'spot'; 
  id: number;
} | undefined;

// 分类类型
export interface Category {
  id: number;
  name: string;
  user_id?: number;
  items_count?: number;
}

// 区域类型
export interface Area {
  id: number;
  name: string;
  user_id?: number;
  created_at?: string;
  updated_at?: string;
}

// 房间类型
export interface Room {
  id: number;
  name: string;
  area_id: number;
  user_id?: number;
  area?: Area;
  created_at?: string;
  updated_at?: string;
}

// 位置类型
export interface Spot {
  id: number;
  name: string;
  room_id: number;
  user_id?: number;
  room?: Room;
  parent_spot?: Spot;
  created_at?: string;
  updated_at?: string;
}

// 物品类型
export interface Item {
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
  thumbnail_url?: string | null;
  user?: User;
  category?: Category;
  spot?: Spot & {
    room?: Room & {
      area?: Area;
    };
  };
  images?: Array<{
    id: number;
    path: string;
    thumbnail_path: string;
    thumbnail_url?: string;
    url?: string;
    is_primary: boolean;
  }>;
  primary_image?: {
    id: number;
    path: string;
    thumbnail_path: string;
    thumbnail_url?: string;
    url?: string;
  };
  tags?: Tag[];
  notes?: string;
} 


// 定义视图模式类型
export type ViewMode = 'list' | 'gallery';

// 定义过滤器类型
export interface FilterParams {
  page?: number;
  search?: string;
  category_id?: string | number;
  tags?: string[] | number[] | string;
  include_null_purchase_date?: boolean;
  include_null_expiry_date?: boolean;
  purchase_date_from?: Date | null;
  expiry_date_from?: Date | null;
  isFilterToggle?: boolean;
  [key: string]: any;
}

// 标签类型定义
export type Tag = {
  id: number
  name: string
  color?: string
  items_count?: number
  created_at?: string
  updated_at?: string
}