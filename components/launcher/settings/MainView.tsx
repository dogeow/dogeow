'use client'

import React from 'react'
import { Palette, Image, Grid, Languages, Sun, LayoutGrid, List, Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { SettingsDivider } from './SettingsDivider'
import { useLayoutStore } from '@/stores/layoutStore'
import { useTranslation } from '@/hooks/useTranslation'

interface MainViewProps {
  onNavigateToBackground: () => void
  onNavigateToTheme: () => void
  onNavigateToAppearance: () => void
  onNavigateToLanguage: () => void
  onNavigateToSonner: () => void
  showProjectCovers: boolean
  onToggleProjectCovers: (checked: boolean) => void
}

export function MainView({
  onNavigateToBackground,
  onNavigateToTheme,
  onNavigateToAppearance,
  onNavigateToLanguage,
  onNavigateToSonner,
  showProjectCovers,
  onToggleProjectCovers,
}: MainViewProps) {
  const { t } = useTranslation()
  const { siteLayout, setSiteLayout } = useLayoutStore()

  return (
    <>
      <Button
        variant="ghost"
        className="flex h-9 shrink-0 items-center gap-2 px-3"
        onClick={onNavigateToLanguage}
        aria-label={t('settings.language', '语言')}
      >
        <Languages className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        className="flex h-9 shrink-0 items-center gap-2 px-3"
        onClick={onNavigateToAppearance}
        aria-label={t('settings.appearance', '外观')}
      >
        <Sun className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        className="flex h-9 shrink-0 items-center gap-2 px-3"
        onClick={onNavigateToTheme}
        aria-label={t('settings.theme', '主题')}
      >
        <Palette className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        className="flex h-9 shrink-0 items-center gap-2 px-3"
        onClick={onNavigateToBackground}
        aria-label={t('settings.background', '背景')}
      >
        <Image className="h-4 w-4" aria-hidden />
      </Button>

      <Button
        variant="ghost"
        className="flex h-9 shrink-0 items-center gap-2 px-3"
        onClick={() => setSiteLayout(siteLayout === 'grid' ? 'magazine' : 'grid')}
        aria-label={t('settings.layout', '布局')}
      >
        {siteLayout === 'grid' ? <LayoutGrid className="h-4 w-4" /> : <List className="h-4 w-4" />}
      </Button>

      <Button
        variant="ghost"
        className="flex h-9 shrink-0 items-center gap-2 px-3"
        onClick={onNavigateToSonner}
        aria-label={t('settings.sonner', '提示')}
      >
        <Bell className="h-4 w-4" />
      </Button>

      <SettingsDivider />

      {/* 功能封面图选项 */}
      <div className="flex h-9 shrink-0 items-center gap-2 px-3">
        <Grid className="h-4 w-4" role="img" aria-label="Grid Icon" />
        <Image className="h-4 w-4" role="img" aria-label="Image Icon" />
        <Label htmlFor="project-covers" className="cursor-pointer text-sm font-medium">
          Cover
        </Label>
        <Switch
          id="project-covers"
          checked={showProjectCovers}
          onCheckedChange={onToggleProjectCovers}
        />
      </div>
    </>
  )
}
