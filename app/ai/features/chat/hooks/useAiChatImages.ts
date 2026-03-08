'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

export interface ImageItem {
  id: string
  preview: string
  url?: string
  uploading?: boolean
}

interface UseAiChatImagesOptions {
  enabled: boolean
  maxImageCount?: number
  uploadImage: (file: File) => Promise<string>
}

interface UseAiChatImagesReturn {
  images: ImageItem[]
  hasImages: boolean
  isUploadingImages: boolean
  handleImageSelect: (files: FileList | null) => void
  removeImage: (index: number) => void
  clearImages: () => void
}

const DEFAULT_MAX_IMAGE_COUNT = 5

export function useAiChatImages({
  enabled,
  maxImageCount = DEFAULT_MAX_IMAGE_COUNT,
  uploadImage,
}: UseAiChatImagesOptions): UseAiChatImagesReturn {
  const [images, setImages] = useState<ImageItem[]>([])
  const imagesRef = useRef<ImageItem[]>([])

  useEffect(() => {
    imagesRef.current = images
  }, [images])

  const revokePreview = useCallback((preview: string) => {
    if (preview.startsWith('blob:')) {
      URL.revokeObjectURL(preview)
    }
  }, [])

  const clearImages = useCallback(() => {
    setImages(prev => {
      if (prev.length === 0) {
        return prev
      }

      prev.forEach(item => revokePreview(item.preview))
      return []
    })
  }, [revokePreview])

  useEffect(() => {
    return () => {
      imagesRef.current.forEach(item => revokePreview(item.preview))
    }
  }, [revokePreview])

  const handleImageSelect = useCallback(
    (files: FileList | null) => {
      if (!files || !enabled) return

      const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'))
      const remainingSlots = Math.max(0, maxImageCount - images.length)

      if (imageFiles.length > remainingSlots) {
        toast.warning(`最多只能上传 ${remainingSlots} 张图片`)
      }

      const filesToProcess = imageFiles.slice(0, remainingSlots)

      filesToProcess.forEach(file => {
        const id = `img-${Date.now()}-${Math.random().toString(36).slice(2)}`
        const preview = URL.createObjectURL(file)

        setImages(prev => [...prev, { id, preview, uploading: true }])

        uploadImage(file)
          .then(url => {
            setImages(prev =>
              prev.map(item => (item.id === id ? { ...item, url, uploading: false } : item))
            )
          })
          .catch(error => {
            revokePreview(preview)
            toast.error(error instanceof Error ? error.message : '图片上传失败')
            setImages(prev => prev.filter(item => item.id !== id))
          })
      })
    },
    [enabled, images.length, maxImageCount, revokePreview, uploadImage]
  )

  const removeImage = useCallback(
    (index: number) => {
      setImages(prev => {
        const item = prev[index]
        if (item) {
          revokePreview(item.preview)
        }

        return prev.filter((_, currentIndex) => currentIndex !== index)
      })
    },
    [revokePreview]
  )

  const hasImages = images.length > 0
  const isUploadingImages = images.some(item => item.uploading)

  return {
    images,
    hasImages,
    isUploadingImages,
    handleImageSelect,
    removeImage,
    clearImages,
  }
}
