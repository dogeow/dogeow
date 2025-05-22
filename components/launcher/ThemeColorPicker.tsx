"use client"

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/helpers'
import { Check, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { configs } from '@/app/configs'
import { CustomTheme } from '@/app/types'
import { AddThemeDialog } from './AddThemeDialog'
import { useThemeStore } from '@/stores/themeStore'

export function ThemeColorPicker() {
  const { currentTheme, customThemes, setCurrentTheme, addCustomTheme, removeCustomTheme } = useThemeStore()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newThemeName, setNewThemeName] = useState('')
  const [newThemeColor, setNewThemeColor] = useState('#3b82f6')

  // 计算当前选中的主题id，没选过时默认第一个
  const selectedThemeId = currentTheme || configs.themeColors[0].id;

  // 处理主题选择
  const handleSelectTheme = (themeId: string) => {
    setCurrentTheme(themeId)
    toast.success("主题已更新")
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
          "p-1 h-9 w-9 rounded-md overflow-hidden relative border-2 border-transparent flex items-center justify-center transition-colors duration-150",
          selectedThemeId === theme.id && "ring-2 ring-primary border-primary"
        )}
        onClick={() => handleSelectTheme(theme.id)}
        title={theme.name}
        style={{ background: "none", minWidth: 36, minHeight: 36 }}
      >
        <div
          className="absolute inset-0 rounded-md"
          style={{ backgroundColor: theme.color, zIndex: 0 }}
        />
        {selectedThemeId === theme.id && (
          <Check className="h-5 w-5 text-white z-10 relative" />
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
      <AddThemeDialog onAddTheme={addCustomTheme} />
    </div>
  )
}