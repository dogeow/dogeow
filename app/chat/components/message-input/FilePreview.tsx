'use client'

import { Button } from '@/components/ui/button'
import { X, Paperclip } from 'lucide-react'
import Image from 'next/image'
import { useTranslation } from '@/hooks/useTranslation'
import type { FilePreviewProps } from './types'

export function FilePreview({ files, onRemove }: FilePreviewProps) {
  const { t } = useTranslation()

  if (files.length === 0) return null

  return (
    <div className="mb-3 flex max-h-32 flex-wrap gap-2 overflow-y-auto">
      {files.map((file, index) => (
        <div key={index} className="relative flex-shrink-0">
          {file.type === 'image' ? (
            <div className="relative">
              <Image
                src={file.preview}
                alt={file.file.name}
                width={80}
                height={80}
                className="h-16 w-16 rounded-md object-cover sm:h-20 sm:w-20"
              />
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onRemove(index)}
                className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 sm:h-6 sm:w-6"
                aria-label={t('chat.remove_file', 'Remove file')}
              >
                <X className="h-2 w-2 sm:h-3 sm:w-3" />
              </Button>
            </div>
          ) : (
            <div className="bg-muted flex h-16 w-16 flex-col items-center justify-center rounded-md sm:h-20 sm:w-20">
              <Paperclip className="h-4 w-4 sm:h-6 sm:w-6" />
              <span className="w-full truncate px-1 text-center text-xs">{file.file.name}</span>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onRemove(index)}
                className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 sm:h-6 sm:w-6"
                aria-label={t('chat.remove_file', 'Remove file')}
              >
                <X className="h-2 w-2 sm:h-3 sm:w-3" />
              </Button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
