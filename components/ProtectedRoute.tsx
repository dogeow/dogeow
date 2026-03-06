'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useMemo, useSyncExternalStore } from 'react'
import useAuthStore from '@/stores/authStore'
import { isProtectedPath } from '@/lib/constants/protected-routes'
import { useTranslation } from '@/hooks/useTranslation'

const emptySubscribe = () => () => {}

interface ProtectedRouteProps {
  children: React.ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { t } = useTranslation()
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, loading } = useAuthStore()
  const isClient = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  )

  const needsProtection = useMemo(() => isProtectedPath(pathname), [pathname])

  useEffect(() => {
    // 只有需要保护的路径才进行登录检查
    if (isClient && !loading && needsProtection && !isAuthenticated) {
      router.push('/')
    }
  }, [isClient, isAuthenticated, loading, router, needsProtection])

  // Public routes should render immediately instead of waiting for auth store
  // hydration, otherwise the app ships a loading shell for the homepage.
  if (!needsProtection) {
    return <>{children}</>
  }

  // 在服务端渲染或客户端初始化时，显示加载状态
  if (!isClient || loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <div className="text-muted-foreground">{t('loading.text')}</div>
      </div>
    )
  }

  // 如果不需要保护，或者用户已认证，显示内容
  return !needsProtection || isAuthenticated ? <>{children}</> : null
}
