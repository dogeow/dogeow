"use client"

import ProtectedRoute from '@/components/ProtectedRoute';
import useAuthStore from '@/stores/authStore';

export default function Dashboard() {
  const { user, isAuthenticated } = useAuthStore();

  // 显示加载状态，直到确认用户已加载
  if (!isAuthenticated) {
    return <div>正在加载用户信息...</div>;
  }

  return (
    <ProtectedRoute>
      <div>
        <h1>仪表盘</h1>
        
        <div>User-Agent</div> 
        <div>{navigator.userAgent}</div>
      </div>
    </ProtectedRoute>
  );
} 