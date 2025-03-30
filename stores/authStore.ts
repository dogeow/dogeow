import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User, AuthResponse } from '../app';
import { post } from '@/utils/api';

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  
  // 操作方法
  setLoading: (loading: boolean) => void;
  login: (email: string, password: string) => Promise<AuthResponse>;
  logout: () => void;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  getToken: () => string | null;
}

// 创建持久化的认证存储
const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      loading: false,
      isAuthenticated: false,
      
      setLoading: (loading) => set({ loading }),
      
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      
      setToken: (token) => set({ token, isAuthenticated: !!token }),
      
      // 获取token的方法
      getToken: () => get().token,
      
      login: async (email, password) => {
        set({ loading: true });
        
        try {
          // 注意：这里我们使用完整URL而不是相对路径，因为登录接口可能需要特殊处理
          const data = await post<AuthResponse>('/login', { email, password });
          
          // 存储用户信息和token
          set({ 
            user: data.user, 
            token: data.token, 
            loading: false,
            isAuthenticated: true
          });
          
          // 同时存储到localStorage作为备份
          localStorage.setItem('auth-token', data.token);
          
          return data;
        } catch (error) {
          set({ loading: false });
          throw error;
        }
      },
      
      logout: () => {
        // 可以选择调用后端的登出接口
        // 如果需要的话，可以在这里添加 API 调用
        
        set({ 
          user: null, 
          token: null, 
          isAuthenticated: false 
        });
        
        // 清除localStorage中的备份token
        localStorage.removeItem('auth-token');
      },
    }),
    {
      name: 'auth-storage', // localStorage 的键名
      storage: createJSONStorage(() => localStorage), // 默认，可以不写
      // 指定需要持久化的状态字段
      partialize: (state) => ({ 
        user: state.user, 
        token: state.token,
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);

// 初始化时检查localStorage中是否有token，并获取用户信息
const initializeAuth = async () => {
  const token = localStorage.getItem('auth-token');
  if (token) {
    useAuthStore.getState().setToken(token);
  }
};

// 在应用启动时初始化认证状态
if (typeof window !== 'undefined') {
  initializeAuth();
}

export default useAuthStore; 