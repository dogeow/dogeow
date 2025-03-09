'use client';

import { useRouter } from 'next/navigation';
import useAuthStore from '@/stores/authStore';

export default function LogoutButton() {
  const router = useRouter();
  const logout = useAuthStore(state => state.logout);
  
  const handleLogout = async () => {
    try {
      // 使用store中的logout方法，它会清除所有状态
      logout();
      
      // 重定向到登录页面
      router.push('/login');
    } catch (error) {
      console.error('登出失败:', error);
    }
  };
  
  return (
    <button onClick={handleLogout}>
      登出
    </button>
  );
} 