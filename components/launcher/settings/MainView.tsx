'use client'

import React from 'react'
import { Palette, Image, Computer, Languages } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { SettingsDivider } from './SettingsDivider'
// import { useTranslation } from '@/hooks/useTranslation'

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
  // const { t } = useTranslation()

  return (
    <>
      <Button
        variant="ghost"
        className="flex h-9 shrink-0 items-center gap-2 px-3"
        onClick={onNavigateToBackground}
      >
        {/* eslint-disable-next-line jsx-a11y/alt-text */}
        <Image className="h-4 w-4" />
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
        onClick={onNavigateToLanguage}
      >
        <Languages className="h-4 w-4" />
      </Button>

      <SettingsDivider />

      {/* 功能封面图选项 */}
      <div className="flex h-9 shrink-0 items-center gap-2 px-3">
        {/* eslint-disable-next-line jsx-a11y/alt-text */}
        <Image className="h-4 w-4" />
        <Switch
          id="project-covers"
          checked={showProjectCovers}
          onCheckedChange={onToggleProjectCovers}
        />
      </div>

      {/* 跟随系统选项 */}
      <div className="flex h-9 shrink-0 items-center gap-2 px-3">
        <Computer className="h-4 w-4" />
        <Label htmlFor="follow-system" className="cursor-pointer text-sm font-medium">
          System
        </Label>
        <Switch id="follow-system" checked={followSystem} onCheckedChange={onToggleFollowSystem} />
      </div>
    </>
  )
}
