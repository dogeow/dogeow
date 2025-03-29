'use client'

import { useContext } from 'react'
import {
  File,
  FileText,
  FileImage,
  FileArchive,
  FileAudio,
  FileVideo,
  FileType,
  FileSpreadsheet,
  Folder,
  ArrowUpDown,
  Download,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'react-hot-toast'
import axios from 'axios'
import { useSWRConfig } from 'swr'
import { cn } from '@/lib/utils'
import FileContext from '../../context/FileContext'
import { CloudFile, SortField } from '../../types'

// 后端API基础URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

interface ListViewProps {
  files: CloudFile[]
}

export default function ListView({ files }: ListViewProps) {
  const { mutate } = useSWRConfig()
  const { 
    currentFolderId, 
    navigateToFolder, 
    selectedFiles, 
    setSelectedFiles,
    sortField,
    sortDirection,
    handleSort
  } = useContext(FileContext)

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

  // 获取文件图标
  const getFileIcon = (file: CloudFile) => {
    if (file.is_folder) return <Folder className="h-4 w-4 text-yellow-500" />
    
    switch (file.type) {
      case 'image':
        return <FileImage className="h-4 w-4 text-blue-500" />
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
      window.open(`${API_BASE_URL}/cloud/files/${file.id}/download`, '_blank')
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