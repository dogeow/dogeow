"use client"

import ProtectedRoute from '@/components/ProtectedRoute';
import useAuthStore from '@/stores/authStore';
import { apiRequest } from '@/lib/api';
import useSWR from 'swr';

interface ClientInfo {
  ip: string;
  user_agent: string;
}

export default function Dashboard() {
  const { user, isAuthenticated } = useAuthStore();
  const { data: clientInfo, isLoading } = useSWR<ClientInfo>('/client-info', apiRequest);

  // 显示加载状态，直到确认用户已加载
  if (!isAuthenticated) {
    return <div className="p-6">正在加载用户信息...</div>;
  }

  return (
    <ProtectedRoute>
      <div className="p-6">
        <h1 className="text-xl font-bold mb-4">仪表盘</h1>
        
        <div className="space-y-4">
          <div>
            <div className="mb-1 text-sm text-gray-400">IP 地址</div>
            <div className="break-all text-sm text-gray-200 bg-gray-800 rounded p-3">
              {isLoading ? '加载中...' : clientInfo?.ip}
            </div>
          </div>

          <div>
            <div className="mb-1 text-sm text-gray-400">User-Agent</div>
            <div className="break-all text-sm text-gray-200 bg-gray-800 rounded p-3">
              {isLoading ? '加载中...' : clientInfo?.user_agent}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
} 