export type FileView = 'grid' | 'list' | 'tree'
export type SortField = 'name' | 'size' | 'created_at' | 'updated_at'
export type SortDirection = 'asc' | 'desc'
export type FileType = 'folder' | 'image' | 'pdf' | 'document' | 'spreadsheet' | 'archive' | 'audio' | 'video' | 'other'

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

export interface FileStatistics {
  total_size: number
  human_readable_size: string
  file_count: number
  folder_count: number
  files_by_type: {
    file_type: string
    count: number
    total_size: number
  }[]
}

export interface FolderNode {
  id: number
  name: string
  children: FolderNode[]
}

export interface FilePreviewResponse {
  type: 'image' | 'pdf' | 'text' | 'video' | 'audio' | 'other'
  content?: string | null
  url?: string | null
} 