// 物品表单数据类型
export interface ItemFormData {
  name: string;
  description: string;
  quantity: number;
  status: string;
  purchase_date: Date | null;
  expiry_date: Date | null;
  purchase_price: string;
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
}

// 标签类型
export interface Tag {
  id: number;
  name: string;
  color: string;
} 