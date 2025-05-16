"use client"

import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Upload, Pencil, Box, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

interface SpeedDialAction {
  icon: React.ElementType
  name: string
  color?: string
  onClick: () => void
}

interface SpeedDialProps {
  actions: SpeedDialAction[]
}

export function SpeedDial({ actions }: SpeedDialProps) {
  const [open, setOpen] = useState(false)

  const toggleOpen = () => setOpen(!open)

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {open && (
          <div className="absolute bottom-16 right-0 flex flex-col-reverse items-end gap-4">
            {actions.map((action, index) => (
              <motion.div
                key={action.name}
                className="flex items-center"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ 
                  delay: index * 0.05,
                  ease: "easeOut"
                }}
              >
                <motion.div 
                  className="bg-white shadow-lg rounded-lg px-4 py-2 mr-3 text-sm font-medium whitespace-nowrap"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.05 + 0.1 }}
                >
                  {action.name}
                </motion.div>
                <Button
                  size="icon"
                  className="h-14 w-14 rounded-full shadow-lg text-white"
                  style={{ backgroundColor: action.color || "var(--primary)" }}
                  onClick={() => {
                    action.onClick()
                    setOpen(false)
                  }}
                >
                  {React.createElement(action.icon, { className: "h-6 w-6" })}
                </Button>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      <Button
        size="icon"
        className="h-14 w-14 rounded-full shadow-lg bg-[#78B15E] hover:bg-[#6CA052] text-white"
        onClick={toggleOpen}
      >
        <Plus className="h-6 w-6" />
      </Button>
    </div>
  )
}

export default function ThingSpeedDial() {
  const router = useRouter()
  
  const actions: SpeedDialAction[] = [
    {
      icon: Box,
      name: "添加物品",
      color: "#78B15E", // 绿色
      onClick: () => router.push("/thing/add")
    },
    {
      icon: Upload,
      name: "导入物品",
      color: "#4A99E9", // 蓝色
      onClick: () => router.push("/thing/import")
    },
    {
      icon: Pencil,
      name: "批量编辑",
      color: "#F39C12", // 橙色
      onClick: () => router.push("/thing/bulk-edit")
    },
    {
      icon: FileText,
      name: "未分类",
      color: "#808080", // 灰色
      onClick: () => router.push("/thing/uncategorized")
    }
  ]
  
  return <SpeedDial actions={actions} />
} 