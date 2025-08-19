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
import { Room } from '../../hooks/useLocationManagement'

interface AddSpotDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddSpot: (name: string, roomId: number) => Promise<boolean | undefined>
  loading: boolean
  rooms: Room[]
}

export default function AddSpotDialog({
  open,
  onOpenChange,
  onAddSpot,
  loading,
  rooms,
}: AddSpotDialogProps) {
  const [spotName, setSpotName] = useState('')
  const [selectedRoomId, setSelectedRoomId] = useState<string>('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedRoomId) {
      return
    }
    const success = await onAddSpot(spotName, parseInt(selectedRoomId))
    if (success) {
      setSpotName('')
      setSelectedRoomId('')
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>添加具体位置</DialogTitle>
          <DialogDescription>为房间添加一个新位置，如书柜、抽屉等。</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">所属房间</label>
              <Select value={selectedRoomId} onValueChange={setSelectedRoomId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="选择房间" />
                </SelectTrigger>
                <SelectContent>
                  {rooms.map(room => (
                    <SelectItem key={room.id} value={room.id.toString()}>
                      {room.name} {room.area?.name ? `(${room.area.name})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">位置名称</label>
              <Input
                id="spotName"
                placeholder="输入具体位置名称"
                value={spotName}
                onChange={e => setSpotName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button type="submit" disabled={loading || !spotName.trim() || !selectedRoomId}>
              {loading ? '添加中...' : '添加位置'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
