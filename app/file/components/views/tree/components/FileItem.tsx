import React, { memo, useCallback } from 'react'
import { FileIcon } from './FileIcon'
import { formatFileSize } from '../../../../constants'
import type { CloudFile } from '../../../../types'

interface FileItemProps {
  file: CloudFile
  onClick: (file: CloudFile) => void
}

export const FileItem = memo<FileItemProps>(({ file, onClick }) => {
  const handleClick = useCallback(() => {
    onClick(file)
  }, [file, onClick])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        onClick(file)
      }
    },
    [file, onClick]
  )

  return (
    <div
      className="hover:bg-muted/50 focus:ring-primary/30 flex cursor-pointer items-center rounded-md px-3 py-2 transition-colors focus:ring-1 focus:outline-none"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`${file.is_folder ? '文件夹' : '文件'}: ${file.name}`}
    >
      <FileIcon file={file} />
      <span className="ml-2 flex-1 truncate" title={file.name}>
        {file.name}
      </span>
      {!file.is_folder && (
        <span className="text-muted-foreground ml-2 text-xs">{formatFileSize(file.size)}</span>
      )}
    </div>
  )
})

FileItem.displayName = 'FileItem'
