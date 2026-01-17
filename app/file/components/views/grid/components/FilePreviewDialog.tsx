import React, { memo } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import { PreviewContent } from './PreviewContent'
import type { PreviewType } from '../utils/previewTypes'
import type { CloudFile } from '@/app/file/types'

interface FilePreviewDialogProps {
  file: CloudFile | null
  previewType: PreviewType | null
  previewUrl: string | null
  previewContent: string | null
  onClose: () => void
  onDownload: (file: CloudFile) => void
}

export const FilePreviewDialog = memo<FilePreviewDialogProps>(
  ({ file, previewType, previewUrl, previewContent, onClose, onDownload }) => {
    if (!file) return null

    return (
      <Dialog open={!!file} onOpenChange={open => !open && onClose()}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between pr-12">
              <span className="truncate">{file.name}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDownload(file)}
                className="ml-2 shrink-0"
              >
                <Download className="mr-2 h-4 w-4" />
                下载
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="flex min-h-[60vh] items-center justify-center py-4">
            <PreviewContent
              previewType={previewType}
              previewUrl={previewUrl}
              previewContent={previewContent}
              previewFile={file}
              onDownload={onDownload}
            />
          </div>
        </DialogContent>
      </Dialog>
    )
  }
)

FilePreviewDialog.displayName = 'FilePreviewDialog'
