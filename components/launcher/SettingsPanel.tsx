"use client"

import React from 'react'
import { Plus, Palette, Image as ImageIcon, Check, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import { toast } from 'sonner'
import launcherItems from '@/configs/app/launcher'
import { BackButton } from '@/components/ui/back-button'
import { ThemeColorPicker } from './ThemeColorPicker'
import { useThemeStore } from '@/stores/themeStore'
import { themeColors } from '@/configs/app/themes'

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
  const { currentTheme, customThemes, setCurrentTheme, addCustomTheme, removeCustomTheme } = useThemeStore()
  
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
  
  // 渲染主题色彩按钮
  const renderThemeButton = (theme: {id: string, name: string, color: string}, isCustom = false) => (
    <motion.div
      key={theme.id}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="shrink-0 relative"
    >
      <Button 
        variant="ghost" 
        className={cn(
          "p-1 h-9 w-9 rounded-md overflow-hidden relative",
          currentTheme === theme.id && "ring-2 ring-primary"
        )}
        onClick={() => setCurrentTheme(theme.id)}
        title={theme.name}
        style={{ backgroundColor: theme.color }}
      >
        {currentTheme === theme.id && (
          <Check className="h-5 w-5 text-white" />
        )}
      </Button>
    </motion.div>
  )
  
  return (
    <div className="w-full flex items-center space-x-3 overflow-x-auto scrollbar-none">
      {/* 返回按钮 */}
      <BackButton 
        onClick={() => toggleDisplayMode('apps')}
        className="shrink-0"
      />
      
      <div className="flex items-center gap-2 shrink-0">
        <ImageIcon className="h-4 w-4" />
        <span className="text-sm font-medium">背景</span>
      </div>
      
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
      
      <div className="w-px h-8 bg-border mx-2 shrink-0"></div>
      
      <div className="flex items-center gap-2 shrink-0">
        <Palette className="h-4 w-4" />
        <span className="text-sm font-medium">主题</span>
      </div>
      
      {/* 预设主题色 */}
      {themeColors.map(theme => (
        <motion.div
          key={theme.id}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="shrink-0 relative"
        >
          <Button 
            variant="ghost" 
            className={cn(
              "p-1 h-9 w-9 rounded-md overflow-hidden relative",
              currentTheme === theme.id && "ring-2 ring-primary"
            )}
            onClick={() => setCurrentTheme(theme.id)}
            title={theme.name}
            style={{ backgroundColor: theme.color }}
          >
            {currentTheme === theme.id && (
              <Check className="h-5 w-5 text-white" />
            )}
          </Button>
        </motion.div>
      ))}
      
      {/* 用户自定义主题 */}
      {customThemes.map(theme => (
        <motion.div
          key={theme.id}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="shrink-0 relative"
        >
          <Button 
            variant="ghost" 
            className={cn(
              "p-1 h-9 w-9 rounded-md overflow-hidden relative",
              currentTheme === theme.id && "ring-2 ring-primary"
            )}
            onClick={() => setCurrentTheme(theme.id)}
            title={theme.name}
            style={{ backgroundColor: theme.color }}
          >
            {currentTheme === theme.id && (
              <Check className="h-5 w-5 text-white" />
            )}
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-background border shadow-sm hover:bg-destructive hover:text-destructive-foreground"
            onClick={(e) => {
              e.stopPropagation();
              removeCustomTheme(theme.id);
            }}
            title={`删除 ${theme.name}`}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </motion.div>
      ))}
      
      {/* 添加自定义主题按钮 */}
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="shrink-0">
        <Button 
          variant="ghost"
          className={cn(
            "p-1 h-9 w-9 rounded-md overflow-hidden relative flex items-center justify-center",
            "bg-primary/10 hover:bg-primary/20 border-2 border-dashed border-primary/30"
          )}
          title="添加自定义主题"
          onClick={() => {
            // 简单实现：添加一个随机颜色的主题
            const randomColor = `#${Math.floor(Math.random()*16777215).toString(16)}`;
            const newTheme = {
              id: `custom-${Date.now()}`,
              name: `自定义主题`,
              primary: `hsl(${Math.floor(Math.random()*360)} 80% 50%)`,
              color: randomColor
            };
            addCustomTheme(newTheme);
            toast.success("添加了随机颜色主题");
          }}
        >
          <Plus className="h-5 w-5 text-primary/70" />
        </Button>
      </motion.div>
    </div>
  )
} 