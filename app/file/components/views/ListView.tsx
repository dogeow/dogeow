'use client'

import Image from 'next/image'
import { useMemo, useCallback } from 'react'

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
import { getFileDownloadUrl, getFilePreviewUrl } from '@/lib/api'
import { formatFileSize } from '../../constants'

interface ListViewProps {
  files: CloudFile[]
}

// 文件图标映射
const FILE_ICONS = {
  pdf: { icon: FileType, color: 'text-red-500' },
  document: { icon: FileText, color: 'text-green-500' },
  spreadsheet: { icon: FileSpreadsheet, color: 'text-green-500' },
  archive: { icon: FileArchive, color: 'text-orange-500' },
  audio: { icon: FileAudio, color: 'text-purple-500' },
  video: { icon: FileVideo, color: 'text-pink-500' },
} as const

// 排序图标组件
const SortIcon = ({
  field,
  currentField,
  direction,
}: {
  field: SortField
  currentField: SortField
  direction: 'asc' | 'desc'
}) => {
  if (field !== currentField) {
    return <ArrowUpDown className="ml-1 h-4 w-4" />
  }

  return direction === 'asc' ? (
    <ChevronUp className="ml-1 h-4 w-4" />
  ) : (
    <ChevronDown className="ml-1 h-4 w-4" />
  )
}

// 文件图标组件
const FileIcon = ({ file }: { file: CloudFile }) => {
  const handleImageError = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.currentTarget
    target.style.display = 'none'

    const parent = target.parentElement
    if (parent) {
      parent.classList.add('flex')
      const fallbackIcon = document.createElement('div')
      fallbackIcon.className = 'flex items-center justify-center'
      fallbackIcon.innerHTML =
        '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4 text-blue-500"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline><circle cx="10" cy="13" r="2"></circle><path d="m20 17-1.09-1.09a2 2 0 0 0-2.82 0L10 22"></path></svg>'
      parent.appendChild(fallbackIcon)
    }
  }, [])

  if (file.is_folder) {
    return <Folder className="h-4 w-4 text-yellow-500" />
  }

  // 图片文件显示缩略图
  if (file.type === 'image') {
    return (
      <div className="bg-muted relative flex h-6 w-6 items-center justify-center overflow-hidden rounded-sm">
        <Image
          src={getFilePreviewUrl(file.id)}
          alt={file.name}
          width={24}
          height={24}
          className="h-full w-full object-cover"
          onError={handleImageError}
        />
      </div>
    )
  }

  // 其他文件类型显示对应图标
  const iconConfig = FILE_ICONS[file.type as keyof typeof FILE_ICONS]
  if (iconConfig) {
    const IconComponent = iconConfig.icon
    return <IconComponent className={`h-4 w-4 ${iconConfig.color}`} />
  }

  return <File className="h-4 w-4 text-gray-500" />
}

