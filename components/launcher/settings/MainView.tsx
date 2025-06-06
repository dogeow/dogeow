"use client"

import React from 'react'
import { Palette, Image as ImageIcon, Computer, Image } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { SettingsDivider } from './SettingsDivider'

interface MainViewProps {
  onNavigateToBackground: () => void
  onNavigateToTheme: () => void
  followSystem: boolean
  onToggleFollowSystem: (checked: boolean) => void
  showProjectCovers: boolean
  onToggleProjectCovers: (checked: boolean) => void
}

export function MainView({
  onNavigateToBackground,
  onNavigateToTheme,
  followSystem,
  onToggleFollowSystem,
  showProjectCovers,
  onToggleProjectCovers
}: MainViewProps) {
  return (
    <>
      <Button
        variant="ghost"
        className="flex items-center gap-2 shrink-0 h-9 px-3"
        onClick={onNavigateToBackground}
      >
        <ImageIcon className="h-4 w-4" />
        <span className="text-sm font-medium">背景</span>
      </Button>
      
      <Button
        variant="ghost"
        className="flex items-center gap-2 shrink-0 h-9 px-3"
        onClick={onNavigateToTheme}
      >
        <Palette className="h-4 w-4" />
        <span className="text-sm font-medium">主题</span>
      </Button>
      
      <SettingsDivider />
      
      {/* 功能封面图选项 */}
      <div className="flex items-center gap-2 h-9 px-3 shrink-0">
        <Image className="h-4 w-4" />
        <Label htmlFor="project-covers" className="text-sm font-medium cursor-pointer">
          功能封面图
        </Label>
        <Switch
          id="project-covers"
          checked={showProjectCovers}
          onCheckedChange={onToggleProjectCovers}
        />
      </div>
      
      {/* 跟随系统选项 */}
      <div className="flex items-center gap-2 h-9 px-3 shrink-0">
        <Computer className="h-4 w-4" />
        <Label htmlFor="follow-system" className="text-sm font-medium cursor-pointer">
          跟随系统
        </Label>
        <Switch
          id="follow-system"
          checked={followSystem}
          onCheckedChange={onToggleFollowSystem}
        />
      </div>
    </>
  )
} 