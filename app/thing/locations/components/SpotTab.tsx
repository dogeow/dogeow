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
import { Room, Spot } from '../hooks/useLocationManagement'

interface SpotTabProps {
  spots: Spot[];
  rooms: Room[];
  loading: boolean;
  onAddSpot: (name: string, roomId: number) => Promise<boolean | undefined>;
  onUpdateSpot: (spotId: number, data: { name: string, room_id: number }) => Promise<boolean | undefined>;
  onDeleteSpot: (spotId: number) => void;
}

export default function SpotTab({ 
  spots, 
  rooms, 
  loading, 
  onUpdateSpot, 
  onDeleteSpot 
}: SpotTabProps) {
  const [editingSpot, setEditingSpot] = useState<Spot | null>(null)

  const handleUpdateSpot = async () => {
    if (!editingSpot) return;
    const success = await onUpdateSpot(editingSpot.id, {
      name: editingSpot.name,
      room_id: editingSpot.room_id
    });
    if (success) {
      setEditingSpot(null);
    }
  };

  return (
    <div className="flex flex-col">
      {/* 编辑位置卡片，仅在编辑时显示 */}
      {editingSpot && (
        <div className="mb-6 border-b pb-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold">编辑位置</h3>
            <p className="text-sm text-muted-foreground">
              修改位置的信息
            </p>
          </div>
          <div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="spotName">位置名称</Label>
                <Input
                  id="spotName"
                  placeholder="输入具体位置名称，如：书柜、抽屉"
                  value={editingSpot.name}
                  onChange={(e) => setEditingSpot({...editingSpot, name: e.target.value})}
                  onKeyDown={(e) => e.key === 'Enter' && handleUpdateSpot()}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="roomSelect">所属房间</Label>
                <Select
                  value={String(editingSpot.room_id)}
                  onValueChange={(value) => setEditingSpot({...editingSpot, room_id: parseInt(value)})}
                >
                  <SelectTrigger id="roomSelect">
                    <SelectValue placeholder="选择房间" />
                  </SelectTrigger>
                  <SelectContent>
                    {rooms.map((room) => (
                      <SelectItem key={room.id} value={room.id.toString()}>
                        {room.name} {room.area?.name ? `(${room.area.name})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div className="flex justify-between mt-4">
            <Button variant="outline" onClick={() => setEditingSpot(null)}>
              取消
            </Button>
            <Button 
              onClick={handleUpdateSpot}
              disabled={loading || !editingSpot.room_id || !editingSpot.name.trim()}
            >
              {loading ? '处理中...' : '更新位置'}
            </Button>
          </div>
        </div>
      )}

      {/* 位置列表卡片 */}
      <div>
        <div>
          {spots.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              暂无位置，请点击右下角的&quot;+&quot;按钮添加位置
            </div>
          ) : (
            <div className="space-y-2">
              {spots.map((spot) => (
                <div key={spot.id} 
                  className="flex items-center justify-between p-2 border rounded-md"
                >
                  <div>
                    <span className="font-medium">{spot.name}</span>
                    <p className="text-xs text-muted-foreground">
                      房间: {spot.room?.name || `未知房间 (ID: ${spot.room_id})`}
                    </p>
                    {spot.room?.area?.name && (
                      <p className="text-xs text-muted-foreground">
                        区域: {spot.room.area.name}
                      </p>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => setEditingSpot(spot)}
                    >
                      <Pencil className="h-4 w-4"/>
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => onDeleteSpot(spot.id)}
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