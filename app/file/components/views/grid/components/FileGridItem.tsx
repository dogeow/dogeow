import React, { memo } from 'react'
import { MoreVertical, Download, Pencil, Trash2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/helpers'
import { FileIcon } from '../utils/fileIcons'
import { formatDate } from '../utils/dateUtils'
import { formatFileSize } from '@/app/file/constants'
import type { CloudFile } from '@/app/file/types'

interface FileGridItemProps {
  file: CloudFile
  isSelected: boolean
  onSelect: (fileId: number, event: React.MouseEvent) => void
  onClick: (file: CloudFile) => void
  onDownload: (file: CloudFile) => void
  onEdit: (file: CloudFile, event: React.MouseEvent) => void
  onDelete: (file: CloudFile, event: React.MouseEvent) => void
}

export const FileGridItem = memo<FileGridItemProps>(
  ({ file, isSelected, onSelect, onClick, onDownload, onEdit, onDelete }) => {
    return (
      <div
        className={cn(
          'flex cursor-pointer flex-col items-center rounded-lg border p-4 shadow-sm transition-colors',
          'bg-card hover:bg-accent/50 border-border',
          isSelected && 'ring-primary border-primary ring-2'
        )}
        onClick={() => onClick(file)}
      >
        <div className="relative">
          <FileIcon file={file} />
          <input
            type="checkbox"
            className="border-primary absolute -top-2 -left-2 h-4 w-4 rounded-sm border"
            checked={isSelected}
            readOnly
            onClick={e => onSelect(file.id, e)}
          />
        </div>
        <div className="mt-2 text-center">
          <p
            className="text-foreground max-w-[8rem] truncate text-sm font-medium"
            title={file.name}
          >
            {file.name}
          </p>
          {!file.is_folder && (
            <p className="text-muted-foreground text-xs">{formatFileSize(file.size)}</p>
          )}
          <p className="text-muted-foreground mt-1 text-xs">{formatDate(file.created_at)}</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="absolute top-0 right-0 h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {!file.is_folder && (
              <DropdownMenuItem
                onClick={e => {
                  e.stopPropagation()
                  onDownload(file)
                }}
              >
                <Download className="mr-2 h-4 w-4" />
                下载
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={e => onEdit(file, e)}>
              <Pencil className="mr-2 h-4 w-4" />
              重命名
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={e => {
                e.stopPropagation()
                onDelete(file)
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              删除
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    )
  }
)

FileGridItem.displayName = 'FileGridItem'
