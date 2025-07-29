'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import useAuthStore from '@/stores/authStore'
import { configs } from '@/app/configs'
import { useTranslation } from '@/hooks/useTranslation'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { t } = useTranslation()
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, loading } = useAuthStore()
  const [isClient, setIsClient] = useState(false)

  // 确保组件只在客户端渲染，避免水合错误
  useEffect(() => {
    setIsClient(true)
  }, [])

  // 根据当前路径判断是否需要登录保护
  const needsProtection = useCallback(() => {
    // 查找匹配的瓦片配置
    const matchingTile = configs.tiles.find(tile => pathname.startsWith(tile.href))

    // 如果找到匹配的瓦片，使用其 needLogin 配置
    if (matchingTile) {
      return matchingTile.needLogin === true
    }

    // 对于一些特殊路径，直接判断
    const protectedPaths = ['/dashboard'] // dashboard 不在 tiles 配置中但需要保护
    return protectedPaths.some(path => pathname.startsWith(path))
  }, [pathname])

  useEffect(() => {
    // 只有需要保护的路径才进行登录检查
    if (isClient && !loading && needsProtection() && !isAuthenticated) {
      router.push('/')
    }
  }, [isClient, isAuthenticated, loading, router, needsProtection])

  // 在服务端渲染或客户端初始化时，显示加载状态
  if (!isClient || loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <div className="text-muted-foreground">{t('loading.text')}</div>
      </div>
    )
  }

  // 如果不需要保护，或者用户已认证，显示内容
  return !needsProtection() || isAuthenticated ? <>{children}</> : null
}
