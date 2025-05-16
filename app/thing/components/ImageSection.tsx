import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { UploadedImage } from "../types"
import ImageUploader from './ImageUploader'

interface ImageSectionProps {
  uploadedImages: UploadedImage[];
  setUploadedImages: React.Dispatch<React.SetStateAction<UploadedImage[]>>;
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
          <Label>物品图片</Label>
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