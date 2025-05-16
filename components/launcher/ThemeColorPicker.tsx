"use client"

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/helpers'
import { Plus, Check, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { configs } from '@/app/configs'
import { CustomTheme } from '@/app/types'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { hexToHSL } from '@/lib/helpers'

interface ThemeColorPickerProps {
  currentTheme: string
  customThemes: CustomTheme[]
  setCurrentTheme: (theme: string) => void
  addCustomTheme: (theme: CustomTheme) => void
  removeCustomTheme: (id: string) => void
}

export function ThemeColorPicker({
  currentTheme,
  customThemes,
  setCurrentTheme,
  addCustomTheme,
  removeCustomTheme
}: ThemeColorPickerProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newThemeName, setNewThemeName] = useState('')
  const [newThemeColor, setNewThemeColor] = useState('#3b82f6')
  
  // 处理主题选择
  const handleSelectTheme = (themeId: string) => {
    setCurrentTheme(themeId)
    toast.success("主题已更新")
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
    setIsDialogOpen(false)
    setNewThemeName('')
    setNewThemeColor('#3b82f6')
    toast.success("自定义主题已添加")
  }
  
  // 处理删除自定义主题
  const handleRemoveCustomTheme = (e: React.MouseEvent, themeId: string) => {
    e.stopPropagation()
    removeCustomTheme(themeId)
    toast.success("自定义主题已删除")
  }
  
  // 渲染主题色彩按钮
  const renderThemeButton = (theme: CustomTheme, isCustom = false) => (
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
        onClick={() => handleSelectTheme(theme.id)}
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
          onClick={(e) => handleRemoveCustomTheme(e, theme.id)}
          title={`删除 ${theme.name}`}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      )}
    </motion.div>
  )
  
  return (
    <div className="flex items-center space-x-3 overflow-x-auto scrollbar-none">
      {/* 预设主题 */}
      {configs.themeColors.map(theme => renderThemeButton(theme))}
      
      {/* 用户自定义主题 */}
      {customThemes.map(theme => renderThemeButton(theme, true))}
      
      {/* 添加自定义主题按钮 */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
    </div>
  )
}