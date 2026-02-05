import { useState, useCallback } from 'react'
import { toast } from '@/components/ui/use-toast'
import { useTranslation } from '@/hooks/useTranslation'
import {
  validateFileSize,
  isImageFile,
  createFilePreview,
  sanitizeFileName,
  formatFileSize,
} from '@/app/chat/utils/message-input/utils'
import { MAX_FILE_SIZE } from '@/app/chat/utils/message-input/constants'
import type { UploadedFile } from '@/app/chat/types/messageInput'

export function useFileUpload() {
  const { t } = useTranslation()
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])

  // 处理文件上传
  const handleFileUpload = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return

      // 检查文件数量限制
      const maxFiles = 5
      if (files.length > maxFiles) {
        toast.error(
          t('chat.too_many_files', 'Too many files. Maximum {count} files allowed.').replace(
            '{count}',
            maxFiles.toString()
          )
        )
        return
      }

      const newFiles: UploadedFile[] = []
      const errors: string[] = []

      for (const file of files) {
        // 检查文件大小
        if (!validateFileSize(file)) {
          errors.push(
            t('chat.file_too_large', 'File {name} is too large. Maximum size is {size}.')
              .replace('{name}', sanitizeFileName(file.name))
              .replace('{size}', formatFileSize(MAX_FILE_SIZE))
          )
          continue
        }

        // 检查文件名
        const sanitizedName = sanitizeFileName(file.name)
        if (!sanitizedName) {
          errors.push(
            t('chat.invalid_filename', 'Invalid filename: {name}').replace('{name}', file.name)
          )
          continue
        }

        try {
          if (isImageFile(file)) {
            const preview = await createFilePreview(file)
            newFiles.push({
              file,
              preview,
              type: 'image',
            })
          } else {
            newFiles.push({
              file,
              preview: '',
              type: 'file',
            })
          }
        } catch (error) {
          console.error('Error processing file:', file.name, error)
          errors.push(
            t('chat.file_processing_error', 'Error processing file {name}').replace(
              '{name}',
              sanitizeFileName(file.name)
            )
          )
        }
      }

      // 显示错误信息
      if (errors.length > 0) {
        errors.forEach(error => toast.error(error))
      }

      // 添加成功处理的文件
      if (newFiles.length > 0) {
        setUploadedFiles(prev => {
          const totalFiles = prev.length + newFiles.length
          if (totalFiles > maxFiles) {
            toast.error(
              t(
                'chat.file_limit_reached',
                'File limit reached. Maximum {count} files allowed.'
              ).replace('{count}', maxFiles.toString())
            )
            return prev
          }
          return [...prev, ...newFiles]
        })
      }
    },
    [t]
  )

  // 移除文件
  const removeFile = useCallback((index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }, [])

  // 清空文件
  const clearFiles = useCallback(() => {
    setUploadedFiles([])
  }, [])

  return {
    uploadedFiles,
    handleFileUpload,
    removeFile,
    clearFiles,
  }
}
