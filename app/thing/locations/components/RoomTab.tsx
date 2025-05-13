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
  const [newRoomName, setNewRoomName] = useState('')
  const [selectedAreaId, setSelectedAreaId] = useState<string>('')
  const [editingRoom, setEditingRoom] = useState<Room | null>(null)

  const handleAddRoom = async () => {
    if (!selectedAreaId) return;
    const success = await onAddRoom(newRoomName, parseInt(selectedAreaId));
    if (success) {
      setNewRoomName('');
    }
  };

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
    <div className="flex flex-col md:flex-row gap-6">
      {/* 添加/编辑房间卡片 */}
      <Card>
        <CardHeader>
          <CardTitle>{editingRoom ? '编辑房间' : '添加房间'}</CardTitle>
          <CardDescription>
            {editingRoom ? '修改现有房间的信息' : '创建新的房间'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="roomName">房间名称</Label>
              <Input
                id="roomName"
                placeholder="输入房间名称，如：卧室、厨房"
                value={editingRoom ? editingRoom.name : newRoomName}
                onChange={(e) => editingRoom 
                  ? setEditingRoom({...editingRoom, name: e.target.value})
                  : setNewRoomName(e.target.value)
                }
                onKeyDown={(e) => e.key === 'Enter' && (editingRoom ? handleUpdateRoom() : handleAddRoom())}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="areaSelect">所属区域</Label>
              <Select
                value={editingRoom ? String(editingRoom.area_id) : selectedAreaId}
                onValueChange={(value) => editingRoom 
                  ? setEditingRoom({...editingRoom, area_id: parseInt(value)})
                  : setSelectedAreaId(value)
                }
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
        </CardContent>
        <CardFooter className="flex justify-between">
          {editingRoom && (
            <Button variant="outline" onClick={() => setEditingRoom(null)}>
              取消
            </Button>
          )}
          <Button 
            onClick={editingRoom ? handleUpdateRoom : handleAddRoom}
            disabled={loading || (!editingRoom && !selectedAreaId) || (!!editingRoom && !editingRoom.area_id)}
          >
            {loading ? '处理中...' : editingRoom ? '更新房间' : '添加房间'}
          </Button>
        </CardFooter>
      </Card>

      {/* 房间列表卡片 */}
      <Card>
        <CardHeader>
          <CardTitle>房间列表</CardTitle>
          <CardDescription>管理您的房间</CardDescription>
        </CardHeader>
        <CardContent>
          {rooms.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              暂无房间，请添加您的第一个房间
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
        </CardContent>
      </Card>
    </div>
  )
} 