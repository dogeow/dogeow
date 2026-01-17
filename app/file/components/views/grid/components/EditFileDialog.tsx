import React, { memo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import type { CloudFile } from '@/app/file/types'

interface EditFileDialogProps {
  file: CloudFile | null
  fileName: string
  fileDescription: string
  onFileNameChange: (value: string) => void
  onFileDescriptionChange: (value: string) => void
  onSave: () => void
  onClose: () => void
}

export const EditFileDialog = memo<EditFileDialogProps>(
  ({
    file,
    fileName,
    fileDescription,
    onFileNameChange,
    onFileDescriptionChange,
    onSave,
    onClose,
  }) => {
    if (!file) return null

    return (
      <Dialog open={!!file} onOpenChange={open => !open && onClose()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑{file.is_folder ? '文件夹' : '文件'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">名称</Label>
              <Input
                id="edit-name"
                value={fileName}
                onChange={e => onFileNameChange(e.target.value)}
                placeholder="请输入文件名"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">描述 (可选)</Label>
              <Textarea
                id="edit-description"
                value={fileDescription}
                onChange={e => onFileDescriptionChange(e.target.value)}
                placeholder="请输入文件描述"
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">取消</Button>
            </DialogClose>
            <DialogClose asChild>
              <Button onClick={onSave} disabled={!fileName.trim()}>
                保存
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }
)

EditFileDialog.displayName = 'EditFileDialog'
