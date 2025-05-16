"use client"

import React, { useState } from "react"
import { Plus, Home, DoorOpen, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import { LocationType } from '../hooks/useLocationManagement'
import AddAreaDialog from './dialogs/AddAreaDialog'
import AddRoomDialog from './dialogs/AddRoomDialog'
import AddSpotDialog from './dialogs/AddSpotDialog'
import { Area, Room } from '../hooks/useLocationManagement'

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
  const [areaDialogOpen, setAreaDialogOpen] = useState(false)
  const [roomDialogOpen, setRoomDialogOpen] = useState(false)
  const [spotDialogOpen, setSpotDialogOpen] = useState(false)

  const handleToggleExpand = () => {
    setIsExpanded(!isExpanded)
  }

  const handleOpen = (type: 'area' | 'room' | 'spot') => {
    setIsExpanded(false)
    
    switch (type) {
      case 'area':
        setAreaDialogOpen(true)
        break
      case 'room':
        setRoomDialogOpen(true)
        break
      case 'spot':
        setSpotDialogOpen(true)
        break
    }
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

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50">
        <AnimatePresence>
          {isExpanded && (
            <>
              {/* 区域按钮 */}
              <motion.div
                initial={{ opacity: 0, y: 0 }}
                animate={{ opacity: 1, y: -140 }}
                exit={{ opacity: 0, y: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 bottom-0"
              >
                <Button
                  size="icon"
                  className="h-12 w-12 rounded-full shadow-md bg-[#78B15E] hover:bg-[#6CA052] text-white flex items-center justify-center gap-2"
                  onClick={() => handleOpen('area')}
                >
                  <Home className="h-5 w-5" />
                </Button>
                <span className="absolute -left-16 top-3 text-sm font-medium bg-background px-2 py-1 rounded shadow-sm">区域</span>
              </motion.div>
              
              {/* 房间按钮 */}
              <motion.div
                initial={{ opacity: 0, y: 0 }}
                animate={{ opacity: 1, y: -80 }}
                exit={{ opacity: 0, y: 0 }}
                transition={{ duration: 0.2, delay: 0.05 }}
                className="absolute right-0 bottom-0"
              >
                <Button
                  size="icon"
                  className="h-12 w-12 rounded-full shadow-md bg-[#78B15E] hover:bg-[#6CA052] text-white flex items-center justify-center gap-2"
                  onClick={() => handleOpen('room')}
                >
                  <DoorOpen className="h-5 w-5" />
                </Button>
                <span className="absolute -left-16 top-3 text-sm font-medium bg-background px-2 py-1 rounded shadow-sm">房间</span>
              </motion.div>
              
              {/* 位置按钮 */}
              <motion.div
                initial={{ opacity: 0, y: 0 }}
                animate={{ opacity: 1, y: -20 }}
                exit={{ opacity: 0, y: 0 }}
                transition={{ duration: 0.2, delay: 0.1 }}
                className="absolute right-0 bottom-0"
              >
                <Button
                  size="icon"
                  className="h-12 w-12 rounded-full shadow-md bg-[#78B15E] hover:bg-[#6CA052] text-white flex items-center justify-center gap-2"
                  onClick={() => handleOpen('spot')}
                >
                  <MapPin className="h-5 w-5" />
                </Button>
                <span className="absolute -left-16 top-3 text-sm font-medium bg-background px-2 py-1 rounded shadow-sm">位置</span>
              </motion.div>
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
        open={areaDialogOpen} 
        onOpenChange={setAreaDialogOpen}
        onAddArea={onAddArea}
        loading={loading}
      />
      
      {/* 房间添加对话框 */}
      <AddRoomDialog 
        open={roomDialogOpen} 
        onOpenChange={setRoomDialogOpen}
        onAddRoom={onAddRoom}
        loading={loading}
        areas={areas}
      />
      
      {/* 位置添加对话框 */}
      <AddSpotDialog 
        open={spotDialogOpen} 
        onOpenChange={setSpotDialogOpen}
        onAddSpot={onAddSpot}
        loading={loading}
        rooms={rooms}
      />
    </>
  )
} 