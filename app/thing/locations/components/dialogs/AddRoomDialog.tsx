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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Area } from '../../hooks/useLocationManagement'

interface AddRoomDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddRoom: (name: string, areaId: number) => Promise<boolean | undefined>
  loading: boolean
  areas: Area[]
}

export default function AddRoomDialog({
  open,
  onOpenChange,
  onAddRoom,
  loading,
  areas,
}: AddRoomDialogProps) {
  const [roomName, setRoomName] = useState('')
  const [selectedAreaId, setSelectedAreaId] = useState<string>('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAreaId) {
      return
    }
    const success = await onAddRoom(roomName, parseInt(selectedAreaId))
    if (success) {
      setRoomName('')
      setSelectedAreaId('')
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>添加房间</DialogTitle>
          <DialogDescription>为区域添加一个新房间，如卧室、厨房等。</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">所属区域</label>
              <Select value={selectedAreaId} onValueChange={setSelectedAreaId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="选择区域" />
                </SelectTrigger>
                <SelectContent>
                  {areas.map(area => (
                    <SelectItem key={area.id} value={area.id.toString()}>
                      {area.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">房间名称</label>
              <Input
                id="roomName"
                placeholder="输入房间名称"
                value={roomName}
                onChange={e => setRoomName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button type="submit" disabled={loading || !roomName.trim() || !selectedAreaId}>
              {loading ? '添加中...' : '添加房间'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
