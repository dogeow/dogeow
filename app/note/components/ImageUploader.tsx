import React, { useState, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { ImageIcon, X, Upload } from "lucide-react"
import { toast } from "react-hot-toast"
import { apiRequest } from '@/utils/api'

export interface NoteUploadedImage {
  path: string;
  thumbnail_path: string;
  url: string;
  thumbnail_url: string;
}

interface NoteImageUploaderProps {
  onImageUploaded: (imageUrl: string) => void;
}

const NoteImageUploader: React.FC<NoteImageUploaderProps> = ({
  onImageUploaded
}) => {
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // 处理文件选择
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    
    setUploading(true)
    
    // 准备上传表单数据
    const formData = new FormData()
    Array.from(files).forEach(file => {
      formData.append('images[]', file)
    })
    
    try {
      // 调用上传API
      const response = await apiRequest<NoteUploadedImage[]>('/upload/images', 'POST', formData)
      
      if (response && response.length > 0) {
        // 向编辑器添加图片
        onImageUploaded(response[0].url)
        toast.success('图片上传成功')
      }
      
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
  
  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-9 w-9"
        title="插入图片"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
      >
        {uploading ? (
          <svg className="animate-spin h-5 w-5 text-muted-foreground" viewBox="0 0 24 24">
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
        ) : (
          <ImageIcon className="h-5 w-5" />
        )}
      </Button>
      
      <input
        type="file"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*"
      />
    </>
  )
}

export default NoteImageUploader 