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
import { useTranslation } from '@/hooks/useTranslation'

interface FileExplorerProps {
  className?: string
}

export default function FileExplorer({ className }: FileExplorerProps) {
  const { t } = useTranslation()
  const { currentView, currentFolderId, searchQuery, sortField, sortDirection } = useFileStore()

  const { files, folderTree, isLoading, error, mutateFiles } = useFileManagement({
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
          <FolderOpen className="text-muted-foreground mb-4 h-16 w-16" />
          <h3 className="text-foreground mb-2 text-lg font-medium">
            {t('file.no_matching_files')}
          </h3>
          <p className="text-muted-foreground mb-4 text-sm">{t('file.try_different_keywords')}</p>
          <Button variant="outline" onClick={handleRefresh}>
            {t('file.refresh')}
          </Button>
        </div>
      )
    }

    if (isInFolder) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <FolderOpen className="text-muted-foreground mb-4 h-16 w-16" />
          <h3 className="text-foreground mb-2 text-lg font-medium">{t('file.folder_empty')}</h3>
          <p className="text-muted-foreground mb-4 text-sm">{t('file.upload_or_create')}</p>
        </div>
      )
    }

    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <FolderOpen className="text-muted-foreground mb-4 h-16 w-16" />
        <h3 className="text-foreground mb-2 text-lg font-medium">{t('file.no_files_yet')}</h3>
        <p className="text-muted-foreground mb-4 text-sm">{t('file.upload_first_file')}</p>
      </div>
    )
  }, [files, searchQuery, currentFolderId, handleRefresh, t])

  // 错误处理优化
  if (error) {
    const errorMessage = error instanceof Error ? error.message : t('file.loading_files')

    // 只在首次加载时显示 toast
    if (!files) {
      toast.error(errorMessage)
    }

    return (
      <div className={className}>
        <div className="border-destructive/50 bg-destructive/10 flex items-center justify-between rounded-lg border p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="text-destructive h-4 w-4" />
            <span className="text-destructive text-sm">{errorMessage}</span>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
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
          <Loader2 className="text-primary h-8 w-8 animate-spin" />
          <p className="text-muted-foreground text-sm">{t('file.loading_files')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      {/* 不在树形视图时显示面包屑导航 */}
      {currentView !== 'tree' && <BreadcrumbNav />}

      <div className="relative mt-4">
        {/* 显示加载指示器（当有数据时的刷新状态） */}
        {isLoading && files && (
          <div className="absolute top-0 right-0 z-10">
            <Loader2 className="text-primary h-4 w-4 animate-spin" />
          </div>
        )}

        {/* 根据当前视图显示不同的组件 */}
        {viewComponent}

        {/* 空状态显示（树形视图由 TreeView 处理） */}
        {currentView !== 'tree' ? emptyStateComponent : null}
      </div>
    </div>
  )
}
