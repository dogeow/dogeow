'use client'

import React, { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Upload, X } from 'lucide-react'
import { toast } from 'sonner'
import { UploadedImage } from '../types'
import useSWRMutation from 'swr/mutation'
import { post } from '@/lib/api'
import Image from 'next/image'

interface ImageUploaderProps {
  onImagesChange: (images: UploadedImage[]) => void
  existingImages?: UploadedImage[]
  maxImages?: number
  maxSize?: number // 单位：MB
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
  onImagesChange,
  existingImages = [],
  maxImages = 10,
  maxSize = 20,
}) => {
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [images, setImages] = useState<UploadedImage[]>(existingImages)

  const { trigger: uploadImages } = useSWRMutation(
    '/upload/images',
    async (url, { arg }: { arg: FormData }) => {
      return post<UploadedImage[]>(url, arg)
    }
  )

  // 处理文件选择
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    // 检查文件数量限制
    if (images.length + files.length > maxImages) {
      toast.error(`最多只能上传${maxImages}张图片`)
      return
    }

    // 检查文件大小
    const oversizedFiles = Array.from(files).filter(file => file.size > maxSize * 1024 * 1024)
    if (oversizedFiles.length > 0) {
      toast.error(`有${oversizedFiles.length}个文件超过${maxSize}MB限制`)
      return
    }

    setUploading(true)

    // 先同步当前图片到父组件，防止父组件丢失旧图片
    onImagesChange(images)

    // 准备上传表单数据
    const formData = new FormData()
    Array.from(files).forEach(file => {
      formData.append('images[]', file)
    })

    try {
      // 调用上传API
      const response = await uploadImages(formData)

      // 更新图片列表
      const newImages = [...images, ...response]
      setImages(newImages)
      onImagesChange(newImages)

      toast.success('图片上传成功')
    } catch (error) {
      toast.error('图片上传失败')
      console.error('上传图片失败:', error)
    } finally {
      setUploading(false)
      // 清空文件输入框，以便可以重复选择相同的文件
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // 移除图片
  const removeImage = (index: number) => {
    const newImages = [...images]
    newImages.splice(index, 1)
    setImages(newImages)
    onImagesChange(newImages)
  }

  // 设置主图
  const setPrimaryImage = (index: number) => {
    const newImages = images.map((img, idx) => ({
      ...img,
      is_primary: idx === index,
    }))
    setImages(newImages)
    onImagesChange(newImages)
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {images.map((image, index) => (
          <div key={index} className="group relative aspect-square">
            <Image
              src={image.thumbnail_url || image.url}
              alt={`上传图片 ${index + 1}`}
              fill
              className={`rounded-md border object-cover ${image.is_primary ? 'ring-primary ring-2' : ''}`}
              onClick={() => setPrimaryImage(index)}
              style={{ objectFit: 'cover' }}
            />
            {image.is_primary && (
              <div className="bg-primary absolute top-2 left-2 rounded-md px-2 py-1 text-xs text-white">
                主图
              </div>
            )}
            <button
              onClick={() => removeImage(index)}
              className="absolute top-2 right-2 z-10 rounded-full bg-black/70 p-1 text-white opacity-100 transition-colors hover:bg-red-600 hover:text-white"
              type="button"
              aria-label="删除图片"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}

        {images.length < maxImages && (
          <Button
            type="button"
            variant="outline"
            className="flex aspect-square h-full w-full flex-col items-center justify-center border-dashed"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <div className="flex flex-col items-center">
                <svg
                  className="text-muted-foreground mb-2 h-6 w-6 animate-spin"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <span className="text-xs">上传中...</span>
              </div>
            ) : (
              <>
                <Upload className="text-muted-foreground mb-2 h-8 w-8" />
                <span className="text-muted-foreground text-xs">上传图片</span>
              </>
            )}
          </Button>
        )}
      </div>

      <input
        type="file"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*"
        multiple
      />

      <p className="text-muted-foreground text-xs">
        支持JPG、PNG、GIF格式，每张图片不超过{maxSize}MB，最多上传{maxImages}
        张。点击图片可设为主图。
      </p>
    </div>
  )
}

export default ImageUploader
