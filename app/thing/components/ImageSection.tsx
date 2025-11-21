import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { UploadedImage } from '../types'
import ImageUploader from './ImageUploader'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { AlertCircle } from 'lucide-react'

interface ImageSectionProps {
  uploadedImages: UploadedImage[]
  setUploadedImages: React.Dispatch<React.SetStateAction<UploadedImage[]>>
}

const ImageSection = ({ uploadedImages, setUploadedImages }: ImageSectionProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>图片</CardTitle>
        <CardDescription>编辑物品的图片</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Label>物品图片</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="查看上传说明"
                  >
                    <AlertCircle className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-xs">
                    支持JPG、PNG、GIF格式，每张图片不超过20MB，最多上传10 张。点击图片可设为主图。
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <ImageUploader
            onImagesChange={setUploadedImages}
            existingImages={uploadedImages}
            maxImages={10}
          />
        </div>
      </CardContent>
    </Card>
  )
}

export default ImageSection
