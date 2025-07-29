'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { useThemeStore } from '@/stores/themeStore'
import { useProjectCoverStore } from '@/stores/projectCoverStore'
import { hexToHSL } from '@/lib/helpers'
import type { CustomTheme } from '@/app/types'
import type { CustomBackground } from '../SettingsPanel'

type SettingsView = 'main' | 'background' | 'theme' | 'language'

interface UseSettingsPanelProps {
  backgroundImage: string
  setBackgroundImage: (url: string) => void
  customBackgrounds: CustomBackground[]
  setCustomBackgrounds: React.Dispatch<React.SetStateAction<CustomBackground[]>>
}

export function useSettingsPanel({
  setBackgroundImage,
  setCustomBackgrounds,
}: UseSettingsPanelProps) {
  const {
    currentTheme,
    customThemes,
    setCurrentTheme,
    removeCustomTheme,
    followSystem,
    setFollowSystem,
    addCustomTheme,
  } = useThemeStore()

  const { showProjectCovers, setShowProjectCovers } = useProjectCoverStore()

  const [currentView, setCurrentView] = useState<SettingsView>('main')

  // 设置背景图片
  const handleSetBackground = (url: string) => {
    setBackgroundImage(url)
    toast.success('Background updated')
  }

  // 处理用户上传背景图片
  const handleUploadBackground = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = event => {
      const result = event.target?.result
      if (typeof result === 'string') {
        const newBackground = {
          id: `custom-${Date.now()}`,
          name: `Custom-${file.name}`,
          url: result,
        }

        setCustomBackgrounds(prev => [...prev, newBackground])
        handleSetBackground(newBackground.url)
        toast.success('Custom background uploaded')
      }
    }

    reader.readAsDataURL(file)
  }

  // 处理跟随系统选项切换
  const handleToggleFollowSystem = (checked: boolean) => {
    setFollowSystem(checked)
    toast.success(checked ? 'System theme enabled' : 'System theme disabled')
  }

  // 处理功能封面图选项切换
  const handleToggleProjectCovers = (checked: boolean) => {
    setShowProjectCovers(checked)
    toast.success(checked ? 'Project covers enabled' : 'Project covers disabled')
  }

  // 处理添加自定义主题
  const handleAddCustomTheme = (name: string, color: string) => {
    const hslColor = hexToHSL(color)
    const newTheme: CustomTheme = {
      id: `custom-${Date.now()}`,
      name,
      primary: hslColor,
      color,
    }

    addCustomTheme(newTheme)
    setCurrentTheme(newTheme.id)
    toast.success('Custom theme added')
  }

  // 处理删除自定义主题
  const handleRemoveCustomTheme = (id: string) => {
    removeCustomTheme(id)
    toast.success('Theme removed')
  }

  return {
    // 状态
    currentView,
    currentTheme,
    customThemes,
    followSystem,
    showProjectCovers,

    // 导航方法
    setCurrentView,

    // 背景相关方法
    handleSetBackground,
    handleUploadBackground,

    // 主题相关方法
    setCurrentTheme,
    handleAddCustomTheme,
    handleRemoveCustomTheme,

    // 系统设置方法
    handleToggleFollowSystem,
    handleToggleProjectCovers,
  }
}
