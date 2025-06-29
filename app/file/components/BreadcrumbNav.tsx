'use client'

import { useMemo } from 'react'
import { ChevronRight, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import useFileStore from '../store/useFileStore'
import { useBreadcrumbs, type Breadcrumb } from '../hooks/useBreadcrumbs'
import BreadcrumbSkeleton from './BreadcrumbSkeleton'

export default function BreadcrumbNav() {
  const { currentFolderId, navigateToFolder } = useFileStore()
  
  // 使用自定义 hook 获取面包屑数据
  const { 
    data: breadcrumbs = [], 
    isLoading,
    error 
  } = useBreadcrumbs(currentFolderId)

  // 处理导航点击
  const handleNavigate = useMemo(() => {
    return (folderId: number | null) => {
      navigateToFolder(folderId)
    }
  }, [navigateToFolder])

  // 渲染面包屑项
  const renderBreadcrumbItems = useMemo(() => {
    if (!breadcrumbs.length) return null

    return breadcrumbs.map((crumb: Breadcrumb) => (
      <div key={crumb.id} className="flex items-center">
        <ChevronRight className="h-4 w-4 mx-1 text-muted-foreground" />
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 hover:bg-muted/50 transition-colors"
          onClick={() => handleNavigate(crumb.id)}
        >
          {crumb.name}
        </Button>
      </div>
    ))
  }, [breadcrumbs, handleNavigate])

  // 加载状态显示
  if (isLoading && currentFolderId) {
    return <BreadcrumbSkeleton />
  }

  // 错误状态显示
  if (error) {
    return (
      <div className="flex items-center text-sm mt-4 text-destructive">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2"
          onClick={() => handleNavigate(null)}
        >
          <Home className="h-4 w-4 mr-1" />
          主目录
        </Button>
        <span className="ml-2 text-xs">加载路径失败</span>
      </div>
    )
  }

  return (
    <div className="flex items-center text-sm mt-4">
      <Button
        variant="ghost"
        size="sm"
        className="h-7 px-2 hover:bg-muted/50 transition-colors"
        onClick={() => handleNavigate(null)}
      >
        <Home className="h-4 w-4 mr-1" />
        主目录
      </Button>

      {renderBreadcrumbItems}
    </div>
  )
} 