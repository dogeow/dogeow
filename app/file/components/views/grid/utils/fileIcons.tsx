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
import Image from 'next/image'
import { getFileStorageUrl } from '@/app/file/services/api'
import type { CloudFile } from '@/app/file/types'

export const FILE_TYPE_ICONS = {
  pdf: { icon: FileType, color: 'text-red-500' },
  document: { icon: FileText, color: 'text-green-500' },
  spreadsheet: { icon: FileSpreadsheet, color: 'text-green-500' },
  archive: { icon: FileArchive, color: 'text-orange-500' },
  audio: { icon: FileAudio, color: 'text-purple-500' },
  video: { icon: FileVideo, color: 'text-pink-500' },
  default: { icon: File, color: 'text-gray-500' },
} as const

// 在模块加载时设置时间戳，用于图片缓存控制
const IMAGE_TIMESTAMP = Date.now()

interface FileIconProps {
  file: CloudFile
}

export const FileIcon = ({ file }: FileIconProps) => {
  const imageTimestamp = IMAGE_TIMESTAMP

  if (file.is_folder) {
    return <Folder className="h-12 w-12 text-yellow-500" />
  }
  if (file.type === 'image') {
    const storageUrl = `${getFileStorageUrl(file.path)}?t=${imageTimestamp}`
    return (
      <div className="bg-muted relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-md">
        <Image
          src={storageUrl}
          alt={file.name}
          fill
          className="object-cover"
          loading="lazy"
          sizes="64px"
          onError={() => console.error('图片加载失败:', file.name)}
        />
      </div>
    )
  }
  const iconConfig =
    FILE_TYPE_ICONS[file.type as keyof typeof FILE_TYPE_ICONS] || FILE_TYPE_ICONS.default
  const IconComponent = iconConfig.icon
  return <IconComponent className={`h-12 w-12 ${iconConfig.color}`} />
}