// 工具函数
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function ListView({ files }: ListViewProps) {
  const {
    navigateToFolder,
    selectedFiles,
    setSelectedFiles,
    sortField,
    sortDirection,
    handleSort,
  } = useFileStore()

  // 计算是否全选
  const isAllSelected = useMemo(
    () => files.length > 0 && selectedFiles.length === files.length,
    [files.length, selectedFiles.length]
  )

  // 切换选择文件
  const toggleSelection = useCallback(
    (fileId: number, event: React.MouseEvent) => {
      event.stopPropagation()

      if (selectedFiles.includes(fileId)) {
        setSelectedFiles(selectedFiles.filter(id => id !== fileId))
      } else {
        setSelectedFiles([...selectedFiles, fileId])
      }
    },
    [selectedFiles, setSelectedFiles]
  )

  // 全选/取消全选
  const toggleSelectAll = useCallback(() => {
    setSelectedFiles(isAllSelected ? [] : files.map(file => file.id))
  }, [isAllSelected, files, setSelectedFiles])

  // 处理文件/文件夹点击
  const handleItemClick = useCallback(
    (file: CloudFile) => {
      if (file.is_folder) {
        navigateToFolder(file.id)
      } else {
        // 下载文件
        window.open(getFileDownloadUrl(file.id), '_blank')
        toast.success('开始下载')
      }
    },
    [navigateToFolder]
  )

  // 处理键盘事件
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent, file: CloudFile) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        handleItemClick(file)
      }
    },
    [handleItemClick]
  )

  return (
    <div className="overflow-auto">
      <table className="w-full text-sm" role="grid" aria-label="文件列表">
        <thead className="bg-muted/50">
          <tr>
            <th className="px-4 py-3 text-left font-medium" scope="col">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  className="border-primary h-4 w-4 rounded-sm border"
                  checked={isAllSelected}
                  onChange={toggleSelectAll}
                  aria-label="全选文件"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="font-medium"
                  onClick={() => handleSort('name')}
                  aria-label={`按名称排序，当前排序：${sortField === 'name' ? sortDirection : '无'}`}
                >
                  <span>名称</span>
                  <SortIcon field="name" currentField={sortField} direction={sortDirection} />
                </Button>
              </div>
            </th>
            <th className="hidden px-4 py-3 text-left font-medium md:table-cell" scope="col">
              类型
            </th>
            <th className="hidden px-4 py-3 text-left font-medium sm:table-cell" scope="col">
              <Button
                variant="ghost"
                size="sm"
                className="font-medium"
                onClick={() => handleSort('size')}
                aria-label={`按大小排序，当前排序：${sortField === 'size' ? sortDirection : '无'}`}
              >
                <span>大小</span>
                <SortIcon field="size" currentField={sortField} direction={sortDirection} />
              </Button>
            </th>
            <th className="px-4 py-3 text-left font-medium" scope="col">
              <Button
                variant="ghost"
                size="sm"
                className="font-medium"
                onClick={() => handleSort('created_at')}
                aria-label={`按创建时间排序，当前排序：${sortField === 'created_at' ? sortDirection : '无'}`}
              >
                <span>创建时间</span>
                <SortIcon field="created_at" currentField={sortField} direction={sortDirection} />
              </Button>
            </th>
            <th className="hidden px-4 py-3 text-left font-medium lg:table-cell" scope="col">
              <Button
                variant="ghost"
                size="sm"
                className="font-medium"
                onClick={() => handleSort('updated_at')}
                aria-label={`按修改时间排序，当前排序：${sortField === 'updated_at' ? sortDirection : '无'}`}
              >
                <span>修改时间</span>
                <SortIcon field="updated_at" currentField={sortField} direction={sortDirection} />
              </Button>
            </th>
          </tr>
        </thead>
        <tbody>
          {files.map(file => (
            <tr
              key={file.id}
              className={cn(
                'border-muted/30 hover:bg-muted/30 cursor-pointer border-b transition-colors',
                selectedFiles.includes(file.id) && 'bg-muted/40'
              )}
              onClick={() => handleItemClick(file)}
              onKeyDown={e => handleKeyDown(e, file)}
              tabIndex={0}
              role="row"
              aria-selected={selectedFiles.includes(file.id)}
            >
              <td className="px-4 py-3" role="gridcell">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    className="border-primary h-4 w-4 rounded-sm border"
                    checked={selectedFiles.includes(file.id)}
                    onChange={() => {}}
                    onClick={e => toggleSelection(file.id, e)}
                    aria-label={`选择文件 ${file.name}`}
                  />
                  <div className="flex items-center space-x-2">
                    <FileIcon file={file} />
                    <span className="max-w-[200px] truncate" title={file.name}>
                      {file.name}
                    </span>
                  </div>
                </div>
              </td>
              <td className="text-muted-foreground hidden px-4 py-3 md:table-cell" role="gridcell">
                {file.is_folder ? '文件夹' : file.extension}
              </td>
              <td className="text-muted-foreground hidden px-4 py-3 sm:table-cell" role="gridcell">
                {file.is_folder ? '-' : formatFileSize(file.size)}
              </td>
              <td className="text-muted-foreground px-4 py-3" role="gridcell">
                {formatDate(file.created_at)}
              </td>
              <td className="text-muted-foreground hidden px-4 py-3 lg:table-cell" role="gridcell">
                {formatDate(file.updated_at)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
