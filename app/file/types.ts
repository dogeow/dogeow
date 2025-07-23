// 文件视图类型
export type FileView = 'grid' | 'list' | 'tree'

// 排序字段
export type SortField = 'name' | 'size' | 'created_at' | 'updated_at'

// 排序方向
export type SortDirection = 'asc' | 'desc'

// 文件类型枚举
export type FileType =
  | 'folder'
  | 'image'
  | 'pdf'
  | 'document'
  | 'spreadsheet'
  | 'archive'
  | 'audio'
  | 'video'
  | 'other'

// 预览类型
export type PreviewType =
  | 'image'
  | 'pdf'
  | 'text'
  | 'video'
  | 'audio'
  | 'document'
  | 'unknown'
  | 'other'

// 云文件接口
export interface CloudFile {
  id: number
  name: string
  original_name: string | null
  path: string
  mime_type: string | null
  extension: string | null
  size: number
  parent_id: number | null
  user_id: number
  is_folder: boolean
  description: string | null
  created_at: string
  updated_at: string
  type: FileType
}

// 文件类型统计
export interface FileTypeStatistic {
  file_type: string
  count: number
  total_size: number
}

// 文件统计信息
export interface FileStatistics {
  total_size: number
  human_readable_size: string
  file_count: number
  folder_count: number
  files_by_type: FileTypeStatistic[]
}

// 文件夹树节点
export interface FolderNode {
  id: number
  name: string
  children: FolderNode[]
}

// 文件预览响应
export interface FilePreviewResponse {
  type: PreviewType
  content?: string | null
  url?: string | null
  message?: string
  suggestion?: string
}

// 文件上传进度
export interface FileUploadProgress {
  file: File
  progress: number
  status: 'pending' | 'uploading' | 'success' | 'error'
  error?: string
}

// 文件操作类型
export type FileOperation = 'copy' | 'move' | 'delete' | 'rename' | 'download'

// 文件选择状态
export interface FileSelection {
  selectedFiles: Set<number>
  isAllSelected: boolean
}

// 文件搜索参数
export interface FileSearchParams {
  query?: string
  type?: FileType
  parent_id?: number | null
  sort_field?: SortField
  sort_direction?: SortDirection
}
