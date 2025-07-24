import { API_URL } from '@/lib/api'

// 文件相关URL生成函数
export const getFilePreviewUrl = (fileId: number): string =>
  `${API_URL}/api/cloud/files/${fileId}/preview?thumb=true`

export const getFileDownloadUrl = (fileId: number): string =>
  `${API_URL}/api/cloud/files/${fileId}/download`

export const getFileStorageUrl = (path: string): string => `${API_URL}/storage/${path}`
