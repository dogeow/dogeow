'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import useAuthStore from '@/stores/authStore'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter()
  const { isAuthenticated, loading } = useAuthStore()
  const [isClient, setIsClient] = useState(false)

  // 确保组件只在客户端渲染，避免水合错误
  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    // 如果认证状态已加载完成且用户未认证，则重定向到首页
    if (isClient && !loading && !isAuthenticated) {
      router.push('/')
    }
  }, [isClient, isAuthenticated, loading, router])

  // 在服务端渲染或客户端初始化时，显示加载状态
  if (!isClient || loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    )
  }

  // 如果用户已认证，显示受保护的内容
  return isAuthenticated ? <>{children}</> : null
}
