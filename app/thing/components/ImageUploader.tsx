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
      
      // 检查文件大小（最大 10MB）
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`文件 ${file.name} 超过 10MB 限制`)
        return false
      }
      
      return true
    })
    
    if (validFiles.length === 0) return
    
    setIsUploading(true)
    
    // 使用canvas转换图片格式，解决兼容性问题
    const convertImageViaCanvas = (file: File): Promise<File> => {
      return new Promise((resolve, reject) => {
        // 创建文件阅读器
        const reader = new FileReader()
        
        reader.onload = (event) => {
          if (!event.target?.result) {
            return reject(new Error('读取文件失败'))
          }
          
          // 创建图片元素
          const img = document.createElement('img')
          
          img.onload = () => {
            // 创建canvas
            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d')
            
            if (!ctx) {
              return reject(new Error('创建图片上下文失败'))
            }
            
            // 设置canvas尺寸为图片尺寸
            canvas.width = img.width
            canvas.height = img.height
            
            // 在canvas上绘制图片
            ctx.drawImage(img, 0, 0)
            
            // 将canvas内容转换为Blob
            canvas.toBlob((blob) => {
              if (!blob) {
                return reject(new Error('转换图片格式失败'))
              }
              
              // 创建新文件
              const newFile = new File(
                [blob], 
                `photo_${Date.now()}.jpg`, 
                { type: 'image/jpeg', lastModified: Date.now() }
              )
              
              resolve(newFile)
            }, 'image/jpeg', 0.85) // 使用85%的质量
          }
          
          img.onerror = () => {
            reject(new Error('加载图片失败'))
          }
          
          // 设置图片源
          img.src = event.target.result as string
        }
        
        reader.onerror = () => {
          reject(new Error('读取文件失败'))
        }
        
        // 以数据URL的形式读取文件
        reader.readAsDataURL(file)
      })
    }
    
    // 逐个处理图片并上传
    for (const file of validFiles) {
      try {
        // 显示处理中提示
        const toastId = toast.loading(`正在处理 ${file.name}...`)
        
        // 为拍照文件创建副本以规避一些移动设备问题
        let fileToUpload: File
        
        // 尝试检测是否为移动设备拍照
        const isCapturedPhoto = file.name.includes('image') && file.name.includes('.') === false
        
        if (isCapturedPhoto || file.type === 'image/jpeg' || file.name.endsWith('.heic')) {
          // 处理拍照文件，通过canvas转换
          try {
            fileToUpload = await convertImageViaCanvas(file)
            
            console.log('图片通过Canvas转换成功:', { 
              originalName: file.name,
              originalType: file.type,
              newName: fileToUpload.name,
              newType: fileToUpload.type,
              size: fileToUpload.size
            })
          } catch (error) {
            console.error('通过Canvas转换图片失败:', error)
            
            // 失败后尝试使用Blob方法
            try {
              // 使用Blob创建副本
              const blob = await file.arrayBuffer().then(buffer => new Blob([buffer], { type: 'image/jpeg' }))
              
              // 使用随机文件名
              const randomName = `photo_${Date.now()}.jpg`
              
              // 创建File副本
              fileToUpload = new File([blob], randomName, { 
                type: 'image/jpeg',
                lastModified: Date.now() 
              })
              
              console.log('通过Blob方法创建文件副本成功:', { 
                originalName: file.name,
                originalType: file.type,
                newName: fileToUpload.name,
                newType: fileToUpload.type,
                size: fileToUpload.size
              })
            } catch (blobError) {
              console.error('通过Blob创建文件副本失败:', blobError)
              fileToUpload = file // 所有方法失败，使用原文件
            }
          }
        } else {
          // 非拍照图片直接使用
          fileToUpload = file
        }
        
        // 创建FormData
        const formData = new FormData()
        formData.append('image', fileToUpload)
        
        // 更新提示信息
        toast.loading(`正在上传 ${fileToUpload.name}...`, { id: toastId })
        
        // 调用API上传图片
        const result = await apiRequest<UploadedImage>(`/items/upload-temp-image`, 'POST', formData)
        
        // 更新上传的图片列表
        setUploadedImages(prev => [...prev, result])
        
        toast.success(`${file.name} 上传成功`, { id: toastId })
      } catch (error) {
        console.error('上传图片失败:', file.name, error)
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