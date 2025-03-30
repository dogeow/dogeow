// 用户类型定义
export interface User {
  id: number;
  name: string;
  email: string;
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