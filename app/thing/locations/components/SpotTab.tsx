"use client"

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
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

export default function SpotTab({ spots, rooms, loading, onAddSpot, onUpdateSpot, onDeleteSpot }: SpotTabProps) {
  const [newSpotName, setNewSpotName] = useState('')
  const [selectedRoomId, setSelectedRoomId] = useState<string>('')
  const [editingSpot, setEditingSpot] = useState<Spot | null>(null)

  const handleAddSpot = async () => {
    if (!selectedRoomId) return;
    const success = await onAddSpot(newSpotName, parseInt(selectedRoomId));
    if (success) {
      setNewSpotName('');
    }
  };

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
    <div className="flex flex-col md:flex-row gap-6">
      {/* 添加/编辑位置卡片 */}
      <Card>
        <CardHeader>
          <CardTitle>{editingSpot ? '编辑位置' : '添加位置'}</CardTitle>
          <CardDescription>
            {editingSpot ? '修改现有位置的信息' : '创建新的位置'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="spotName">位置名称</Label>
              <Input
                id="spotName"
                placeholder="输入具体位置名称，如：书柜、抽屉"
                value={editingSpot ? editingSpot.name : newSpotName}
                onChange={(e) => editingSpot 
                  ? setEditingSpot({...editingSpot, name: e.target.value})
                  : setNewSpotName(e.target.value)
                }
                onKeyDown={(e) => e.key === 'Enter' && (editingSpot ? handleUpdateSpot() : handleAddSpot())}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="roomSelect">所属房间</Label>
              <Select
                value={editingSpot ? String(editingSpot.room_id) : selectedRoomId}
                onValueChange={(value) => editingSpot 
                  ? setEditingSpot({...editingSpot, room_id: parseInt(value)})
                  : setSelectedRoomId(value)
                }
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
        </CardContent>
        <CardFooter className="flex justify-between">
          {editingSpot && (
            <Button variant="outline" onClick={() => setEditingSpot(null)}>
              取消
            </Button>
          )}
          <Button 
            onClick={editingSpot ? handleUpdateSpot : handleAddSpot}
            disabled={loading || (!editingSpot && !selectedRoomId) || (!!editingSpot && !editingSpot.room_id)}
          >
            {loading ? '处理中...' : editingSpot ? '更新位置' : '添加位置'}
          </Button>
        </CardFooter>
      </Card>

      {/* 位置列表卡片 */}
      <Card>
        <CardHeader>
          <CardTitle>位置列表</CardTitle>
          <CardDescription>管理您的具体位置</CardDescription>
        </CardHeader>
        <CardContent>
          {spots.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              暂无位置，请添加您的第一个位置
            </div>
          ) : (
            <div className="space-y-2">
              {spots.map((spot) => (
                <div key={spot.id} className="flex items-center justify-between p-2 border rounded-md">
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
        </CardContent>
      </Card>
    </div>
  )
} 