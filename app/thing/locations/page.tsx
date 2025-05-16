"use client"

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Home, DoorOpen, MapPin, FolderTree, HelpCircle } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import ThingNavigation from '../components/ThingNavigation'
import AreaTab from './components/AreaTab'
import RoomTab from './components/RoomTab'
import SpotTab from './components/SpotTab'
import TreeViewTab from './components/TreeViewTab'
import DeleteConfirmDialog from './components/DeleteConfirmDialog'
import LocationsSpeedDial from './components/LocationsSpeedDial'
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
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">位置管理</h1>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="rounded-full p-1 hover:bg-muted">
                <HelpCircle className="h-5 w-5 text-muted-foreground" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p className="max-w-xs">
                在树形视图中，点击右下角加号按钮添加新位置。<br />
                点击文件夹按钮可以筛选显示区域或房间。
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as LocationType | 'tree')} className="mt-2">
        <TabsList className="w-full">
          <TabsTrigger value="tree" className="flex-1">
            <FolderTree className="h-4 w-4 mr-2"/>
            树形视图
          </TabsTrigger>
          <TabsTrigger value="area" className="flex-1">
            <Home className="h-4 w-4 mr-2"/>
            区域
          </TabsTrigger>
          <TabsTrigger value="room" className="flex-1">
            <DoorOpen className="h-4 w-4 mr-2"/>
            房间
          </TabsTrigger>
          <TabsTrigger value="spot" className="flex-1">
            <MapPin className="h-4 w-4 mr-2"/>
            具体位置
          </TabsTrigger>
        </TabsList>
        
        {/* 树形视图 */}
        <TabsContent value="tree" className="mt-4">
          <TreeViewTab
            selectedLocation={selectedLocation}
            onLocationSelect={handleTabLocationSelect}
          />
        </TabsContent>
        
        {/* 区域管理 */}
        <TabsContent value="area" className="mt-4">
          <AreaTab
            areas={areas}
            loading={loading}
            onAddArea={handleAddArea}
            onUpdateArea={handleUpdateArea}
            onDeleteArea={(areaId) => confirmDelete(areaId, 'area')}
          />
        </TabsContent>
        
        {/* 房间管理 */}
        <TabsContent value="room" className="mt-4">
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
        <TabsContent value="spot" className="mt-4">
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

      {/* 添加位置SpeedDial */}
      <LocationsSpeedDial
        activeTab={activeTab}
        areas={areas}
        rooms={rooms}
        loading={loading}
        onAddArea={handleAddArea}
        onAddRoom={handleAddRoom}
        onAddSpot={handleAddSpot}
      />
    </>
  )
} 