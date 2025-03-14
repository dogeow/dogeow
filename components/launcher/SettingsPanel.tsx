"use client"

import React from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import { toast } from 'sonner'
import launcherItems from '@/configs/app/launcher'
import { BackButton } from '@/components/ui/back-button'

type DisplayMode = 'music' | 'apps' | 'settings';

// 可用的音频文件列表
const systemBackgrounds = launcherItems.systemBackgrounds;

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
      <BackButton 
        onClick={() => toggleDisplayMode('apps')}
        className="shrink-0"
        
      />
      
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