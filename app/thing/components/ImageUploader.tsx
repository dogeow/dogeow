import { useState, useCallback, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Upload, X, ImageIcon } from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"
import { API_BASE_URL } from '@/utils/api'
import { apiRequest } from '@/utils/api'

type UploadedImage = {
  path: string;
  thumbnail_path: string;
  url: string;
  thumbnail_url: string;
}

interface ImageUploaderProps {
  onImagesChange: (images: UploadedImage[]) => void;
  existingImages?: UploadedImage[];
  maxImages?: number;
}

export default function ImageUploader({ 
  onImagesChange, 
  existingImages = [], 
  maxImages = 10 
}: ImageUploaderProps) {
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>(existingImages)
  const [isUploading, setIsUploading] = useState(false)
  
  // 验证文件并处理上传
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    
    // 检查是否超过最大图片数量
    if (uploadedImages.length + e.target.files.length > maxImages) {
      toast.error(`最多只能上传${maxImages}张图片`)
      return
    }
    
    const files = Array.from(e.target.files)
    
    // 验证文件
    const validFiles = files.filter(file => {
      // 检查文件是否为图片类型
      if (!file.type.startsWith('image/')) {
        toast.error(`文件 ${file.name} 不是有效的图片格式`)
        return false
      }
      
      // 检查文件大小（最大 10MB）
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`文件 ${file.name} 超过 10MB 限制`)
        return false
      }
      
      return true
    })
    
    if (validFiles.length === 0) return
    
    setIsUploading(true)
    
    // 逐个上传图片
    for (const file of validFiles) {
      try {
        const formData = new FormData()
        formData.append('image', file)
        
        toast.loading(`正在上传 ${file.name}...`)
        
        // 调用API上传图片
        const result = await apiRequest<UploadedImage>(`/items/upload-temp-image`, 'POST', formData)
        
        // 更新上传的图片列表
        setUploadedImages(prev => [...prev, result])
        
        toast.success(`${file.name} 上传成功`)
      } catch (error) {
        console.error('上传图片失败:', error)
        toast.error(error instanceof Error ? error.message : '上传图片失败，请重试')
      }
    }
    
    setIsUploading(false)
    
    // 清空input，允许重复选择相同文件
    e.target.value = ''
  }
  
  // 移除已上传的图片
  const removeImage = useCallback((index: number) => {
    setUploadedImages(prev => {
      const newImages = [...prev]
      newImages.splice(index, 1)
      
      // 通知父组件
      onImagesChange(newImages)
      
      return newImages
    })
  }, [onImagesChange])
  
  // 当图片列表变化时通知父组件
  const notifyParent = useCallback(() => {
    onImagesChange(uploadedImages)
  }, [uploadedImages, onImagesChange])
  
  // 当上传的图片列表变化时，通知父组件
  useEffect(() => {
    notifyParent()
  }, [uploadedImages, notifyParent])
  
  // 渲染图片预览
  const renderImagePreview = (image: UploadedImage, index: number) => (
    <div key={index} className="relative">
      <div className="relative w-24 h-24 rounded-lg overflow-hidden">
        <Image
          src={image.thumbnail_url || `${API_BASE_URL.replace('/api', '')}/storage/${image.thumbnail_path}`}
          alt={`上传的图片 ${index + 1}`}
          fill
          className="object-cover"
          onError={(e) => {
            // 如果缩略图加载失败，尝试加载原图
            const target = e.currentTarget
            target.src = image.url || `${API_BASE_URL.replace('/api', '')}/storage/${image.path}`
            
            // 记录错误
            console.error('缩略图加载失败，尝试使用原图:', {
              thumbnailUrl: image.thumbnail_url,
              originalUrl: image.url,
              path: image.path
            })
          }}
        />
      </div>
      <Button
        type="button"
        variant="destructive"
        size="icon"
        className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
        onClick={() => removeImage(index)}
        disabled={isUploading}
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  )
  
  return (
    <div>
      <div className="flex flex-wrap items-start gap-4">
        <label htmlFor="image-upload" className={`cursor-pointer ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
          <div className="flex flex-col items-center justify-center w-24 h-24 border-2 border-dashed rounded-lg hover:bg-muted/50">
            <Upload className="h-6 w-6 mb-1 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">添加图片</span>
          </div>
          <input
            type="file"
            id="image-upload"
            multiple
            accept="image/*"
            className="hidden"
            onChange={handleImageChange}
            disabled={isUploading || uploadedImages.length >= maxImages}
          />
        </label>
        
        {uploadedImages.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {uploadedImages.map((image, index) => renderImagePreview(image, index))}
          </div>
        )}
        
        {uploadedImages.length === 0 && (
          <div className="flex items-center justify-center w-24 h-24 border border-dashed rounded-lg bg-muted/10">
            <div className="flex flex-col items-center text-muted-foreground">
              <ImageIcon className="h-6 w-6 mb-1" />
              <span className="text-xs">无图片</span>
            </div>
          </div>
        )}
      </div>
      
      {uploadedImages.length > 0 && (
        <p className="text-xs text-muted-foreground mt-2">
          已上传 {uploadedImages.length}/{maxImages} 张图片
        </p>
      )}
    </div>
  )
} 