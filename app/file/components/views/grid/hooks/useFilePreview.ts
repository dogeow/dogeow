import { useState, useCallback } from 'react'
import { toast } from 'react-hot-toast'
import { apiRequest } from '@/lib/api'
import { getFileStorageUrl } from '@/app/file/services/api'
import { PREVIEW_TYPES, type PreviewType } from '../utils/previewTypes'
import type { CloudFile, FilePreviewResponse } from '@/app/file/types'

export const useFilePreview = () => {
  const [previewFile, setPreviewFile] = useState<CloudFile | null>(null)
  const [previewContent, setPreviewContent] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewType, setPreviewType] = useState<PreviewType | null>(null)

  const previewItem = useCallback(async (file: CloudFile) => {
    if (file.is_folder) return

    setPreviewFile(file)
    setPreviewContent(null)
    setPreviewUrl(null)
    setPreviewType(PREVIEW_TYPES.LOADING)

    try {
      if (file.type === 'image') {
        setPreviewType(PREVIEW_TYPES.IMAGE)
        setPreviewUrl(`${getFileStorageUrl(file.path)}?t=${Date.now()}`)
        return
      }

      const response = await apiRequest<FilePreviewResponse>(`/cloud/files/${file.id}/preview`)
      setPreviewType(response.type as PreviewType)

      if (response.type === PREVIEW_TYPES.IMAGE || response.type === PREVIEW_TYPES.PDF) {
        setPreviewUrl(response.url ?? null)
      } else if (response.type === PREVIEW_TYPES.TEXT) {
        setPreviewContent(response.content ?? null)
      } else {
        setPreviewContent(JSON.stringify(response))
      }
    } catch {
      toast.error('预览失败')
      setPreviewType(PREVIEW_TYPES.UNKNOWN)
      setPreviewContent(
        JSON.stringify({
          message: '预览失败，请稍后重试',
          suggestion: '您可以尝试下载文件后查看',
        })
      )
    }
  }, [])

  const closePreview = useCallback(() => {
    setPreviewFile(null)
    setPreviewContent(null)
    setPreviewUrl(null)
    setPreviewType(null)
  }, [])

  return {
    previewFile,
    previewContent,
    previewUrl,
    previewType,
    previewItem,
    closePreview,
  }
}
