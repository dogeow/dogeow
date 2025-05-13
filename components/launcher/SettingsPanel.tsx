"use client"

import React, { useState } from 'react'
import { Plus, Palette, Image as ImageIcon, Check, Trash2, Computer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import { toast } from 'sonner'
import { BackButton } from '@/components/ui/back-button'
import { useThemeStore } from '@/stores/themeStore'
import { configs } from '@/app/configs'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { hexToHSL } from '@/lib/color-utils'
import type { CustomTheme } from '@/app/types'

type DisplayMode = 'music' | 'apps' | 'settings';
type SettingsView = 'main' | 'background' | 'theme';

// 系统背景列表
const systemBackgrounds = configs.systemBackgrounds;
// 系统主题列表
const themeColors = configs.themeColors;

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
  const { currentTheme, customThemes, setCurrentTheme, removeCustomTheme, followSystem, setFollowSystem, addCustomTheme } = useThemeStore()
  const [currentView, setCurrentView] = useState<SettingsView>('main')
  const [isThemeDialogOpen, setIsThemeDialogOpen] = useState(false)
  const [newThemeName, setNewThemeName] = useState('')
  const [newThemeColor, setNewThemeColor] = useState('#3b82f6')
  
  // 设置背景图片
  const handleSetBackground = (url: string) => {
    setBackgroundImage(url)
    toast.success("背景已更新")
  }
  
  // 处理用户上传背景图片
  const handleUploadBackground = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = (event) => {
      const result = event.target?.result
      if (typeof result === 'string') {
        const newBackground = {
          id: `custom-${Date.now()}`,
          name: `自定义-${file.name}`,
          url: result
        }
        
        setCustomBackgrounds(prev => [...prev, newBackground])
        handleSetBackground(newBackground.url)
        toast.success("自定义背景已上传")
      }
    }
    
    reader.readAsDataURL(file)
  }
  
  // 处理跟随系统选项切换
  const handleToggleFollowSystem = (checked: boolean) => {
    setFollowSystem(checked)
    toast.success(checked ? "已启用跟随系统主题" : "已关闭跟随系统主题")
  }
  
  // 处理添加自定义主题
  const handleAddCustomTheme = () => {
    if (!newThemeName.trim()) {
      toast.error("请输入主题名称")
      return
    }
    
    const hslColor = hexToHSL(newThemeColor)
    const newTheme: CustomTheme = {
      id: `custom-${Date.now()}`,
      name: newThemeName,
      primary: hslColor,
      color: newThemeColor
    }
    
    addCustomTheme(newTheme)
    setCurrentTheme(newTheme.id)
    setIsThemeDialogOpen(false)
    setNewThemeName('')
    setNewThemeColor('#3b82f6')
    toast.success("自定义主题已添加")
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
          <Image src={`/images/backgrounds/${bg.url}`} alt={bg.name} fill className="object-cover" />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <span className="text-xs">无</span>
          </div>
        )}
      </Button>
    </motion.div>
  )
  
  // 渲染分隔线
  const renderDivider = () => (
    <div className="w-px h-8 bg-border mx-2 shrink-0"></div>
  )
  
  // 渲染主视图（选项列表）
  const renderMainView = () => (
    <>
      <Button
        variant="ghost"
        className="flex items-center gap-2 shrink-0 h-9 px-3"
        onClick={() => setCurrentView('background')}
      >
        <ImageIcon className="h-4 w-4" />
        <span className="text-sm font-medium">背景</span>
      </Button>
      
      <Button
        variant="ghost"
        className="flex items-center gap-2 shrink-0 h-9 px-3"
        onClick={() => setCurrentView('theme')}
      >
        <Palette className="h-4 w-4" />
        <span className="text-sm font-medium">主题</span>
      </Button>
      
      {renderDivider()}
      
      {/* 跟随系统选项 */}
      <div className="flex items-center gap-2 h-9 px-3 shrink-0">
        <Computer className="h-4 w-4" />
        <Label htmlFor="follow-system" className="text-sm font-medium cursor-pointer">
          跟随系统
        </Label>
        <Switch
          id="follow-system"
          checked={followSystem}
          onCheckedChange={handleToggleFollowSystem}
        />
      </div>
    </>
  )
  
  // 渲染背景设置视图
  const renderBackgroundView = () => (
    <>
      <BackButton 
        onClick={() => setCurrentView('main')}
        className="shrink-0"
      />
      
      {renderDivider()}
      
      {/* 背景图片选项 */}
      {systemBackgrounds.map(renderBackgroundButton)}
      
      {/* 用户自定义背景 */}
      {customBackgrounds.map(renderBackgroundButton)}
      
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
    </>
  )
  
  // 渲染主题色按钮
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
      
      {isCustom && (
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
      )}
    </motion.div>
  )
  
  // 渲染主题设置视图
  const renderThemeView = () => (
    <>
      <BackButton 
        onClick={() => setCurrentView('main')}
        className="shrink-0"
      />
      
      {renderDivider()}
      
      {/* 预设主题色 */}
      {themeColors.map(theme => renderThemeButton(theme))}
      
      {/* 用户自定义主题 */}
      {customThemes.map(theme => renderThemeButton(theme, true))}
      
      {/* 添加自定义主题按钮 */}
      <Dialog open={isThemeDialogOpen} onOpenChange={setIsThemeDialogOpen}>
        <DialogTrigger asChild>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="shrink-0">
            <Button 
              variant="ghost"
              className={cn(
                "p-1 h-9 w-9 rounded-md overflow-hidden relative flex items-center justify-center",
                "bg-primary/10 hover:bg-primary/20 border-2 border-dashed border-primary/30"
              )}
              title="添加自定义主题"
            >
              <Plus className="h-5 w-5 text-primary/70" />
            </Button>
          </motion.div>
        </DialogTrigger>
        
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>添加自定义主题</DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="theme-name" className="text-right">
                主题名称
              </Label>
              <Input
                id="theme-name"
                value={newThemeName}
                onChange={(e) => setNewThemeName(e.target.value)}
                className="col-span-3"
                placeholder="例如：我的主题"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="theme-color" className="text-right">
                主题颜色
              </Label>
              <div className="col-span-3 flex items-center gap-2">
                <div 
                  className="h-8 w-8 rounded-md border"
                  style={{ backgroundColor: newThemeColor }}
                />
                <Input
                  id="theme-color"
                  type="color"
                  value={newThemeColor}
                  onChange={(e) => setNewThemeColor(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button onClick={handleAddCustomTheme}>添加主题</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
  
  return (
    <div className="w-full flex items-center space-x-3 overflow-x-auto scrollbar-none">
      {currentView === 'main' ? (
        <>
          {/* 返回按钮 */}
          <BackButton 
            onClick={() => toggleDisplayMode('apps')}
            className="shrink-0"
          />
          
          {renderDivider()}
          
          {/* 主视图选项 */}
          {renderMainView()}
        </>
      ) : currentView === 'background' ? (
        renderBackgroundView()
      ) : (
        renderThemeView()
      )}
    </div>
  )
} 