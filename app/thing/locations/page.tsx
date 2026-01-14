'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Home, DoorOpen, MapPin, FolderTree } from 'lucide-react'
import { cn } from '@/lib/helpers'
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

  // 状态：统一管理所有四个选项，确保互斥
  const [activeTab, setActiveTab] = useState<LocationType | 'tree'>('tree')

  // 处理位置选择
  const handleTabLocationSelect = (type: LocationType, id: number) => {
    handleLocationSelect(type, id)
    setActiveTab(type)
  }

  // 所有tab项，包括树形视图
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
    <div className="mt-2">
      {/* 四个按钮放在同一行，但视觉上分为两组 */}
      <Tabs value={activeTab} onValueChange={value => setActiveTab(value as LocationType | 'tree')}>
        {/* 使用flex布局，让树形视图独立，后面三个作为一组 */}
        <div className="flex items-center gap-3">
          {/* 树形视图独立按钮 - 必须放在 TabsList 内，使用与右边三个相同的样式 */}
          <TabsList className="h-auto">
            <TabsTrigger value="tree" className="px-3">
              <FolderTree className="h-4 w-4" />
              树形视图
            </TabsTrigger>
          </TabsList>

          {/* 分隔线 */}
          <div className="bg-border h-6 w-px" />

          {/* 后面三个作为一组tabs */}
          <TabsList className="flex-1">
            {tabItems.slice(1).map(tab => (
              <TabsTrigger key={tab.value} value={tab.value} className="flex-1">
                {tab.icon}
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

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
