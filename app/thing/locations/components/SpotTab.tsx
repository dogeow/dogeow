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
import { Room, Spot } from '../hooks/useLocationManagement'
import { useTranslation } from '@/hooks/useTranslation'

interface SpotTabProps {
  spots: Spot[]
  rooms: Room[]
  loading: boolean
  onAddSpot: (name: string, roomId: number) => Promise<boolean | undefined>
  onUpdateSpot: (
    spotId: number,
    data: { name: string; room_id: number }
  ) => Promise<boolean | undefined>
  onDeleteSpot: (spotId: number) => void
}

export default function SpotTab({
  spots,
  rooms,
  loading,
  onUpdateSpot,
  onDeleteSpot,
}: SpotTabProps) {
  const { t } = useTranslation()
  const [editingSpot, setEditingSpot] = useState<Spot | null>(null)

  const handleUpdateSpot = async () => {
    if (!editingSpot) return
    const success = await onUpdateSpot(editingSpot.id, {
      name: editingSpot.name,
      room_id: editingSpot.room_id,
    })
    if (success) {
      setEditingSpot(null)
    }
  }

  return (
    <div className="flex flex-col">
      {/* 编辑位置卡片，仅在编辑时显示 */}
      {editingSpot && (
        <div className="mb-6 border-b pb-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold">{t('location.edit_spot')}</h3>
            <p className="text-muted-foreground text-sm">{t('location.edit_spot')}</p>
          </div>
          <div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="spotName">{t('location.spot_name')}</Label>
                <Input
                  id="spotName"
                  placeholder={t('location.enter_spot_name')}
                  value={editingSpot.name}
                  onChange={e => setEditingSpot({ ...editingSpot, name: e.target.value })}
                  onKeyDown={e => e.key === 'Enter' && handleUpdateSpot()}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="roomSelect">{t('location.belongs_to_room')}</Label>
                <Select
                  value={String(editingSpot.room_id)}
                  onValueChange={value =>
                    setEditingSpot({ ...editingSpot, room_id: parseInt(value) })
                  }
                  disabled={loading}
                >
                  <SelectTrigger id="roomSelect">
                    <SelectValue placeholder={t('location.select_room')} />
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
            </div>
          </div>
          <div className="mt-4 flex justify-between">
            <Button variant="outline" onClick={() => setEditingSpot(null)} disabled={loading}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleUpdateSpot}
              disabled={loading || !editingSpot.room_id || !editingSpot.name.trim()}
            >
              {loading ? t('location.processing') : t('location.update_spot')}
            </Button>
          </div>
        </div>
      )}

      {/* 位置列表卡片 */}
      <div>
        <div>
          {spots.length === 0 ? (
            <div className="text-muted-foreground py-4 text-center">{t('location.no_spots')}</div>
          ) : (
            <div className="space-y-2">
              {spots.map(spot => (
                <div
                  key={spot.id}
                  className="flex items-center justify-between rounded-md border p-2"
                >
                  <div>
                    <span className="font-medium">{spot.name}</span>
                    <p className="text-muted-foreground text-xs">
                      {t('location.room')}:{' '}
                      {spot.room?.name || `${t('location.unknown_room')} (ID: ${spot.room_id})`}
                    </p>
                    {spot.room?.area?.name && (
                      <p className="text-muted-foreground text-xs">
                        {t('location.area')}: {spot.room.area.name}
                      </p>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditingSpot(spot)}
                      disabled={loading}
                      aria-label={t('common.edit')}
                      title={t('common.edit')}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDeleteSpot(spot.id)}
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
