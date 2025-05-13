"use client"

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Home, DoorOpen, MapPin, FolderTree } from "lucide-react"
import ThingNavigation from '../components/ThingNavigation'
import AreaTab from './components/AreaTab'
import RoomTab from './components/RoomTab'
import SpotTab from './components/SpotTab'
import TreeViewTab from './components/TreeViewTab'
import DeleteConfirmDialog from './components/DeleteConfirmDialog'
import { useLocationManagement, LocationType } from './hooks/useLocationManagement'

export default function Locations() {
  // 使用自定义hook管理位置相关的状态和操作
  const {
    areas,
    rooms, 
    spots,
    loading,
    deleteDialogOpen,
    setDeleteDialogOpen,
    itemToDelete,
    selectedLocation,
    setSelectedLocation,
    handleAddArea,
    handleUpdateArea,
    handleAddRoom,
    handleUpdateRoom,
    handleAddSpot,
    handleUpdateSpot,
    confirmDelete,
    handleDelete,
    handleLocationSelect
  } = useLocationManagement();

  // 状态
  const [activeTab, setActiveTab] = useState<LocationType | 'tree'>('tree')

  // 处理位置选择
  const handleTabLocationSelect = (type: LocationType, id: number, fullPath: string) => {
    handleLocationSelect(type, id, fullPath);
    setActiveTab(type);
  };

  return (
    <>
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as LocationType | 'tree')}>
        <TabsList className="w-full">
          <TabsTrigger value="tree">
            <FolderTree className="h-4 w-4 mr-2"/>
            树形视图
          </TabsTrigger>
          <TabsTrigger value="area">
            <Home className="h-4 w-4 mr-2"/>
            区域
          </TabsTrigger>
          <TabsTrigger value="room">
            <DoorOpen className="h-4 w-4 mr-2"/>
            房间
          </TabsTrigger>
          <TabsTrigger value="spot">
            <MapPin className="h-4 w-4 mr-2"/>
            具体位置
          </TabsTrigger>
        </TabsList>
        
        {/* 树形视图 */}
        <TabsContent value="tree">
          <TreeViewTab
            selectedLocation={selectedLocation}
            onLocationSelect={handleTabLocationSelect}
          />
        </TabsContent>
        
        {/* 区域管理 */}
        <TabsContent value="area">
          <AreaTab
            areas={areas}
            loading={loading}
            onAddArea={handleAddArea}
            onUpdateArea={handleUpdateArea}
            onDeleteArea={(areaId) => confirmDelete(areaId, 'area')}
          />
        </TabsContent>
        
        {/* 房间管理 */}
        <TabsContent value="room">
          <RoomTab
            rooms={rooms}
            areas={areas}
            loading={loading}
            onAddRoom={handleAddRoom}
            onUpdateRoom={handleUpdateRoom}
            onDeleteRoom={(roomId) => confirmDelete(roomId, 'room')}
          />
        </TabsContent>
        
        {/* 位置管理 */}
        <TabsContent value="spot">
          <SpotTab
            spots={spots}
            rooms={rooms}
            loading={loading}
            onAddSpot={handleAddSpot}
            onUpdateSpot={handleUpdateSpot}
            onDeleteSpot={(spotId) => confirmDelete(spotId, 'spot')}
          />
        </TabsContent>
      </Tabs>

      {/* 删除确认对话框 */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        itemToDelete={itemToDelete}
        onConfirm={handleDelete}
      />
    </>
  )
} 