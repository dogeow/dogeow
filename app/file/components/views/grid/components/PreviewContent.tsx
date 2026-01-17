import React, { memo } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { File, FileText, Download } from 'lucide-react'
import { PREVIEW_TYPES, type PreviewType } from '../utils/previewTypes'
import type { CloudFile } from '@/app/file/types'

interface PreviewContentProps {
  previewType: PreviewType | null
  previewUrl: string | null
  previewContent: string | null
  previewFile: CloudFile | null
  onDownload: (file: CloudFile) => void
}

export const PreviewContent = memo<PreviewContentProps>(
  ({ previewType, previewUrl, previewContent, previewFile, onDownload }) => {
    if (previewType === PREVIEW_TYPES.LOADING) {
      return (
        <div className="flex animate-pulse flex-col items-center">
          <div className="bg-muted h-12 w-12 rounded-full"></div>
          <div className="bg-muted mt-4 h-4 w-32 rounded"></div>
        </div>
      )
    }

    if (previewType === PREVIEW_TYPES.IMAGE && previewUrl) {
      return (
        <Image
          src={previewUrl}
          alt={previewFile?.name || ''}
          width={800}
          height={600}
          className="max-h-[60vh] max-w-full object-contain"
        />
      )
    }

    if (previewType === PREVIEW_TYPES.PDF && previewUrl) {
      return (
        <div className="flex h-[60vh] w-full flex-col">
          <div className="relative flex-1">
            <iframe
              src={previewUrl}
              className="h-full w-full border-0"
              title={previewFile?.name}
              onError={() => console.error('PDF iframe failed to load')}
            />
          </div>
          <div className="text-muted-foreground mt-2 text-center text-sm">
            如果PDF无法显示，请{' '}
            <Button
              variant="link"
              className="h-auto p-0 text-sm"
              onClick={() => window.open(previewUrl, '_blank')}
            >
              在新窗口中打开
            </Button>{' '}
            或{' '}
            <Button
              variant="link"
              className="h-auto p-0 text-sm"
              onClick={() => previewFile && onDownload(previewFile)}
            >
              下载文件
            </Button>
          </div>
        </div>
      )
    }

    if (previewType === PREVIEW_TYPES.TEXT && previewContent && !previewContent.startsWith('{')) {
      return (
        <pre className="bg-muted h-full max-h-[60vh] w-full overflow-auto rounded p-4 text-sm">
          {previewContent}
        </pre>
      )
    }

    if (
      (previewType === PREVIEW_TYPES.DOCUMENT || previewType === PREVIEW_TYPES.UNKNOWN) &&
      previewContent
    ) {
      let response: unknown = null
      try {
        response = JSON.parse(previewContent)
      } catch {}

      return (
        <div className="mx-auto max-w-md text-center">
          <FileText className="text-muted-foreground mx-auto h-16 w-16" />
          <p className="text-muted-foreground mt-4 font-medium">
            {(response as { message?: string })?.message || '此文件类型不支持预览'}
          </p>
          {(response as { suggestion?: string })?.suggestion && (
            <p className="text-muted-foreground mt-2 text-sm">
              {(response as { suggestion: string }).suggestion}
            </p>
          )}
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => previewFile && onDownload(previewFile)}
          >
            <Download className="mr-2 h-4 w-4" />
            下载文件
          </Button>
        </div>
      )
    }

    if (previewType && !(Object.values(PREVIEW_TYPES) as string[]).includes(previewType)) {
      return (
        <div className="text-center">
          <File className="text-muted-foreground mx-auto h-16 w-16" />
          <p className="text-muted-foreground mt-4">此文件类型不支持预览</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => previewFile && onDownload(previewFile)}
          >
            <Download className="mr-2 h-4 w-4" />
            下载文件
          </Button>
        </div>
      )
    }

    return null
  }
)

PreviewContent.displayName = 'PreviewContent'
