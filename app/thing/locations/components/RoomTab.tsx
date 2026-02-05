'use client'

import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Pencil, Trash2 } from 'lucide-react'
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
import { Area, Room } from '../hooks/useLocationManagement'
import { useTranslation } from '@/hooks/useTranslation'

interface RoomTabProps {
  rooms: Room[]
  areas: Area[]
  loading: boolean
  onAddRoom: (name: string, areaId: number) => Promise<boolean | undefined>
  onUpdateRoom: (
    roomId: number,
    data: { name: string; area_id: number }
  ) => Promise<boolean | undefined>
  onDeleteRoom: (roomId: number) => void
}

export default function RoomTab({
  rooms,
  areas,
  loading,
  onUpdateRoom,
  onDeleteRoom,
}: RoomTabProps) {
  const { t } = useTranslation()
  const [editingRoom, setEditingRoom] = useState<Room | null>(null)

  // 使用 useMemo 计算编辑表单的值，避免在 useEffect 中调用 setState
  const editingRoomName = useMemo(() => (editingRoom ? editingRoom.name : ''), [editingRoom])
  const editingAreaId = useMemo(
    () => (editingRoom ? String(editingRoom.area_id) : ''),
    [editingRoom]
  )

  // 本地状态用于表单输入（允许用户修改）
  const [localRoomName, setLocalRoomName] = useState('')
  const [localAreaId, setLocalAreaId] = useState<string>('')

  // 当 editingRoom 变化时，更新本地状态
  const handleSetEditingRoom = (room: Room | null) => {
    setEditingRoom(room)
    if (room) {
      setLocalRoomName(room.name)
      setLocalAreaId(String(room.area_id))
    } else {
      setLocalRoomName('')
      setLocalAreaId('')
    }
  }

  // 使用本地状态或计算值（优先使用本地状态，如果 editingRoom 存在）
  const displayRoomName = editingRoom ? localRoomName : editingRoomName
  const displayAreaId = editingRoom ? localAreaId : editingAreaId

  const handleUpdateRoom = async () => {
    if (!editingRoom) return
    const success = await onUpdateRoom(editingRoom.id, {
      name: localRoomName.trim(),
      area_id: parseInt(localAreaId),
    })
    if (success) {
      handleSetEditingRoom(null)
    }
  }

  return (
    <div className="flex flex-col">
      <Dialog open={!!editingRoom} onOpenChange={open => !open && handleSetEditingRoom(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('location.edit_room')}</DialogTitle>
            <DialogDescription>{t('location.edit_room')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="roomName">{t('location.room_name')}</Label>
              <Input
                id="roomName"
                placeholder={t('location.enter_room_name')}
                value={displayRoomName}
                onChange={e => setLocalRoomName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleUpdateRoom()}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="areaSelect">{t('location.belongs_to_area')}</Label>
              <Select
                value={displayAreaId}
                onValueChange={value => setLocalAreaId(value)}
                disabled={loading}
              >
                <SelectTrigger id="areaSelect">
                  <SelectValue placeholder={t('location.select_area')} />
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => handleSetEditingRoom(null)} disabled={loading}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleUpdateRoom}
              disabled={loading || !displayAreaId || !displayRoomName.trim()}
            >
              {loading ? t('location.processing') : t('location.update_room')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 房间列表卡片 */}
      <div>
        <div>
          {rooms.length === 0 ? (
            <div className="text-muted-foreground py-4 text-center">{t('location.no_rooms')}</div>
          ) : (
            <div className="space-y-2">
              {rooms.map(room => (
                <div
                  key={room.id}
                  className="flex items-center justify-between rounded-md border p-2"
                >
                  <div>
                    <span className="font-medium">{room.name}</span>
                    <p className="text-muted-foreground text-xs">
                      {t('location.area')}:{' '}
                      {room.area?.name || `${t('location.unknown_area')} (ID: ${room.area_id})`}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleSetEditingRoom(room)}
                      disabled={loading}
                      aria-label={t('common.edit')}
                      title={t('common.edit')}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDeleteRoom(room.id)}
                      disabled={loading}
                      aria-label={t('common.delete')}
                      title={t('common.delete')}
                    >
                      <Trash2 className="text-destructive h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
