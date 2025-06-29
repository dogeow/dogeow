'use client'

import { useEffect, useMemo, useCallback } from 'react'
import { toast } from 'react-hot-toast'
import { Loader2, AlertCircle, FolderOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import GridView from './views/GridView'
import ListView from './views/ListView'
import TreeView from './views/TreeView'
import BreadcrumbNav from './BreadcrumbNav'
import useFileStore from '../store/useFileStore'
import { useFileManagement } from '../hooks/useFileManagement'

interface FileExplorerProps {
  className?: string
}

export default function FileExplorer({ className }: FileExplorerProps) {
  const { 
    currentView, 
    currentFolderId, 
    searchQuery,
    sortField,
    sortDirection
  } = useFileStore()

  const {
    files,
    folderTree,
    isLoading,
    error,
    mutateFiles,
  } = useFileManagement({
    currentFolderId,
    searchQuery,
    sortField,
    sortDirection,
    currentView,
  })

  // 使用 useCallback 优化函数引用
  const handleRefresh = useCallback(() => {
    mutateFiles()
  }, [mutateFiles])

  // 如果搜索或排序条件变化，自动刷新数据
  useEffect(() => {
    handleRefresh()
  }, [searchQuery, sortField, sortDirection, handleRefresh])

  // 使用 useMemo 优化渲染性能
  const viewComponent = useMemo(() => {
    if (!files) return null

    switch (currentView) {
      case 'grid':
        return <GridView files={files} />
      case 'list':
        return <ListView files={files} />
      case 'tree':
        return folderTree ? <TreeView folderTree={folderTree} files={files} /> : null
      default:
        return null
    }
  }, [currentView, files, folderTree])

  // 优化空状态显示
  const emptyStateComponent = useMemo(() => {
    if (!files || files.length > 0) return null

    const isSearching = Boolean(searchQuery.trim())
    const isInFolder = Boolean(currentFolderId)

    if (isSearching) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <FolderOpen className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">没有找到匹配的文件</h3>
          <p className="text-sm text-muted-foreground mb-4">
            尝试使用不同的关键词搜索
          </p>
          <Button variant="outline" onClick={handleRefresh}>
            刷新
          </Button>
        </div>
      )
    }

    if (isInFolder) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <FolderOpen className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">此文件夹是空的</h3>
          <p className="text-sm text-muted-foreground mb-4">
            上传文件或创建文件夹来开始使用
          </p>
        </div>
      )
    }

    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <FolderOpen className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">还没有文件</h3>
        <p className="text-sm text-muted-foreground mb-4">
          点击上方的&quot;上传文件&quot;按钮上传您的第一个文件
        </p>
      </div>
    )
  }, [files, searchQuery, currentFolderId, handleRefresh])

  // 错误处理优化
  if (error) {
    const errorMessage = error instanceof Error ? error.message : '加载文件失败'
    
    // 只在首次加载时显示 toast
    if (!files) {
      toast.error(errorMessage)
    }

    return (
      <div className={className}>
        <div className="flex items-center justify-between p-4 border border-destructive/50 rounded-lg bg-destructive/10">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <span className="text-sm text-destructive">{errorMessage}</span>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
          >
            重试
          </Button>
        </div>
      </div>
    )
  }

  // 加载状态优化
  if (isLoading && !files) {
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <div className="flex flex-col items-center space-y-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">正在加载文件...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      {/* 不在树形视图时显示面包屑导航 */}
      {currentView !== 'tree' && <BreadcrumbNav />}
      
      <div className="mt-4 relative">
        {/* 显示加载指示器（当有数据时的刷新状态） */}
        {isLoading && files && (
          <div className="absolute top-0 right-0 z-10">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          </div>
        )}

        {/* 根据当前视图显示不同的组件 */}
        {viewComponent}

        {/* 空状态显示 */}
        {emptyStateComponent}
      </div>
    </div>
  )
}