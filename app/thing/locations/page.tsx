"use client"

import { useState, useEffect, useCallback } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Pencil, Trash2, Plus, Home, DoorOpen, MapPin, FolderTree, X, Check } from "lucide-react"
import { toast } from "sonner"
import ThingNavigation from '../components/ThingNavigation'
import { API_BASE_URL } from '@/configs/api'
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

// 定义类型
type LocationType = 'area' | 'room' | 'spot';
type Area = { id: number; name: string; };
type Room = { id: number; name: string; area_id: number; area?: Area; };
type Spot = { id: number; name: string; room_id: number; room?: Room; };

export default function Locations() {
  // 状态
  const [activeTab, setActiveTab] = useState<LocationType | 'tree'>('tree')
  const [areas, setAreas] = useState<Area[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [spots, setSpots] = useState<Spot[]>([])
  const [loading, setLoading] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<{id: number, type: LocationType} | null>(null)
  const [selectedLocation, setSelectedLocation] = useState<{ type: LocationType, id: number } | undefined>(undefined)
  
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

  // API请求通用函数
  const apiRequest = useCallback(async (endpoint: string, method: string = 'GET', body?: object) => {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`,
          'Accept': 'application/json',
          ...(body ? { 'Content-Type': 'application/json' } : {})
        },
        ...(body ? { body: JSON.stringify(body) } : {})
      });
      
      if (!response.ok) {
        throw new Error(`请求失败: ${response.status}`);
      }
      
      return method === 'DELETE' ? null : await response.json();
    } catch (error) {
      throw error;
    }
  }, []);

  // 获取所有区域
  const fetchAreas = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiRequest('/areas');
      setAreas(data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "获取区域失败");
    } finally {
      setLoading(false);
    }
  }, [apiRequest]);
  
  // 获取所有房间
  const fetchRooms = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiRequest('/rooms');
      setRooms(data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "获取房间失败");
    } finally {
      setLoading(false);
    }
  }, [apiRequest]);
  
  // 获取所有位置
  const fetchSpots = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiRequest('/spots');
      setSpots(data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "获取位置失败");
    } finally {
      setLoading(false);
    }
  }, [apiRequest]);

  // 加载数据
  useEffect(() => {
    fetchAreas();
  }, [fetchAreas]);
  
  // 当选择区域变化时，加载对应的房间
  useEffect(() => {
    if (activeTab === 'room' || activeTab === 'spot') {
      fetchRooms();
    }
  }, [activeTab, fetchRooms]);
  
  // 当选择房间变化时，加载对应的位置
  useEffect(() => {
    if (activeTab === 'spot') {
      fetchSpots();
    }
  }, [activeTab, fetchSpots]);

  // 添加区域
  const handleAddArea = async () => {
    if (!newAreaName.trim()) {
      toast.error("区域名称不能为空");
      return;
    }

    setLoading(true);
    try {
      await apiRequest('/areas', 'POST', { name: newAreaName });
      toast.success("区域创建成功");
      setNewAreaName('');
      fetchAreas();
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
      await apiRequest(`/areas/${areaId}`, 'PUT', { name: newName });
      toast.success("区域更新成功");
      setEditingInlineAreaId(null);
      fetchAreas();
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
      await apiRequest('/rooms', 'POST', { 
        name: newRoomName,
        area_id: parseInt(selectedAreaId)
      });
      toast.success("房间创建成功");
      setNewRoomName('');
      fetchRooms();
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
      await apiRequest(`/rooms/${editingRoom.id}`, 'PUT', { 
        name: editingRoom.name,
        area_id: editingRoom.area_id
      });
      toast.success("房间更新成功");
      setEditingRoom(null);
      fetchRooms();
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
      await apiRequest('/spots', 'POST', { 
        name: newSpotName,
        room_id: parseInt(selectedRoomId)
      });
      toast.success("位置创建成功");
      setNewSpotName('');
      fetchSpots();
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
      await apiRequest(`/spots/${editingSpot.id}`, 'PUT', { 
        name: editingSpot.name,
        room_id: editingSpot.room_id
      });
      toast.success("位置更新成功");
      setEditingSpot(null);
      fetchSpots();
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
      let endpoint = '';
      let successMessage = '';
      let refreshFunction;
      
      switch (itemToDelete.type) {
        case 'area':
          endpoint = `/areas/${itemToDelete.id}`;
          successMessage = '区域删除成功';
          refreshFunction = fetchAreas;
          break;
        case 'room':
          endpoint = `/rooms/${itemToDelete.id}`;
          successMessage = '房间删除成功';
          refreshFunction = fetchRooms;
          break;
        case 'spot':
          endpoint = `/spots/${itemToDelete.id}`;
          successMessage = '位置删除成功';
          refreshFunction = fetchSpots;
          break;
      }
      
      await apiRequest(endpoint, 'DELETE');
      toast.success(successMessage);
      refreshFunction();
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
    if (type === 'area') {
      setActiveTab('area');
    } else if (type === 'room') {
      setActiveTab('room');
      setEditingRoom(rooms.find(room => room.id === id) || null);
    } else if (type === 'spot') {
      setActiveTab('spot');
      setEditingSpot(spots.find(spot => spot.id === id) || null);
    }
  };

  return (
    <>
      <ThingNavigation />
      
      <div className="container mx-auto py-6 px-4">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as LocationType | 'tree')} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="tree" className="flex items-center">
              <FolderTree className="h-4 w-4" />
              树形视图
            </TabsTrigger>
            <TabsTrigger value="area" className="flex items-center">
              <Home className="h-4 w-4" />
              区域
            </TabsTrigger>
            <TabsTrigger value="room" className="flex items-center">
              <DoorOpen className="h-4 w-4" />
              房间
            </TabsTrigger>
            <TabsTrigger value="spot" className="flex items-center">
              <MapPin className="h-4 w-4" />
              具体位置
            </TabsTrigger>
          </TabsList>
          
          {/* 树形视图 */}
          <TabsContent value="tree">
            <div className="grid gap-6 md:grid-cols-2">
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
            <div className="grid gap-6 md:grid-cols-2">
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
                                  <X className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="default" 
                                  size="icon"
                                  onClick={() => handleUpdateArea(area.id, editingAreaName)}
                                  className="h-8 w-8"
                                >
                                  <Check className="h-4 w-4" />
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
                                  <Pencil className="h-4 w-4" />
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
            <div className="grid gap-6 md:grid-cols-2">
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
                              区域: {room.area?.name || `未知区域 (ID: ${room.area_id})`}
                            </p>
                          </div>
                          <div className="flex space-x-2">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => setEditingRoom(room)}
                            >
                              <Pencil className="h-4 w-4" />
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
            <div className="grid gap-6 md:grid-cols-2">
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
                              <Pencil className="h-4 w-4" />
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