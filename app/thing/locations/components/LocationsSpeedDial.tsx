'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Plus, Home, DoorOpen, MapPin, X } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Area, Room, LocationType } from '../hooks/useLocationManagement'
import { cn } from '@/lib/helpers'
import { useTranslation } from '@/hooks/useTranslation'
// import { useTheme } from 'next-themes'

interface LocationsSpeedDialProps {
  areas: Area[]
  rooms: Room[]
  loading: boolean
  onAddArea: (name: string) => Promise<boolean | undefined>
  onAddRoom: (name: string, areaId: number) => Promise<boolean | undefined>
  onAddSpot: (name: string, roomId: number) => Promise<boolean | undefined>
}

export default function LocationsSpeedDial({
  areas,
  rooms,
  loading,
  onAddArea,
  onAddRoom,
  onAddSpot,
}: LocationsSpeedDialProps) {
  // const { theme, systemTheme } = useTheme()
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogType, setDialogType] = useState<LocationType>('area')
  const [newName, setNewName] = useState('')
  const [selectedAreaId, setSelectedAreaId] = useState<number | null>(null)
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null)
  const [isMobile, setIsMobile] = useState(false)

  // 检测是否为移动设备
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // 根据主题模式获取弹出按钮的样式
  const getPopupButtonStyle = () => {
    // 使用蓝色背景配白色图标，无论白天还是夜晚模式
    return 'bg-blue-500 hover:bg-blue-600 text-white shadow-sm'
  }

  const speedDialItems = [
    {
      type: 'area' as LocationType,
      icon: Home,
      label: t('location.add_area'),
      show: true,
    },
    {
      type: 'room' as LocationType,
      icon: DoorOpen,
      label: t('location.add_room'),
      show: areas.length > 0,
    },
    {
      type: 'spot' as LocationType,
      icon: MapPin,
      label: t('location.add_spot'),
      show: rooms.length > 0,
    },
  ]

  const handleSpeedDialClick = (type: LocationType) => {
    setDialogType(type)
    setNewName('')
    setSelectedAreaId(null)
    setSelectedRoomId(null)
    setDialogOpen(true)
    setIsOpen(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) return

    let success = false

    try {
      switch (dialogType) {
        case 'area':
          success = (await onAddArea(newName.trim())) || false
          break
        case 'room':
          if (selectedAreaId) {
            success = (await onAddRoom(newName.trim(), selectedAreaId)) || false
          }
          break
        case 'spot':
          if (selectedRoomId) {
            success = (await onAddSpot(newName.trim(), selectedRoomId)) || false
          }
          break
      }

      if (success) {
        setDialogOpen(false)
        setNewName('')
        setSelectedAreaId(null)
        setSelectedRoomId(null)
      }
    } catch (error) {
      console.error('添加位置失败:', error)
    }
  }

  const getDialogTitle = () => {
    switch (dialogType) {
      case 'area':
        return t('location.add_area')
      case 'room':
        return t('location.add_room')
      case 'spot':
        return t('location.add_spot')
      default:
        return t('location.add_area')
    }
  }

  const getPlaceholder = () => {
    switch (dialogType) {
      case 'area':
        return t('location.enter_area_name')
      case 'room':
        return t('location.enter_room_name')
      case 'spot':
        return t('location.enter_spot_name')
      default:
        return t('location.enter_area_name')
    }
  }

  return (
    <>
      {/* SpeedDial主按钮 */}
      <div className="fixed right-6 bottom-24 z-50">
        <div className="relative">
          {/* 展开的选项 */}
          <div
            className={cn(
              'absolute right-0 bottom-16 flex flex-col gap-3 transition-all duration-300 ease-out',
              isOpen
                ? 'translate-y-0 scale-100 opacity-100'
                : 'pointer-events-none translate-y-4 scale-95 opacity-0'
            )}
          >
            {speedDialItems
              .filter(item => item.show)
              .map((item, index) => (
                <div
                  key={item.type}
                  className={cn(
                    'flex items-center gap-3 transition-all duration-300 ease-out',
                    isOpen ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0'
                  )}
                  style={{ transitionDelay: `${index * 50}ms` }}
                >
                  <span className="text-foreground bg-background/90 rounded-full border px-3 py-1.5 text-sm font-medium whitespace-nowrap shadow-sm backdrop-blur-sm">
                    {item.label}
                  </span>
                  <Button
                    size="icon"
                    className={cn(
                      'h-12 w-12 rounded-full shadow-lg transition-all duration-200 hover:scale-110 active:scale-95',
                      getPopupButtonStyle()
                    )}
                    onClick={() => handleSpeedDialClick(item.type)}
                  >
                    <item.icon className="h-5 w-5" />
                  </Button>
                </div>
              ))}
          </div>

          {/* 主按钮 - 使用主题色 */}
          <Button
            size="icon"
            className={cn(
              'text-primary-foreground h-14 w-14 rounded-full shadow-lg transition-all duration-300 hover:scale-110 active:scale-95',
              isOpen
                ? 'bg-destructive hover:bg-destructive/90 rotate-45'
                : 'bg-primary hover:bg-primary/90 rotate-0'
            )}
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
          </Button>
        </div>

        {/* 背景遮罩 */}
        {isOpen && (
          <div
            className="fixed inset-0 -z-10 bg-black/20 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setIsOpen(false)}
          />
        )}
      </div>

      {/* 添加对话框 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{getDialogTitle()}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t('location.name')}</Label>
              <Input
                id="name"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder={getPlaceholder()}
                disabled={loading}
                maxLength={50}
                autoFocus={!isMobile} // 移动端不自动focus，避免弹出键盘
              />
            </div>

            {/* 房间选择 */}
            {dialogType === 'room' && (
              <div className="space-y-2">
                <Label htmlFor="area">{t('location.belongs_to_area')}</Label>
                <Select
                  value={selectedAreaId?.toString() || ''}
                  onValueChange={value => setSelectedAreaId(Number(value))}
                >
                  <SelectTrigger>
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
            )}

            {/* 位置选择 */}
            {dialogType === 'spot' && (
              <div className="space-y-2">
                <Label htmlFor="room">{t('location.belongs_to_room')}</Label>
                <Select
                  value={selectedRoomId?.toString() || ''}
                  onValueChange={value => setSelectedRoomId(Number(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('location.select_room')} />
                  </SelectTrigger>
                  <SelectContent>
                    {rooms.map(room => (
                      <SelectItem key={room.id} value={room.id.toString()}>
                        {room.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={loading}
              >
                {t('common.cancel')}
              </Button>
              <Button
                type="submit"
                disabled={
                  loading ||
                  !newName.trim() ||
                  (dialogType === 'room' && !selectedAreaId) ||
                  (dialogType === 'spot' && !selectedRoomId)
                }
              >
                {loading ? t('location.adding') : t('location.add')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
