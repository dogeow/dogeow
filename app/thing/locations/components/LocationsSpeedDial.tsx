"use client"

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Plus, Home, DoorOpen, MapPin, X } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Area, Room, LocationType } from '../hooks/useLocationManagement'
import { cn } from "@/lib/helpers"

interface LocationsSpeedDialProps {
  activeTab: LocationType | 'tree';
  areas: Area[];
  rooms: Room[];
  loading: boolean;
  onAddArea: (name: string) => Promise<boolean | undefined>;
  onAddRoom: (name: string, areaId: number) => Promise<boolean | undefined>;
  onAddSpot: (name: string, roomId: number) => Promise<boolean | undefined>;
}

export default function LocationsSpeedDial({
  activeTab,
  areas,
  rooms,
  loading,
  onAddArea,
  onAddRoom,
  onAddSpot
}: LocationsSpeedDialProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogType, setDialogType] = useState<LocationType>('area')
  const [newName, setNewName] = useState('')
  const [selectedAreaId, setSelectedAreaId] = useState<number | null>(null)
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null)

  const speedDialItems = [
    {
      type: 'area' as LocationType,
      icon: Home,
      label: '添加区域',
      color: 'bg-blue-500 hover:bg-blue-600',
      show: true
    },
    {
      type: 'room' as LocationType,
      icon: DoorOpen,
      label: '添加房间',
      color: 'bg-green-500 hover:bg-green-600',
      show: areas.length > 0
    },
    {
      type: 'spot' as LocationType,
      icon: MapPin,
      label: '添加位置',
      color: 'bg-purple-500 hover:bg-purple-600',
      show: rooms.length > 0
    }
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
          success = await onAddArea(newName.trim()) || false
          break
        case 'room':
          if (selectedAreaId) {
            success = await onAddRoom(newName.trim(), selectedAreaId) || false
          }
          break
        case 'spot':
          if (selectedRoomId) {
            success = await onAddSpot(newName.trim(), selectedRoomId) || false
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
      console.error('添加失败:', error)
    }
  }

  const getDialogTitle = () => {
    switch (dialogType) {
      case 'area': return '添加新区域'
      case 'room': return '添加新房间'
      case 'spot': return '添加新位置'
      default: return '添加'
    }
  }

  const getPlaceholder = () => {
    switch (dialogType) {
      case 'area': return '输入区域名称，如：客厅、卧室'
      case 'room': return '输入房间名称，如：主卧、次卧'
      case 'spot': return '输入具体位置，如：书柜、抽屉'
      default: return '输入名称'
    }
  }

  return (
    <>
      {/* SpeedDial主按钮 */}
      <div className="fixed bottom-6 right-6 z-50">
        <div className="relative">
          {/* 展开的选项 */}
          <div className={cn(
            "absolute bottom-16 right-0 flex flex-col gap-3 transition-all duration-300 ease-out",
            isOpen ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-4 scale-95 pointer-events-none"
          )}>
            {speedDialItems.filter(item => item.show).map((item, index) => (
              <div
                key={item.type}
                className={cn(
                  "flex items-center gap-3 transition-all duration-300 ease-out",
                  isOpen ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4"
                )}
                style={{ transitionDelay: `${index * 50}ms` }}
              >
                <span className="text-sm font-medium text-foreground bg-background/90 backdrop-blur-sm px-3 py-1.5 rounded-full border shadow-sm whitespace-nowrap">
                  {item.label}
                </span>
                <Button
                  size="icon"
                  className={cn(
                    "h-12 w-12 rounded-full shadow-lg transition-all duration-200 hover:scale-110 active:scale-95",
                    item.color
                  )}
                  onClick={() => handleSpeedDialClick(item.type)}
                >
                  <item.icon className="h-5 w-5 text-white" />
                </Button>
              </div>
            ))}
          </div>

          {/* 主按钮 */}
          <Button
            size="icon"
            className={cn(
              "h-14 w-14 rounded-full shadow-lg transition-all duration-300 hover:scale-110 active:scale-95",
              isOpen 
                ? "bg-red-500 hover:bg-red-600 rotate-45" 
                : "bg-primary hover:bg-primary/90 rotate-0"
            )}
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? (
              <X className="h-6 w-6 text-white" />
            ) : (
              <Plus className="h-6 w-6 text-white" />
            )}
          </Button>
        </div>

        {/* 背景遮罩 */}
        {isOpen && (
          <div 
            className="fixed inset-0 bg-black/20 backdrop-blur-sm -z-10 transition-opacity duration-300"
            onClick={() => setIsOpen(false)}
          />
        )}
      </div>

      {/* 添加对话框 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {dialogType === 'area' && <Home className="h-5 w-5 text-blue-500" />}
              {dialogType === 'room' && <DoorOpen className="h-5 w-5 text-green-500" />}
              {dialogType === 'spot' && <MapPin className="h-5 w-5 text-purple-500" />}
              {getDialogTitle()}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">名称</Label>
              <Input
                id="name"
                placeholder={getPlaceholder()}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                autoFocus
                className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {dialogType === 'room' && (
              <div className="space-y-2">
                <Label htmlFor="area">所属区域</Label>
                <Select value={selectedAreaId?.toString()} onValueChange={(value) => setSelectedAreaId(parseInt(value))}>
                  <SelectTrigger id="area">
                    <SelectValue placeholder="选择区域" />
                  </SelectTrigger>
                  <SelectContent>
                    {areas.map((area) => (
                      <SelectItem key={area.id} value={area.id.toString()}>
                        <div className="flex items-center gap-2">
                          <Home className="h-4 w-4 text-blue-500" />
                          {area.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {dialogType === 'spot' && (
              <div className="space-y-2">
                <Label htmlFor="room">所属房间</Label>
                <Select value={selectedRoomId?.toString()} onValueChange={(value) => setSelectedRoomId(parseInt(value))}>
                  <SelectTrigger id="room">
                    <SelectValue placeholder="选择房间" />
                  </SelectTrigger>
                  <SelectContent>
                    {rooms.map((room) => (
                      <SelectItem key={room.id} value={room.id.toString()}>
                        <div className="flex items-center gap-2">
                          <DoorOpen className="h-4 w-4 text-green-500" />
                          {room.name}
                          {room.area?.name && (
                            <span className="text-xs text-muted-foreground">({room.area.name})</span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex justify-between pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setDialogOpen(false)}
                className="transition-all duration-200 hover:bg-muted/80"
              >
                取消
              </Button>
              <Button 
                type="submit" 
                disabled={
                  loading || 
                  !newName.trim() || 
                  (dialogType === 'room' && !selectedAreaId) ||
                  (dialogType === 'spot' && !selectedRoomId)
                }
                className="transition-all duration-200 hover:scale-105 active:scale-95"
              >
                {loading ? '添加中...' : '添加'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
} 