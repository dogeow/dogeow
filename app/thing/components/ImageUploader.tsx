import { useState, useCallback, useEffect, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Upload, X, ImageIcon } from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"
import { API_URL, getImageUrl } from '@/utils/api'
import { apiRequest, logErrorToServer } from '@/utils/api'

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
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // 验证文件并处理上传
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    
    // 检查是否超过最大图片数量
    if (uploadedImages.length + e.target.files.length > maxImages) {
      toast.error(`最多只能上传${maxImages}张图片`)
      return
    }
    
    const files = Array.from(e.target.files)
    console.log('选择的文件:', files.map(file => ({
      name: file.name,
      type: file.type,
      size: file.size,
      lastModified: new Date(file.lastModified).toISOString()
    })))
    
    // 验证文件
    const validFiles = files.filter(file => {
      // 检查文件是否为图片类型
      if (!file.type.startsWith('image/')) {
        toast.error(`文件 ${file.name} 不是有效的图片格式`)
        return false
      }
      
      return true
    })
    
    if (validFiles.length === 0) return
    
    setIsUploading(true)
    
    const processFileBatch = async (filesToProcess: File[]): Promise<UploadedImage[]> => {
      const results: UploadedImage[] = []
      
      // 限制并发上传数量
      const maxConcurrent = 2
      
      // 分批处理文件
      for (let i = 0; i < filesToProcess.length; i += maxConcurrent) {
        const batch = filesToProcess.slice(i, i + maxConcurrent)
        const batchPromises = batch.map(file => processFile(file))
        
        // 等待当前批次完成
        const batchResults = await Promise.allSettled(batchPromises)
        
        // 收集成功的结果
        batchResults.forEach(result => {
          if (result.status === 'fulfilled') {
            results.push(result.value)
          }
        })
      }
      
      return results
    }
    
    // 处理单个文件
    const processFile = async (file: File): Promise<UploadedImage> => {
      try {
        // 显示处理中提示
        const toastId = toast.loading(`正在处理 ${file.name}...`)
        
        // 记录文件信息
        logErrorToServer('file_processing_start', '开始处理文件', {
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size
        })
        
        // 创建FormData
        const formData = new FormData()
        formData.append('image', file)
        
        // 更新提示信息
        toast.loading(`正在上传 ${file.name}...`, { id: toastId })
        
        // 添加重试逻辑
        let retries = 0
        const maxRetries = 2
        let result: UploadedImage | null = null
        
        while (retries <= maxRetries && !result) {
          try {
            // 调用API上传图片
            result = await apiRequest<UploadedImage>(`/items/upload-temp-image`, 'POST', formData)
            break
          } catch (uploadError) {
            retries++
            console.error(`上传尝试 ${retries}/${maxRetries} 失败:`, uploadError)
            
            // 记录上传失败到服务器
            logErrorToServer('api_upload_retry', `上传尝试 ${retries}/${maxRetries} 失败`, {
              fileName: file.name,
              fileType: file.type,
              fileSize: file.size,
              retryCount: retries,
              maxRetries: maxRetries,
              error: uploadError instanceof Error ? uploadError.message : String(uploadError)
            })
            
            if (retries <= maxRetries) {
              toast.loading(`上传失败，正在重试 (${retries}/${maxRetries})...`, { id: toastId })
              // 等待一小段时间再重试
              await new Promise(resolve => setTimeout(resolve, 1000))
            } else {
              toast.error('上传失败，请检查网络连接后重试', { id: toastId })
              throw uploadError
            }
          }
        }
        
        if (!result) {
          throw new Error('上传失败，已达到最大重试次数')
        }
        
        toast.success(`${file.name} 上传成功`, { id: toastId })
        return result
      } catch (error) {
        console.error('上传图片失败:', file.name, error)
        
        // 记录整体上传失败到服务器
        logErrorToServer('file_upload_failure', '上传图片失败', {
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          error: error instanceof Error ? error.message : String(error)
        })
        
        toast.error(error instanceof Error ? error.message : '上传图片失败，请重试')
        throw error
      }
    }
    
    try {
      // 批量处理文件
      const newImages = await processFileBatch(validFiles)
      
      // 更新上传的图片列表
      setUploadedImages(prev => [...prev, ...newImages])
      
      // 重置input元素以确保相同文件可以重复上传
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      console.error('批量处理图片失败:', error)
      
      // 记录批量处理失败到服务器
      logErrorToServer('batch_processing_error', '批量处理图片失败', {
        fileCount: validFiles.length,
        error: error instanceof Error ? error.message : String(error)
      })
      
    } finally {
      setIsUploading(false)
    }
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
          src={image.thumbnail_url || getImageUrl(image.thumbnail_path)}
          alt={`上传的图片 ${index + 1}`}
          fill
          className="object-cover"
          onError={(e) => {
            // 如果缩略图加载失败，尝试加载原图
            const target = e.currentTarget
            target.src = image.url || getImageUrl(image.path)
            
            // 记录错误
            console.error('缩略图加载失败，尝试使用原图:', {
              thumbnailUrl: image.thumbnail_url,
              originalUrl: image.url,
              path: image.path
            })
          }}
          unoptimized={true} // 防止Next.js优化处理图片URL
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
            ref={fileInputRef}
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