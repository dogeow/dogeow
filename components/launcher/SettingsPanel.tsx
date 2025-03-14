"use client"

import React from 'react'
import { ArrowLeft, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import { toast } from 'sonner'

type DisplayMode = 'music' | 'apps' | 'settings';

// 系统提供的背景图列表
const systemBackgrounds = [
  { id: "none", name: "无背景", url: "" },
  { id: "bg1", name: "你的名字？·untitled", url: "/backgrounds/wallhaven-72rd8e_2560x1440-1.webp" },
  { id: "bg2", name: "书房·我的世界", url: "/backgrounds/我的世界.png" },
  { id: "bg3", name: "2·untitled", url: "/backgrounds/F_RIhiObMAA-c8N.jpeg" },
]

export type CustomBackground = {id: string, name: string, url: string};

export interface SettingsPanelProps {
  toggleDisplayMode: (mode: DisplayMode) => void
  backgroundImage: string
  setBackgroundImage: (url: string) => void
  customBackgrounds: CustomBackground[]
  setCustomBackgrounds: React.Dispatch<React.SetStateAction<CustomBackground[]>>
}

export function SettingsPanel({ 
  toggleDisplayMode, 
  backgroundImage, 
  setBackgroundImage,
  customBackgrounds,
  setCustomBackgrounds
}: SettingsPanelProps) {
  // 设置背景图片
  const handleSetBackground = (url: string) => {
    setBackgroundImage(url)
    toast.success("背景已更新")
  }
  
  // 处理用户上传背景图片
  const handleUploadBackground = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      const reader = new FileReader()
      
      reader.onload = (event) => {
        if (event.target && typeof event.target.result === 'string') {
          const newBackground = {
            id: `custom-${Date.now()}`,
            name: `自定义-${file.name}`,
            url: event.target.result
          }
          
          setCustomBackgrounds(prev => [...prev, newBackground])
          handleSetBackground(newBackground.url)
          toast.success("自定义背景已上传")
        }
      }
      
      reader.readAsDataURL(file)
    }
  }
  
  // 渲染背景选项按钮
  const renderBackgroundButton = (bg: {id: string, name: string, url: string}) => (
    <motion.div
      key={bg.id}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="shrink-0"
    >
      <Button 
        variant="ghost" 
        className={cn(
          "p-1 h-9 w-9 rounded-md overflow-hidden relative",
          backgroundImage === bg.url && "ring-2 ring-primary"
        )}
        onClick={() => handleSetBackground(bg.url)}
        title={bg.name}
      >
        {bg.url ? (
          <Image src={bg.url} alt={bg.name} fill className="object-cover" />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <span className="text-xs">无</span>
          </div>
        )}
      </Button>
    </motion.div>
  )
  
  return (
    <div className="flex items-center space-x-3 overflow-x-auto scrollbar-none">
      {/* 返回按钮 */}
      <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-7 w-7 mr-1 shrink-0" 
          onClick={() => toggleDisplayMode('apps')}
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="sr-only">返回</span>
        </Button>
      </motion.div>
      
      {/* 背景图片选项 */}
      {systemBackgrounds.map(bg => renderBackgroundButton(bg))}
      
      {/* 用户自定义背景 */}
      {customBackgrounds.map(bg => renderBackgroundButton(bg))}
      
      {/* 上传按钮 */}
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="shrink-0">
        <label 
          className={cn(
            "p-1 h-9 w-9 rounded-md overflow-hidden relative flex items-center justify-center cursor-pointer",
            "bg-primary/10 hover:bg-primary/20 border-2 border-dashed border-primary/30"
          )}
          title="上传自定义背景"
        >
          <Plus className="h-5 w-5 text-primary/70" />
          <input type="file" accept="image/*" className="hidden" onChange={handleUploadBackground} />
        </label>
      </motion.div>
    </div>
  )
} 