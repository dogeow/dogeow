'use client'

import React, { useState, useEffect } from 'react'
import { Palette, Image, Grid, Languages, Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { SettingsDivider } from './SettingsDivider'
import { useTheme } from 'next-themes'
import { useThemeStore } from '@/stores/themeStore'

interface MainViewProps {
  onNavigateToBackground: () => void
  onNavigateToTheme: () => void
  onNavigateToLanguage: () => void
  followSystem: boolean
  onToggleFollowSystem: (checked: boolean) => void
  showProjectCovers: boolean
  onToggleProjectCovers: (checked: boolean) => void
}

export function MainView({
  onNavigateToBackground,
  onNavigateToTheme,
  onNavigateToLanguage,
  followSystem,
  onToggleFollowSystem,
  showProjectCovers,
  onToggleProjectCovers,
}: MainViewProps) {
  const { theme, setTheme } = useTheme()
  const { setFollowSystem } = useThemeStore()
  const [mounted, setMounted] = useState(false)

  // 等待组件挂载后再处理主题，避免水合不匹配错误
  useEffect(() => {
    setMounted(true)
  }, [])

  // 处理夜晚模式切换
  const handleToggleDarkMode = () => {
    if (!mounted) return
    setFollowSystem(false)
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
  }

  // const { t } = useTranslation()

  return (
    <>
      {/* 语言设置 - 第一个 */}
      <Button
        variant="ghost"
        className="flex h-9 shrink-0 items-center gap-2 px-3"
        onClick={onNavigateToLanguage}
      >
        <Languages className="h-4 w-4" />
      </Button>

      {/* 夜晚模式切换 - 第二个 */}
      <Button
        variant="ghost"
        className="flex h-9 shrink-0 items-center gap-2 px-3"
        onClick={handleToggleDarkMode}
      >
        {mounted ? (
          theme === 'dark' ? (
            <Moon className="h-4 w-4" />
          ) : (
            <Sun className="h-4 w-4" />
          )
        ) : (
          <Sun className="h-4 w-4" />
        )}
      </Button>

      <Button
        variant="ghost"
        className="flex h-9 shrink-0 items-center gap-2 px-3"
        onClick={onNavigateToTheme}
      >
        <Palette className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        className="flex h-9 shrink-0 items-center gap-2 px-3"
        onClick={onNavigateToBackground}
      >
        <Image className="h-4 w-4" role="img" aria-label="Background Imag Setting" />
      </Button>

      <SettingsDivider />

      {/* 功能封面图选项 */}
      <div className="flex h-9 shrink-0 items-center gap-2 px-3">
        <Grid className="h-4 w-4" role="img" aria-label="Grid Icon" />
        <Image className="h-4 w-4" role="img" aria-label="Image Icon" />
        <Label htmlFor="follow-system" className="cursor-pointer text-sm font-medium">
          Cover
        </Label>
        <Switch
          id="project-covers"
          checked={showProjectCovers}
          onCheckedChange={onToggleProjectCovers}
        />
      </div>

      {/* 跟随系统选项 */}
      <div className="flex h-9 shrink-0 items-center gap-2 px-3">
        <Sun className="h-4 w-4" />|<Moon className="h-4 w-4" />
        <Label htmlFor="follow-system" className="cursor-pointer text-sm font-medium">
          Auto
        </Label>
        <Switch id="follow-system" checked={followSystem} onCheckedChange={onToggleFollowSystem} />
      </div>
    </>
  )
}
