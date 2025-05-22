'use client'

import { useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { Loader2 } from 'lucide-react'
import { CloudFile, FolderNode } from '../types'; // Assuming CloudFile and FolderNode are correctly typed
import GridView from './views/GridView'
import ListView from './views/ListView'
import TreeView from './views/TreeView'
import BreadcrumbNav from './BreadcrumbNav'
// import { apiRequest } from '@/lib/api' // apiRequest will be used by the hook
import useFileStore from '../store/useFileStore'
// import useSWR from 'swr' // useSWR will be used by the hook
import { useFileManagement } from '../hooks/useFileManagement';

export default function FileExplorer() {
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
  });

  // 如果搜索或排序条件变化，自动刷新数据
  useEffect(() => {
    mutateFiles();
  }, [searchQuery, sortField, sortDirection, mutateFiles]);

  if (error) {
    toast.error('加载文件失败');
    return <div className="text-center py-8">加载失败，请刷新页面重试</div>;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      {/* 不在树形视图时显示面包屑导航 */}
      {currentView !== 'tree' && <BreadcrumbNav />}
      
      <div className="mt-4">
        {/* 根据当前视图显示不同的组件 */}
        {currentView === 'grid' && files && <GridView files={files} />}

        {currentView === 'list' && files && <ListView files={files} />}

        {currentView === 'tree' && folderTree && files && (
          <TreeView folderTree={folderTree} files={files} />
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
  );
}