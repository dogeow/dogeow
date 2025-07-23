import { Grid, List, FolderTree } from 'lucide-react'
import type { FileView } from '../types'

// 视图配置
export const VIEW_CONFIG: Record<FileView, { icon: typeof Grid; label: string }> = {
  grid: { icon: Grid, label: '网格视图' },
  list: { icon: List, label: '列表视图' },
  tree: { icon: FolderTree, label: '树形视图' },
}

// 文件上传配置
export const UPLOAD_CONFIG = {
  maxFileSize: 100 * 1024 * 1024, // 100MB
  allowedTypes: [
    'image/',
    'video/',
    'audio/',
    'text/',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/zip',
    'application/x-rar-compressed',
    'application/x-7z-compressed',
  ],
}

// 文件类型图标映射
export const FILE_TYPE_ICONS = {
  folder: '📁',
  image: '🖼️',
  video: '🎥',
  audio: '🎵',
  pdf: '📄',
  document: '📝',
  spreadsheet: '📊',
  archive: '📦',
  text: '📝',
  other: '📄',
} as const

// 文件大小单位
export const FILE_SIZE_UNITS = ['B', 'KB', 'MB', 'GB', 'TB'] as const

// 文件大小格式化
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'

  const k = 1024
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + FILE_SIZE_UNITS[i]
}

// 搜索配置
export const SEARCH_CONFIG = {
  debounceDelay: 300, // 搜索防抖延迟
  minQueryLength: 1, // 最小搜索长度
}
