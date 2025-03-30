"use client"

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Pencil, Trash2, Plus, Home, DoorOpen, MapPin, FolderTree, X, Check } from "lucide-react"
import { toast } from "sonner"
import ThingNavigation from '../components/ThingNavigation'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import LocationTreeSelect from '../components/LocationTreeSelect'
import { 
  useAreas, 
  useRooms, 
  useSpots, 
  createArea, 
  updateArea, 
  deleteArea,
  createRoom,
  updateRoom,
  deleteRoom,
  createSpot,
  updateSpot,
  deleteSpot
} from '@/utils/api'

// 定义类型
type LocationType = 'area' | 'room' | 'spot';
type Area = { id: number; name: string; };
type Room = { id: number; name: string; area_id: number; area?: { id: number; name: string; }; };
type Spot = { id: number; name: string; room_id: number; room?: { id: number; name: string; area?: { id: number; name: string; } }; };

export default function Locations() {
  // 状态
  const [activeTab, setActiveTab] = useState<LocationType | 'tree'>('tree')
  const [loading, setLoading] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<{id: number, type: LocationType} | null>(null)
  const [selectedLocation, setSelectedLocation] = useState<{ type: LocationType, id: number } | undefined>(undefined)
  
  // 获取数据
  const { data: areas = [], mutate: refreshAreas } = useAreas();
  const { data: rooms = [], mutate: refreshRooms } = useRooms();
  const { data: spots = [], mutate: refreshSpots } = useSpots();
  
  // 表单状态
  const [newAreaName, setNewAreaName] = useState('')
  const [editingArea, setEditingArea] = useState<Area | null>(null)
  
  const [newRoomName, setNewRoomName] = useState('')
  const [selectedAreaId, setSelectedAreaId] = useState<string>('')
  const [editingRoom, setEditingRoom] = useState<Room | null>(null)
  
  const [newSpotName, setNewSpotName] = useState('')
  const [selectedRoomId, setSelectedRoomId] = useState<string>('')
  const [editingSpot, setEditingSpot] = useState<Spot | null>(null)

  const [editingInlineAreaId, setEditingInlineAreaId] = useState<number | null>(null)
  const [editingAreaName, setEditingAreaName] = useState('')

  // 添加区域
  const handleAddArea = async () => {
    if (!newAreaName.trim()) {
      toast.error("区域名称不能为空");
      return;
    }

    setLoading(true);
    try {
      await createArea({ name: newAreaName });
      toast.success("区域创建成功");
      setNewAreaName('');
      refreshAreas();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "创建区域失败");
    } finally {
      setLoading(false);
    }
  };
  
  // 更新区域
  const handleUpdateArea = async (areaId: number, newName: string) => {
    if (!newName.trim()) {
      toast.error("区域名称不能为空");
      return;
    }

    setLoading(true);
    try {
      await updateArea(areaId)({ name: newName });
      toast.success("区域更新成功");
      setEditingInlineAreaId(null);
      refreshAreas();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "更新区域失败");
    } finally {
      setLoading(false);
    }
  };
  
  // 添加房间
  const handleAddRoom = async () => {
    if (!newRoomName.trim()) {
      toast.error("房间名称不能为空");
      return;
    }
    
    if (!selectedAreaId) {
      toast.error("请选择区域");
      return;
    }

    setLoading(true);
    try {
      await createRoom({ 
        name: newRoomName,
        area_id: parseInt(selectedAreaId)
      });
      toast.success("房间创建成功");
      setNewRoomName('');
      refreshRooms();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "创建房间失败");
    } finally {
      setLoading(false);
    }
  };
  
  // 更新房间
  const handleUpdateRoom = async () => {
    if (!editingRoom || !editingRoom.name.trim()) {
      toast.error("房间名称不能为空");
      return;
    }

    setLoading(true);
    try {
      await updateRoom(editingRoom.id)({ 
        name: editingRoom.name,
        area_id: editingRoom.area_id
      });
      toast.success("房间更新成功");
      setEditingRoom(null);
      refreshRooms();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "更新房间失败");
    } finally {
      setLoading(false);
    }
  };
  
  // 添加位置
  const handleAddSpot = async () => {
    if (!newSpotName.trim()) {
      toast.error("位置名称不能为空");
      return;
    }
    
    if (!selectedRoomId) {
      toast.error("请选择房间");
      return;
    }

    setLoading(true);
    try {
      await createSpot({ 
        name: newSpotName,
        room_id: parseInt(selectedRoomId)
      });
      toast.success("位置创建成功");
      setNewSpotName('');
      refreshSpots();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "创建位置失败");
    } finally {
      setLoading(false);
    }
  };
  
  // 更新位置
  const handleUpdateSpot = async () => {
    if (!editingSpot || !editingSpot.name.trim()) {
      toast.error("位置名称不能为空");
      return;
    }

    setLoading(true);
    try {
      await updateSpot(editingSpot.id)({ 
        name: editingSpot.name,
        room_id: editingSpot.room_id
      });
      toast.success("位置更新成功");
      setEditingSpot(null);
      refreshSpots();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "更新位置失败");
    } finally {
      setLoading(false);
    }
  };
  
  // 删除确认
  const confirmDelete = (id: number, type: LocationType) => {
    setItemToDelete({ id, type });
    setDeleteDialogOpen(true);
  };
  
  // 执行删除
  const handleDelete = async () => {
    if (!itemToDelete) return;

    setLoading(true);
    try {
      if (itemToDelete.type === 'area') {
        await deleteArea(itemToDelete.id);
        refreshAreas();
      } else if (itemToDelete.type === 'room') {
        await deleteRoom(itemToDelete.id);
        refreshRooms();
      } else if (itemToDelete.type === 'spot') {
        await deleteSpot(itemToDelete.id);
        refreshSpots();
      }
      
      const successMessages = {
        area: '区域删除成功',
        room: '房间删除成功',
        spot: '位置删除成功'
      };
      
      toast.success(successMessages[itemToDelete.type]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "删除失败");
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

  // 处理位置选择
  const handleLocationSelect = (type: LocationType, id: number, fullPath: string) => {
    setSelectedLocation({ type, id });
    
    // 根据选择的位置类型切换到对应的标签页
    setActiveTab(type);
    
    if (type === 'room') {
      setEditingRoom(rooms.find(room => room.id === id) || null);
    } else if (type === 'spot') {
      setEditingSpot(spots.find(spot => spot.id === id) || null);
    }
  };

  return (
    <>
      <div>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as LocationType | 'tree')}>
          <TabsList className="w-full">
            <TabsTrigger value="tree">
              <FolderTree/>
              树形视图
            </TabsTrigger>
            <TabsTrigger value="area">
              <Home/>
              区域
            </TabsTrigger>
            <TabsTrigger value="room">
              <DoorOpen/>
              房间
            </TabsTrigger>
            <TabsTrigger value="spot">
              <MapPin/>
              具体位置
            </TabsTrigger>
          </TabsList>
          
          {/* 树形视图 */}
          <TabsContent value="tree">
            <div className="flex flex-col md:flex-row gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>位置树形结构</CardTitle>
                </CardHeader>
                <CardContent>
                  <LocationTreeSelect 
                    onSelect={handleLocationSelect}
                    selectedLocation={selectedLocation}
                    className="min-h-[400px]"
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* 区域管理 */}
          <TabsContent value="area">
            <div className="flex flex-col md:flex-row gap-6">
              {/* 添加区域卡片 */}
              <Card>
                <CardHeader>
                  <CardTitle>添加区域</CardTitle>
                  <CardDescription>
                    创建新的区域
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2">
                    <div className="flex-grow">
                      <Label htmlFor="areaName" className="sr-only">区域名称</Label>
                      <Input
                        id="areaName"
                        placeholder="输入区域名称，如：家、办公室"
                        value={newAreaName}
                        onChange={(e) => setNewAreaName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddArea()}
                      />
                    </div>
                    <Button 
                      onClick={handleAddArea}
                      disabled={loading}
                    >
                      {loading ? '处理中...' : '添加'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* 区域列表卡片 */}
              <Card>
                <CardHeader>
                  <CardTitle>区域列表</CardTitle>
                  <CardDescription>管理您的区域</CardDescription>
                </CardHeader>
                <CardContent>
                  {areas.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground">
                      暂无区域，请添加您的第一个区域
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {areas.map((area) => (
                        <div key={area.id} className="flex items-center justify-between p-2 border rounded-md">
                          {editingInlineAreaId === area.id ? (
                            <div className="flex items-center flex-1 mr-2">
                              <Input
                                value={editingAreaName}
                                onChange={(e) => setEditingAreaName(e.target.value)}
                                className="h-8"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleUpdateArea(area.id, editingAreaName);
                                  } else if (e.key === 'Escape') {
                                    setEditingInlineAreaId(null);
                                  }
                                }}
                              />
                            </div>
                          ) : (
                            <span>{area.name}</span>
                          )}
                          <div className="flex space-x-2">
                            {editingInlineAreaId === area.id ? (
                              <>
                                <Button 
                                  variant="outline" 
                                  size="icon"
                                  onClick={() => setEditingInlineAreaId(null)}
                                  className="h-8 w-8"
                                >
                                  <X/>
                                </Button>
                                <Button 
                                  variant="default" 
                                  size="icon"
                                  onClick={() => handleUpdateArea(area.id, editingAreaName)}
                                  className="h-8 w-8"
                                >
                                  <Check/>
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => {
                                    setEditingInlineAreaId(area.id);
                                    setEditingAreaName(area.name);
                                  }}
                                >
                                  <Pencil/>
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => confirmDelete(area.id, 'area')}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* 房间管理 */}
          <TabsContent value="room">
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
                    disabled={loading}
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
                              区域: {(room as any).area?.name || `未知区域 (ID: ${room.area_id})`}
                            </p>
                          </div>
                          <div className="flex space-x-2">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => setEditingRoom(room)}
                            >
                              <Pencil/>
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => confirmDelete(room.id, 'room')}
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
          </TabsContent>
          
          {/* 位置管理 */}
          <TabsContent value="spot">
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
                              {room.name} {(room as any).area?.name ? `(${(room as any).area.name})` : ''}
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
                    disabled={loading}
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
                              房间: {(spot as any).room?.name || `未知房间 (ID: ${spot.room_id})`}
                            </p>
                            {(spot as any).room?.area?.name && (
                              <p className="text-xs text-muted-foreground">
                                区域: {(spot as any).room.area.name}
                              </p>
                            )}
                          </div>
                          <div className="flex space-x-2">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => setEditingSpot(spot)}
                            >
                              <Pencil/>
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => confirmDelete(spot.id, 'spot')}
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
          </TabsContent>
        </Tabs>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              {itemToDelete?.type === 'area' && '删除区域将同时删除其下所有房间和位置。'}
              {itemToDelete?.type === 'room' && '删除房间将同时删除其下所有位置。'}
              此操作无法撤销，且可能影响已存储的物品。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive">
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
} 