import React, { useState, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Upload, X } from "lucide-react"
import { toast } from "sonner"
import { UploadedImage } from "../types"
import { apiRequest } from '@/utils/api'

interface ImageUploaderProps {
  onImagesChange: (images: UploadedImage[]) => void;
  existingImages?: UploadedImage[];
  maxImages?: number;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
  onImagesChange,
  existingImages = [],
  maxImages = 10
}) => {
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [images, setImages] = useState<UploadedImage[]>(existingImages)
  
  // 处理文件选择
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    
    // 检查文件数量限制
    if (images.length + files.length > maxImages) {
      toast.error(`最多只能上传${maxImages}张图片`)
      return
    }
    
    setUploading(true)
    
    // 准备上传表单数据
    const formData = new FormData()
    Array.from(files).forEach(file => {
      formData.append('images[]', file)
    })
    
    try {
      // 调用上传API
      const response = await apiRequest<UploadedImage[]>('/upload/images', 'POST', formData)
      
      // 更新图片列表
      const newImages = [...images, ...response]
      setImages(newImages)
      onImagesChange(newImages)
      
      toast.success('图片上传成功')
      // 清空文件输入框，以便可以重复选择相同的文件
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      toast.error('图片上传失败')
      console.error('上传图片失败:', error)
    } finally {
      setUploading(false)
    }
  }
  
  // 移除图片
  const removeImage = (index: number) => {
    const newImages = [...images]
    newImages.splice(index, 1)
    setImages(newImages)
    onImagesChange(newImages)
  }
  
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {images.map((image, index) => (
          <div key={index} className="relative group aspect-square">
            <img
              src={image.thumbnail_url || image.url}
              alt={`Uploaded ${index + 1}`}
              className="w-full h-full object-cover rounded-md border"
            />
            <button
              onClick={() => removeImage(index)}
              className="absolute top-2 right-2 bg-black/70 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              type="button"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
        
        {images.length < maxImages && (
          <Button
            type="button"
            variant="outline"
            className="w-full h-full aspect-square flex flex-col items-center justify-center border-dashed"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <div className="flex flex-col items-center">
                <svg className="animate-spin h-6 w-6 text-muted-foreground mb-2" viewBox="0 0 24 24">
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
                <Upload className="h-8 w-8 mb-2 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">上传图片</span>
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
      
      <p className="text-xs text-muted-foreground">
        支持JPG、PNG、GIF格式，每张图片不超过5MB，最多上传{maxImages}张
      </p>
    </div>
  )
}

export default ImageUploader 