"use client"

import ProtectedRoute from '../components/ProtectedRoute';
import { useState } from 'react';
import useAuthStore from '../stores/authStore';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const { user, isAuthenticated } = useAuthStore();

  // 显示加载状态，直到确认用户已加载
  if (!isAuthenticated) {
    return <div>正在加载用户信息...</div>;
  }

  return (
    <ProtectedRoute>
      <div>
        <h1>仪表盘</h1>
        {user && <p>欢迎, {user.name}!</p>}
        
        {loading ? (
          <p>加载数据中...</p>
        ) : (
          <div>
            还没写
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
} 