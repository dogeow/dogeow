"use client"

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import useAuthStore from '@/stores/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuthStore();

  useEffect(() => {
    // 如果认证状态已加载完成且用户未认证，则重定向到登录页
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, loading, router]);

  // 如果正在加载认证状态，显示加载中
  if (loading) {
    return <div>加载中...</div>;
  }

  // 如果用户已认证，显示受保护的内容
  return isAuthenticated ? <>{children}</> : null;
} 