"use client"

import React, { useState } from "react"
import { Plus, Home, DoorOpen, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import { LocationType, Area, Room } from '../hooks/useLocationManagement'
import AddAreaDialog from './dialogs/AddAreaDialog'
import AddRoomDialog from './dialogs/AddRoomDialog'
import AddSpotDialog from './dialogs/AddSpotDialog'

interface LocationsSpeedDialProps {
  activeTab: LocationType | 'tree'
  areas: Area[]
  rooms: Room[]
  loading: boolean
  onAddArea: (name: string) => Promise<boolean | undefined>
  onAddRoom: (name: string, areaId: number) => Promise<boolean | undefined>
  onAddSpot: (name: string, roomId: number) => Promise<boolean | undefined>
}

export default function LocationsSpeedDial({
  activeTab,
  areas,
  rooms,
  loading,
  onAddArea,
  onAddRoom,
  onAddSpot
}: LocationsSpeedDialProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [dialogOpen, setDialogOpen] = useState<{
    area: boolean;
    room: boolean;
    spot: boolean;
  }>({
    area: false,
    room: false,
    spot: false
  })

  const handleToggleExpand = () => {
    setIsExpanded(!isExpanded)
  }

  const handleOpen = (type: 'area' | 'room' | 'spot') => {
    setIsExpanded(false)
    setDialogOpen(prev => ({
      ...prev,
      [type]: true
    }))
  }

  // 根据当前选项卡决定点击加号按钮时的行为
  const handleAddClick = () => {
    if (activeTab === 'tree') {
      // 在树形视图下展开菜单
      handleToggleExpand()
    } else {
      // 在其他视图下直接打开相应的添加对话框
      handleOpen(activeTab as 'area' | 'room' | 'spot')
    }
  }

  const speedDialButtons = [
    {
      type: 'area' as const,
      label: '区域',
      icon: <Home className="h-5 w-5" />,
      y: -190,
      delay: 0
    },
    {
      type: 'room' as const,
      label: '房间',
      icon: <DoorOpen className="h-5 w-5" />,
      y: -130,
      delay: 0.05
    },
    {
      type: 'spot' as const,
      label: '位置',
      icon: <MapPin className="h-5 w-5" />,
      y: -70,
      delay: 0.1
    }
  ]

  return (
    <>
      <div className="fixed bottom-24 right-6 z-50">
        <AnimatePresence>
          {isExpanded && (
            <>
              {speedDialButtons.map((button) => (
                <motion.div
                  key={button.type}
                  initial={{ opacity: 0, y: 0 }}
                  animate={{ opacity: 1, y: button.y }}
                  exit={{ opacity: 0, y: 0 }}
                  transition={{ duration: 0.2, delay: button.delay }}
                  className="absolute right-0 bottom-0"
                >
                  <Button
                    size="icon"
                    className="h-12 w-12 rounded-full shadow-md bg-[#78B15E] hover:bg-[#6CA052] text-white flex items-center justify-center gap-2"
                    onClick={() => handleOpen(button.type)}
                  >
                    {button.icon}
                  </Button>
                  <span className="absolute -left-16 top-3 text-sm font-medium bg-background px-2 py-1 rounded shadow-sm">
                    {button.label}
                  </span>
                </motion.div>
              ))}
            </>
          )}
        </AnimatePresence>
        
        {/* 主按钮 */}
        <motion.div
          animate={{ rotate: isExpanded ? 45 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <Button
            size="icon"
            className="h-14 w-14 rounded-full shadow-lg bg-[#78B15E] hover:bg-[#6CA052] text-white"
            onClick={handleAddClick}
          >
            <Plus className="h-6 w-6" />
          </Button>
        </motion.div>
      </div>
      
      {/* 区域添加对话框 */}
      <AddAreaDialog 
        open={dialogOpen.area} 
        onOpenChange={(open) => setDialogOpen(prev => ({ ...prev, area: open }))}
        onAddArea={onAddArea}
        loading={loading}
      />
      
      {/* 房间添加对话框 */}
      <AddRoomDialog 
        open={dialogOpen.room} 
        onOpenChange={(open) => setDialogOpen(prev => ({ ...prev, room: open }))}
        onAddRoom={onAddRoom}
        loading={loading}
        areas={areas}
      />
      
      {/* 位置添加对话框 */}
      <AddSpotDialog 
        open={dialogOpen.spot} 
        onOpenChange={(open) => setDialogOpen(prev => ({ ...prev, spot: open }))}
        onAddSpot={onAddSpot}
        loading={loading}
        rooms={rooms}
      />
    </>
  )
} 