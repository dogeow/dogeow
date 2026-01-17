import React, { memo, useMemo } from 'react'
import { FileItem } from './FileItem'
import type { CloudFile } from '../../../../types'

interface FileListProps {
  files: CloudFile[]
  currentFolderName: string
  currentFolderId: number | null
  onFileClick: (file: CloudFile) => void
}

export const FileList = memo<FileListProps>(
  ({ files, currentFolderName, currentFolderId, onFileClick }) => {
    const fileElements = useMemo(
      () => files.map(file => <FileItem key={file.id} file={file} onClick={onFileClick} />),
      [files, onFileClick]
    )

    return (
      <div className="flex-1 overflow-auto pl-4" role="list" aria-label="文件列表">
        <div className="mb-2 text-sm font-medium">{currentFolderName}</div>

        {files.length === 0 ? (
          <div className="text-muted-foreground mt-4 text-sm" role="status">
            {currentFolderId === null ? '根目录为空' : '此文件夹为空'}
          </div>
        ) : (
          <div className="space-y-1">{fileElements}</div>
        )}
      </div>
    )
  }
)

FileList.displayName = 'FileList'
