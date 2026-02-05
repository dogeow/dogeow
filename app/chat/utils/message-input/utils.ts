import { MAX_FILE_SIZE, ALLOWED_IMAGE_TYPES } from './constants'

// 文件相关工具函数
export const validateFileSize = (file: File): boolean => {
  return file.size <= MAX_FILE_SIZE
}

export const isImageFile = (file: File): boolean => {
  return ALLOWED_IMAGE_TYPES.includes(file.type)
}

export const createFilePreview = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = e => {
      const result = e.target?.result
      if (typeof result === 'string') {
        resolve(result)
      } else {
        reject(new Error('Failed to read file as data URL'))
      }
    }
    reader.onerror = () => reject(new Error('File reading failed'))
    reader.readAsDataURL(file)
  })
}

export const sanitizeFileName = (fileName: string): string => {
  // 移除潜在的危险字符
  return fileName.replace(/[^\w\s.-]/g, '').trim()
}

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 消息相关工具函数
export const getDraftKey = (roomId: number): string => `chat-draft-${roomId}`

export const truncateMessage = (message: string, maxLength: number = 50): string => {
  return message.length > maxLength ? `${message.slice(0, maxLength)}...` : message
}
