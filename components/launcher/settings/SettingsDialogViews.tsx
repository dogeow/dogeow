'use client'

import React from 'react'
import { BookOpen, Columns } from 'lucide-react'
import { BottomHourPicker } from '@/components/ui/bottom-hour-picker'
import { Switch } from '@/components/ui/switch'
import { PROJECT_COVER_MODE_OPTIONS, type ProjectCoverMode } from '@/stores/projectCoverStore'
import type { SiteLayout } from '@/stores/layoutStore'
import type { ThemeMode, RestPeriod } from '@/stores/themeStore'

interface ColorModeViewProps {
  themeMode: ThemeMode
  resolvedTheme?: string
  onThemeModeChange: (mode: ThemeMode) => void
  restPeriod: RestPeriod
  onRestPeriodChange: (startHour: number, endHour: number) => void
  customCursorEnabled: boolean
  onCustomCursorChange: (enabled: boolean) => void
  themeTransitionEnabled: boolean
  onThemeTransitionChange: (enabled: boolean) => void
}

export function ColorModeView({
  themeMode,
  onThemeModeChange,
  restPeriod,
  onRestPeriodChange,
  customCursorEnabled,
  onCustomCursorChange,
  themeTransitionEnabled,
  onThemeTransitionChange,
}: ColorModeViewProps) {
  return (
    <div className="flex flex-col space-y-4">
      <div className="flex flex-col gap-2">
        {[
          { mode: 'light' as const, label: '浅色' },
          { mode: 'dark' as const, label: '深色' },
          { mode: 'system' as const, label: '跟随系统' },
          { mode: 'rest' as const, label: '休息时段' },
        ].map(({ mode, label }) => (
          <button
            key={mode}
            type="button"
            onClick={() => onThemeModeChange(mode)}
            className={`rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
              themeMode === mode ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      {themeMode === 'rest' && (
        <div className="border-t pt-3">
          <p className="text-muted-foreground mb-2 text-xs font-medium">休息时段设置</p>
          <div className="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-2">
            <label htmlFor="dialog-rest-start" className="text-xs">
              开始
            </label>
            <BottomHourPicker
              id="dialog-rest-start"
              value={restPeriod.startHour}
              onChange={h => onRestPeriodChange(h, restPeriod.endHour)}
              label="开始"
              title="开始时间"
              className="h-8 min-w-[4.5rem] px-2"
            />
            <label htmlFor="dialog-rest-end" className="text-xs">
              结束
            </label>
            <BottomHourPicker
              id="dialog-rest-end"
              value={restPeriod.endHour}
              onChange={h => onRestPeriodChange(restPeriod.startHour, h)}
              label="结束"
              title="结束时间"
              className="h-8 min-w-[4.5rem] px-2"
            />
          </div>
        </div>
      )}
      <div className="border-t pt-3 hidden md:block">
        <div className="flex w-full items-center justify-between gap-2 rounded-lg p-2">
          <span className="text-sm font-medium">自定义光标</span>
          <Switch
            id="custom-cursor"
            checked={customCursorEnabled}
            onCheckedChange={onCustomCursorChange}
            aria-label="切换自定义光标"
          />
        </div>
      </div>
      <div className="border-t pt-3">
        <div className="flex w-full items-center justify-between gap-2 rounded-lg p-2">
          <span className="text-sm font-medium">主题切换渐变</span>
          <Switch
            id="theme-transition"
            checked={themeTransitionEnabled}
            onCheckedChange={onThemeTransitionChange}
            aria-label="切换主题渐变"
          />
        </div>
      </div>
    </div>
  )
}

interface FullscreenViewProps {
  fullscreenOn: boolean
  onToggle: () => void
}

export function FullscreenView({ fullscreenOn, onToggle }: FullscreenViewProps) {
  return (
    <div className="hidden md:flex flex-col space-y-3">
      <div className="flex w-full items-center justify-between gap-2 rounded-lg p-2">
        <span className="text-sm font-medium">全屏显示</span>
        <Switch checked={fullscreenOn} onCheckedChange={onToggle} aria-label="切换全屏" />
      </div>
      <p className="text-muted-foreground text-xs">开启后页面将全屏显示；也可按 ESC 退出全屏。</p>
    </div>
  )
}

interface AppsListViewProps {
  siteLayout: SiteLayout
  setSiteLayout: (layout: SiteLayout) => void
  projectCoverMode: ProjectCoverMode
  setProjectCoverMode: (mode: ProjectCoverMode) => void
}

export function AppsListView({
  siteLayout,
  setSiteLayout,
  projectCoverMode,
  setProjectCoverMode,
}: AppsListViewProps) {
  return (
    <div className="flex flex-col space-y-2">
      <div className="flex w-full items-center gap-2 rounded-lg p-2">
        <Columns className="h-4 w-4 shrink-0" />
        <div className="flex flex-1 gap-1">
          <button
            onClick={() => setSiteLayout('grid')}
            className={`flex-1 rounded px-2 py-1 text-xs transition-colors ${
              siteLayout === 'grid' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
            }`}
          >
            网格
          </button>
          <button
            onClick={() => setSiteLayout('magazine')}
            className={`flex-1 rounded px-2 py-1 text-xs transition-colors ${
              siteLayout === 'magazine' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
            }`}
          >
            杂志
          </button>
          <button
            onClick={() => setSiteLayout('icon')}
            className={`flex-1 rounded px-2 py-1 text-xs transition-colors ${
              siteLayout === 'icon' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
            }`}
          >
            图标
          </button>
        </div>
      </div>

      <div className="flex w-full items-center gap-2 rounded-lg p-2">
        <BookOpen className="h-4 w-4" />
        <div className="flex flex-1 gap-1">
          {PROJECT_COVER_MODE_OPTIONS.map(option => (
            <button
              key={option.value}
              type="button"
              onClick={() => setProjectCoverMode(option.value)}
              className={`flex-1 rounded px-2 py-1 text-xs transition-colors ${
                projectCoverMode === option.value
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
