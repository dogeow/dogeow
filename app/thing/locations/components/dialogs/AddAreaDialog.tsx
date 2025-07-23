'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface AddAreaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddArea: (name: string) => Promise<boolean | undefined>
  loading: boolean
}

export default function AddAreaDialog({
  open,
  onOpenChange,
  onAddArea,
  loading,
}: AddAreaDialogProps) {
  const [areaName, setAreaName] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const success = await onAddArea(areaName)
    if (success) {
      setAreaName('')
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>添加区域</DialogTitle>
          <DialogDescription>创建一个新的区域，如家、办公室等。</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Input
                id="areaName"
                placeholder="输入区域名称"
                value={areaName}
                onChange={e => setAreaName(e.target.value)}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button type="submit" disabled={loading || !areaName.trim()}>
              {loading ? '添加中...' : '添加区域'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
