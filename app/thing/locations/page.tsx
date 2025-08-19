'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Home, DoorOpen, MapPin, FolderTree } from 'lucide-react'
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
    handleAddArea,
    handleUpdateArea,
    handleSetDefaultArea,
    handleAddRoom,
    handleUpdateRoom,
    handleAddSpot,
    handleUpdateSpot,
    confirmDelete,
    handleDelete,
    handleLocationSelect,
  } = useLocationManagement()

  // 状态
  const [activeTab, setActiveTab] = useState<LocationType | 'tree'>('tree')

  // 处理位置选择
  const handleTabLocationSelect = (type: LocationType, id: number) => {
    handleLocationSelect(type, id)
    setActiveTab(type)
  }

  const tabItems = [
    { value: 'tree', icon: <FolderTree className="h-4 w-4" />, label: '树形视图' },
    { value: 'area', icon: <Home className="h-4 w-4" />, label: '区域' },
    { value: 'room', icon: <DoorOpen className="h-4 w-4" />, label: '房间' },
    { value: 'spot', icon: <MapPin className="h-4 w-4" />, label: '具体位置' },
  ]

  // Tab内容配置
  const tabContents = {
    tree: (
      <TreeViewTab selectedLocation={selectedLocation} onLocationSelect={handleTabLocationSelect} />
    ),
    area: (
      <AreaTab
        areas={areas}
        loading={loading}
        onAddArea={handleAddArea}
        onUpdateArea={handleUpdateArea}
        onDeleteArea={areaId => confirmDelete(areaId, 'area')}
        onSetDefaultArea={handleSetDefaultArea}
      />
    ),
    room: (
      <RoomTab
        rooms={rooms}
        areas={areas}
        loading={loading}
        onAddRoom={handleAddRoom}
        onUpdateRoom={handleUpdateRoom}
        onDeleteRoom={roomId => confirmDelete(roomId, 'room')}
      />
    ),
    spot: (
      <SpotTab
        spots={spots}
        rooms={rooms}
        loading={loading}
        onAddSpot={handleAddSpot}
        onUpdateSpot={handleUpdateSpot}
        onDeleteSpot={spotId => confirmDelete(spotId, 'spot')}
      />
    ),
  }

  return (
    <div>
      <Tabs
        value={activeTab}
        onValueChange={value => setActiveTab(value as LocationType | 'tree')}
        className="mt-2"
      >
        <TabsList className="w-full">
          {tabItems.map(tab => (
            <TabsTrigger key={tab.value} value={tab.value} className="flex-1">
              {tab.icon}
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {Object.entries(tabContents).map(([key, content]) => (
          <TabsContent key={key} value={key} className="mt-4">
            {content}
          </TabsContent>
        ))}
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
        areas={areas}
        rooms={rooms}
        loading={loading}
        onAddArea={handleAddArea}
        onAddRoom={handleAddRoom}
        onAddSpot={handleAddSpot}
      />
    </div>
  )
}
