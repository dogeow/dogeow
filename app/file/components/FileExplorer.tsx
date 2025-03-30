'use client'

import { useEffect } from 'react'
import useSWR from 'swr'
import { toast } from 'react-hot-toast'
import { Loader2 } from 'lucide-react'
import { CloudFile, FolderNode } from '../types'
import GridView from './views/GridView'
import ListView from './views/ListView'
import TreeView from './views/TreeView'
import BreadcrumbNav from './BreadcrumbNav'
import { apiRequest } from '@/utils/api'
import useFileStore from '../store/useFileStore'

// 后端API基础URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

export default function FileExplorer() {
  const { 
    currentView, 
    currentFolderId, 
    searchQuery,
    sortField,
    sortDirection
  } = useFileStore()

  // 获取文件列表
  const { data: files, error, isLoading, mutate } = useSWR<CloudFile[]>(
    `${API_BASE_URL}/cloud/files?parent_id=${currentFolderId || ''}&search=${searchQuery}&sort_by=${sortField}&sort_direction=${sortDirection}`,
    async (url: string) => {
      try {
        return await apiRequest<CloudFile[]>(url);
      } catch (error) {
        console.error('API请求失败:', error);
        throw error;
      }
    }
  )

  // 获取文件夹树(仅用于TreeView)
  const { data: folderTree } = useSWR<FolderNode[]>(
    currentView === 'tree' ? `${API_BASE_URL}/cloud/tree` : null,
    async (url: string) => {
      try {
        return await apiRequest<FolderNode[]>(url);
      } catch (error) {
        console.error('API请求失败:', error);
        throw error;
      }
    }
  )

  // 如果搜索或排序条件变化，自动刷新数据
  useEffect(() => {
    mutate()
  }, [searchQuery, sortField, sortDirection, mutate])

  if (error) {
    toast.error('加载文件失败')
    return <div className="text-center py-8">加载失败，请刷新页面重试</div>
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div>
      {/* 不在树形视图时显示面包屑导航 */}
      {currentView !== 'tree' && <BreadcrumbNav />}
      
      <div className="mt-4">
        {/* 根据当前视图显示不同的组件 */}
        {currentView === 'grid' && files && (
          <GridView files={files} />
        )}

        {currentView === 'list' && files && (
          <ListView files={files} />
        )}

        {currentView === 'tree' && folderTree && (
          <TreeView folderTree={folderTree} files={files || []} />
        )}

        {/* 无文件时显示 */}
        {files && files.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            {searchQuery 
              ? '没有找到匹配的文件'
              : currentFolderId 
                ? '此文件夹是空的'
                : '没有文件，点击上方的"上传文件"按钮上传您的第一个文件'}
          </div>
        )}
      </div>
    </div>
  )
} 