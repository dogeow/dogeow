'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Pencil, Trash2 } from 'lucide-react'
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

  const handleUpdateRoom = async () => {
    if (!editingRoom) return
    const success = await onUpdateRoom(editingRoom.id, {
      name: editingRoom.name,
      area_id: editingRoom.area_id,
    })
    if (success) {
      setEditingRoom(null)
    }
  }

  return (
    <div className="flex flex-col">
      {/* 编辑房间卡片，仅在编辑时显示 */}
      {editingRoom && (
        <div className="mb-6 border-b pb-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold">{t('location.edit_room')}</h3>
            <p className="text-muted-foreground text-sm">{t('location.edit_room')}</p>
          </div>
          <div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="roomName">{t('location.room_name')}</Label>
                <Input
                  id="roomName"
                  placeholder={t('location.enter_room_name')}
                  value={editingRoom.name}
                  onChange={e => setEditingRoom({ ...editingRoom, name: e.target.value })}
                  onKeyDown={e => e.key === 'Enter' && handleUpdateRoom()}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="areaSelect">{t('location.belongs_to_area')}</Label>
                <Select
                  value={String(editingRoom.area_id)}
                  onValueChange={value =>
                    setEditingRoom({ ...editingRoom, area_id: parseInt(value) })
                  }
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
          </div>
          <div className="mt-4 flex justify-between">
            <Button variant="outline" onClick={() => setEditingRoom(null)} disabled={loading}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleUpdateRoom}
              disabled={loading || !editingRoom.area_id || !editingRoom.name.trim()}
            >
              {loading ? t('location.processing') : t('location.update_room')}
            </Button>
          </div>
        </div>
      )}

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
                      onClick={() => setEditingRoom(room)}
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
