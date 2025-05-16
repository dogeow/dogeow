"use client"

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Pencil, Trash2 } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Area, Room } from '../hooks/useLocationManagement'

interface RoomTabProps {
  rooms: Room[];
  areas: Area[];
  loading: boolean;
  onAddRoom: (name: string, areaId: number) => Promise<boolean | undefined>;
  onUpdateRoom: (roomId: number, data: { name: string, area_id: number }) => Promise<boolean | undefined>;
  onDeleteRoom: (roomId: number) => void;
}

export default function RoomTab({ rooms, areas, loading, onAddRoom, onUpdateRoom, onDeleteRoom }: RoomTabProps) {
  const [editingRoom, setEditingRoom] = useState<Room | null>(null)

  const handleUpdateRoom = async () => {
    if (!editingRoom) return;
    const success = await onUpdateRoom(editingRoom.id, {
      name: editingRoom.name,
      area_id: editingRoom.area_id
    });
    if (success) {
      setEditingRoom(null);
    }
  };

  return (
    <div className="flex flex-col">
      {/* 编辑房间卡片，仅在编辑时显示 */}
      {editingRoom && (
        <div className="mb-6 border-b pb-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold">编辑房间</h3>
            <p className="text-sm text-muted-foreground">
              修改房间的信息
            </p>
          </div>
          <div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="roomName">房间名称</Label>
                <Input
                  id="roomName"
                  placeholder="输入房间名称，如：卧室、厨房"
                  value={editingRoom.name}
                  onChange={(e) => setEditingRoom({...editingRoom, name: e.target.value})}
                  onKeyDown={(e) => e.key === 'Enter' && handleUpdateRoom()}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="areaSelect">所属区域</Label>
                <Select
                  value={String(editingRoom.area_id)}
                  onValueChange={(value) => setEditingRoom({...editingRoom, area_id: parseInt(value)})}
                >
                  <SelectTrigger id="areaSelect">
                    <SelectValue placeholder="选择区域" />
                  </SelectTrigger>
                  <SelectContent>
                    {areas.map((area) => (
                      <SelectItem key={area.id} value={area.id.toString()}>
                        {area.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div className="flex justify-between mt-4">
            <Button variant="outline" onClick={() => setEditingRoom(null)}>
              取消
            </Button>
            <Button 
              onClick={handleUpdateRoom}
              disabled={loading || !editingRoom.area_id || !editingRoom.name.trim()}
            >
              {loading ? '处理中...' : '更新房间'}
            </Button>
          </div>
        </div>
      )}

      {/* 房间列表卡片 */}
      <div>
        <div>
          {rooms.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              暂无房间，请点击右下角的"+"按钮添加房间
            </div>
          ) : (
            <div className="space-y-2">
              {rooms.map((room) => (
                <div key={room.id} className="flex items-center justify-between p-2 border rounded-md">
                  <div>
                    <span className="font-medium">{room.name}</span>
                    <p className="text-xs text-muted-foreground">
                      区域: {room.area?.name || `未知区域 (ID: ${room.area_id})`}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => setEditingRoom(room)}
                    >
                      <Pencil className="h-4 w-4"/>
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => onDeleteRoom(room.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
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