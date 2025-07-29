'use client'

import React from 'react'
import { Palette, Image as ImageIcon, Computer, Languages } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { SettingsDivider } from './SettingsDivider'
import { useTranslation } from '@/hooks/useTranslation'

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
  const { t } = useTranslation()

  return (
    <>
      <Button
        variant="ghost"
        className="flex h-9 shrink-0 items-center gap-2 px-3"
        onClick={onNavigateToBackground}
      >
        <ImageIcon className="h-4 w-4" />
        <span className="text-sm font-medium">{t('settings.background', '背景')}</span>
      </Button>

      <Button
        variant="ghost"
        className="flex h-9 shrink-0 items-center gap-2 px-3"
        onClick={onNavigateToTheme}
      >
        <Palette className="h-4 w-4" />
        <span className="text-sm font-medium">{t('settings.theme', '主题')}</span>
      </Button>

      <Button
        variant="ghost"
        className="flex h-9 shrink-0 items-center gap-2 px-3"
        onClick={onNavigateToLanguage}
      >
        <Languages className="h-4 w-4" />
        <span className="text-sm font-medium">{t('settings.language', '语言')}</span>
      </Button>

      <SettingsDivider />

      {/* 功能封面图选项 */}
      <div className="flex h-9 shrink-0 items-center gap-2 px-3">
        <ImageIcon className="h-4 w-4" />
        <Label htmlFor="project-covers" className="cursor-pointer text-sm font-medium">
          {t('settings.project_covers', '功能封面图')}
        </Label>
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
          {t('settings.follow_system', '跟随系统')}
        </Label>
        <Switch id="follow-system" checked={followSystem} onCheckedChange={onToggleFollowSystem} />
      </div>
    </>
  )
}
