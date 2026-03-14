'use client'

import React from 'react'
import {
  Palette,
  Image as ImageIcon,
  Languages,
  Sun,
  LayoutGrid,
  List,
  Smartphone,
  Bell,
  BookOpen,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SettingsDivider } from './SettingsDivider'
import { useLayoutStore } from '@/stores/layoutStore'
import { useTranslation } from '@/hooks/useTranslation'
import { PROJECT_COVER_MODE_OPTIONS, type ProjectCoverMode } from '@/stores/projectCoverStore'

interface MainViewProps {
  onNavigateToBackground: () => void
  onNavigateToTheme: () => void
  onNavigateToAppearance: () => void
  onNavigateToLanguage: () => void
  onNavigateToSonner: () => void
  projectCoverMode: ProjectCoverMode
  onProjectCoverModeChange: (mode: ProjectCoverMode) => void
}

export function MainView({
  onNavigateToBackground,
  onNavigateToTheme,
  onNavigateToAppearance,
  onNavigateToLanguage,
  onNavigateToSonner,
  projectCoverMode,
  onProjectCoverModeChange,
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
        <ImageIcon className="h-4 w-4" aria-hidden />
      </Button>

      <Button
        variant="ghost"
        className="flex h-9 shrink-0 items-center gap-2 px-3"
        onClick={() =>
          setSiteLayout(
            siteLayout === 'grid' ? 'magazine' : siteLayout === 'magazine' ? 'icon' : 'grid'
          )
        }
        aria-label={t('settings.layout', '布局')}
      >
        {siteLayout === 'grid' ? (
          <LayoutGrid className="h-4 w-4" />
        ) : siteLayout === 'magazine' ? (
          <List className="h-4 w-4" />
        ) : (
          <Smartphone className="h-4 w-4" />
        )}
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
      <div className="flex min-h-9 shrink-0 items-center gap-2 px-3">
        <LayoutGrid className="h-4 w-4" aria-hidden />
        <span className="text-sm font-medium">布局</span>
        <div className="flex flex-1 gap-1">
          <Button
            type="button"
            variant={siteLayout === 'grid' ? 'default' : 'ghost'}
            size="sm"
            className="h-8 flex-1 px-2 text-xs"
            onClick={() => setSiteLayout('grid')}
          >
            网格
          </Button>
          <Button
            type="button"
            variant={siteLayout === 'magazine' ? 'default' : 'ghost'}
            size="sm"
            className="h-8 flex-1 px-2 text-xs"
            onClick={() => setSiteLayout('magazine')}
          >
            杂志
          </Button>
          <Button
            type="button"
            variant={siteLayout === 'icon' ? 'default' : 'ghost'}
            size="sm"
            className="h-8 flex-1 px-2 text-xs"
            onClick={() => setSiteLayout('icon')}
          >
            图标
          </Button>
        </div>
      </div>

      <div className="flex min-h-9 shrink-0 items-center gap-2 px-3">
        <BookOpen className="h-4 w-4" aria-hidden />
        <span className="text-sm font-medium">封面</span>
        <div className="flex flex-1 gap-1">
          {PROJECT_COVER_MODE_OPTIONS.map(option => (
            <Button
              key={option.value}
              type="button"
              variant={projectCoverMode === option.value ? 'default' : 'ghost'}
              size="sm"
              className="h-8 flex-1 px-2 text-xs"
              onClick={() => onProjectCoverModeChange(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>
    </>
  )
}
