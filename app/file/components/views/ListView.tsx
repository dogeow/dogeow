'use client'

import Image from 'next/image'

import {
  File,
  FileText,
  FileArchive,
  FileAudio,
  FileVideo,
  FileType,
  FileSpreadsheet,
  Folder,
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'react-hot-toast'
import { cn } from '@/lib/helpers'
import { CloudFile, SortField } from '../../types'
import useFileStore from '../../store/useFileStore'
import { API_URL } from '@/lib/api'

interface ListViewProps {
  files: CloudFile[]
}

export default function ListView({ files }: ListViewProps) {
  const { 
    // currentFolderId, // unused 
    navigateToFolder, 
    selectedFiles, 
    setSelectedFiles,
    sortField,
    sortDirection,
    handleSort
  } = useFileStore()

  // 切换选择文件
  const toggleSelection = (fileId: number, event: React.MouseEvent) => {
    event.stopPropagation()
    
    if (selectedFiles.includes(fileId)) {
      setSelectedFiles(selectedFiles.filter(id => id !== fileId))
    } else {
      setSelectedFiles([...selectedFiles, fileId])
    }
  }

  // 全选/取消全选
  const toggleSelectAll = () => {
    if (selectedFiles.length === files.length) {
      setSelectedFiles([])
    } else {
      setSelectedFiles(files.map(file => file.id))
    }
  }

  // 获取文件图标或缩略图
  const getFileIcon = (file: CloudFile) => {
    if (file.is_folder) return <Folder className="h-4 w-4 text-yellow-500" />
    
    // 如果是图片，显示缩略图
    if (file.type === 'image') {
      return (
        <div className="w-6 h-6 relative overflow-hidden rounded-sm flex items-center justify-center bg-muted">
          <Image 
            src={`${API_URL}/api/cloud/files/${file.id}/preview?thumb=true`} 
            alt={file.name} width={24} height={24} 
            className="object-cover w-full h-full"
            onError={(e) => {
              // 如果缩略图加载失败，显示默认图标
              e.currentTarget.style.display = 'none';
              e.currentTarget.parentElement?.classList.add('flex');
              e.currentTarget.parentElement?.appendChild(
                Object.assign(document.createElement('div'), {
                  className: 'flex items-center justify-center',
                  innerHTML: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4 text-blue-500"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline><circle cx="10" cy="13" r="2"></circle><path d="m20 17-1.09-1.09a2 2 0 0 0-2.82 0L10 22"></path></svg>'
                })
              );
            }}
          />
        </div>
      );
    }
    
    switch (file.type) {
      case 'pdf':
        return <FileType className="h-4 w-4 text-red-500" />
      case 'document':
        return <FileText className="h-4 w-4 text-green-500" />
      case 'spreadsheet':
        return <FileSpreadsheet className="h-4 w-4 text-green-500" />
      case 'archive':
        return <FileArchive className="h-4 w-4 text-orange-500" />
      case 'audio':
        return <FileAudio className="h-4 w-4 text-purple-500" />
      case 'video':
        return <FileVideo className="h-4 w-4 text-pink-500" />
      default:
        return <File className="h-4 w-4 text-gray-500" />
    }
  }

  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // 获取格式化的文件大小
  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
  }

  // 处理文件/文件夹点击
  const handleItemClick = (file: CloudFile) => {
    if (file.is_folder) {
      navigateToFolder(file.id)
    } else {
      // 下载文件
      window.open(`${API_URL}/api/cloud/files/${file.id}/download`, '_blank')
      toast.success('开始下载')
    }
  }

  // 渲染排序图标
  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 ml-1" />
    }
    
    return sortDirection === 'asc' 
      ? <ChevronUp className="h-4 w-4 ml-1" />
      : <ChevronDown className="h-4 w-4 ml-1" />
  }

  return (
    <div className="overflow-auto">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            <th className="py-3 px-4 text-left font-medium">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded-sm border border-primary"
                  checked={selectedFiles.length === files.length && files.length > 0}
                  onChange={toggleSelectAll}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="font-medium"
                  onClick={() => handleSort('name')}
                >
                  <span>名称</span>
                  {renderSortIcon('name')}
                </Button>
              </div>
            </th>
            <th className="py-3 px-4 text-left font-medium hidden md:table-cell">
              类型
            </th>
            <th className="py-3 px-4 text-left font-medium hidden sm:table-cell">
              <Button
                variant="ghost"
                size="sm"
                className="font-medium"
                onClick={() => handleSort('size')}
              >
                <span>大小</span>
                {renderSortIcon('size')}
              </Button>
            </th>
            <th className="py-3 px-4 text-left font-medium">
              <Button
                variant="ghost"
                size="sm"
                className="font-medium"
                onClick={() => handleSort('created_at')}
              >
                <span>创建时间</span>
                {renderSortIcon('created_at')}
              </Button>
            </th>
            <th className="py-3 px-4 text-left font-medium hidden lg:table-cell">
              <Button
                variant="ghost"
                size="sm"
                className="font-medium"
                onClick={() => handleSort('updated_at')}
              >
                <span>修改时间</span>
                {renderSortIcon('updated_at')}
              </Button>
            </th>
          </tr>
        </thead>
        <tbody>
          {files.map(file => (
            <tr 
              key={file.id}
              className={cn(
                "border-b border-muted/30 hover:bg-muted/30 cursor-pointer transition-colors",
                selectedFiles.includes(file.id) && "bg-muted/40"
              )}
              onClick={() => handleItemClick(file)}
            >
              <td className="py-3 px-4">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded-sm border border-primary"
                    checked={selectedFiles.includes(file.id)}
                    onChange={() => {}}
                    onClick={(e) => toggleSelection(file.id, e)}
                  />
                  <div className="flex items-center space-x-2">
                    {getFileIcon(file)}
                    <span className="truncate max-w-[200px]">{file.name}</span>
                  </div>
                </div>
              </td>
              <td className="py-3 px-4 hidden md:table-cell text-muted-foreground">
                {file.is_folder ? '文件夹' : file.extension}
              </td>
              <td className="py-3 px-4 hidden sm:table-cell text-muted-foreground">
                {file.is_folder ? '-' : formatSize(file.size)}
              </td>
              <td className="py-3 px-4 text-muted-foreground">
                {formatDate(file.created_at)}
              </td>
              <td className="py-3 px-4 hidden lg:table-cell text-muted-foreground">
                {formatDate(file.updated_at)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
} 