import React, { memo, useState, useRef } from 'react'
import Image from 'next/image'
import {
  File,
  FileText,
  FileArchive,
  FileAudio,
  FileVideo,
  FileType,
  FileSpreadsheet,
  Folder,
} from 'lucide-react'
import { cn } from '@/lib/helpers'
import { TREE_CONSTANTS } from '../constants'
import { getFilePreviewUrl } from '../../../../services/api'
import type { CloudFile } from '../../../../types'

const FILE_TYPE_ICONS = {
  pdf: { icon: FileType, color: 'text-red-500' },
  document: { icon: FileText, color: 'text-green-500' },
  spreadsheet: { icon: FileSpreadsheet, color: 'text-green-500' },
  archive: { icon: FileArchive, color: 'text-orange-500' },
  audio: { icon: FileAudio, color: 'text-purple-500' },
  video: { icon: FileVideo, color: 'text-pink-500' },
} as const

interface FileIconProps {
  file: CloudFile
  className?: string
}

export const FileIcon = memo<FileIconProps>(({ file, className }) => {
  const [imageError, setImageError] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  if (file.is_folder) {
    return <Folder className={cn(TREE_CONSTANTS.ICON_SIZE, 'text-yellow-500', className)} />
  }

  if (file.type === 'image' && !imageError) {
    return (
      <div
        className={cn(
          'bg-muted relative flex h-5 w-5 items-center justify-center overflow-hidden rounded-sm',
          className
        )}
      >
        <Image
          ref={imgRef}
          src={getFilePreviewUrl(file.id)}
          alt={file.name}
          width={TREE_CONSTANTS.PREVIEW_SIZE.width}
          height={TREE_CONSTANTS.PREVIEW_SIZE.height}
          className="h-full w-full object-cover"
          onError={() => setImageError(true)}
          loading="lazy"
          sizes="20px"
        />
      </div>
    )
  }

  const fileTypeConfig = FILE_TYPE_ICONS[file.type as keyof typeof FILE_TYPE_ICONS]
  if (fileTypeConfig) {
    const { icon: IconComponent, color } = fileTypeConfig
    return <IconComponent className={cn(TREE_CONSTANTS.ICON_SIZE, color, className)} />
  }

  return <File className={cn(TREE_CONSTANTS.ICON_SIZE, 'text-gray-500', className)} />
})

FileIcon.displayName = 'FileIcon'
