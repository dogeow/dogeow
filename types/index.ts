// 用户类型定义
export interface User {
  id: number;
  name: string;
  email: string;
}

export interface Category {
  id: number;
  name: string;
}

export interface Area {
  id: number;
  name: string;
}

export interface Room {
  id: number;
  name: string;
  area_id: number;
}

export interface Spot {
  id: number;
  name: string;
  room_id: number;
}

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
    is_primary: boolean;
  }>;
  primary_image?: {
    id: number;
    path: string;
    thumbnail_path: string;
  };
}

// 认证响应类型
export interface AuthResponse {
  user: User;
  token: string;
}

// API错误响应类型
export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
} 