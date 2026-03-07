'use client'

import React from 'react'
import { BackButton } from '@/components/ui/back-button'
import { SettingsDivider } from './SettingsDivider'
import { Sun, Moon, Monitor, CloudMoon } from 'lucide-react'
import { useTranslation } from '@/hooks/useTranslation'
import type { ThemeMode } from '@/stores/themeStore'
import type { RestPeriod } from '@/stores/themeStore'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { BottomHourPicker } from '@/components/ui/bottom-hour-picker'

interface AppearanceViewProps {
  onBack: () => void
  themeMode: ThemeMode
  onThemeModeChange: (mode: ThemeMode) => void
  restPeriod: RestPeriod
  onRestPeriodChange: (startHour: number, endHour: number) => void
  customCursorEnabled: boolean
  onCustomCursorChange: (enabled: boolean) => void
  themeTransitionEnabled: boolean
  onThemeTransitionChange: (enabled: boolean) => void
}

export function AppearanceView({
  onBack,
  themeMode,
  onThemeModeChange,
  restPeriod,
  onRestPeriodChange,
  customCursorEnabled,
  onCustomCursorChange,
  themeTransitionEnabled,
  onThemeTransitionChange,
}: AppearanceViewProps) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-4">
      <BackButton onClick={onBack} className="h-6 w-6 shrink-0" />
      <SettingsDivider />

      <div>
        <p className="text-muted-foreground mb-3 text-sm">
          {t('settings.appearance_desc', '选择外观模式，休息时段内自动使用深色。')}
        </p>
        <div className="flex flex-col gap-2">
          <Button
            variant={themeMode === 'light' ? 'secondary' : 'ghost'}
            className="h-11 justify-start gap-3 px-4"
            onClick={() => onThemeModeChange('light')}
          >
            <Sun className="h-5 w-5 shrink-0" />
            {t('settings.theme_light', '浅色')}
          </Button>
          <Button
            variant={themeMode === 'dark' ? 'secondary' : 'ghost'}
            className="h-11 justify-start gap-3 px-4"
            onClick={() => onThemeModeChange('dark')}
          >
            <Moon className="h-5 w-5 shrink-0" />
            {t('settings.theme_dark', '深色')}
          </Button>
          <Button
            variant={themeMode === 'system' ? 'secondary' : 'ghost'}
            className="h-11 justify-start gap-3 px-4"
            onClick={() => onThemeModeChange('system')}
          >
            <Monitor className="h-5 w-5 shrink-0" />
            {t('settings.follow_system', '跟随系统')}
          </Button>
          <Button
            variant={themeMode === 'rest' ? 'secondary' : 'ghost'}
            className="h-11 justify-start gap-3 px-4"
            onClick={() => onThemeModeChange('rest')}
          >
            <CloudMoon className="h-5 w-5 shrink-0" />
            {t('settings.theme_rest', '休息时段')}
          </Button>
        </div>
      </div>

      {themeMode === 'rest' && (
        <>
          <SettingsDivider />
          <div className="space-y-3">
            <Label className="text-sm font-medium">{t('settings.rest_period', '休息时段')}</Label>
            <p className="text-muted-foreground text-xs">
              {t(
                'settings.rest_period_hint',
                '该时段内使用深色，其余时间浅色。跨天请将开始时间设为大于结束时间。'
              )}
            </p>
            <div className="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-2">
              <Label htmlFor="rest-start" className="text-xs">
                {t('settings.rest_start', '开始')}
              </Label>
              <BottomHourPicker
                id="rest-start"
                value={restPeriod.startHour}
                onChange={h => onRestPeriodChange(h, restPeriod.endHour)}
                label={t('settings.rest_start', '开始')}
                title={t('settings.rest_start', '开始')}
              />
              <Label htmlFor="rest-end" className="text-xs">
                {t('settings.rest_end', '结束')}
              </Label>
              <BottomHourPicker
                id="rest-end"
                value={restPeriod.endHour}
                onChange={h => onRestPeriodChange(restPeriod.startHour, h)}
                label={t('settings.rest_end', '结束')}
                title={t('settings.rest_end', '结束')}
              />
            </div>
          </div>
        </>
      )}

      <SettingsDivider />
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium">{t('settings.custom_cursor', '自定义光标')}</span>
        <Switch
          id="custom-cursor-panel"
          checked={customCursorEnabled}
          onCheckedChange={onCustomCursorChange}
          aria-label={t('settings.custom_cursor', '自定义光标')}
        />
      </div>
      <SettingsDivider />
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium">
          {t('settings.theme_transition', '主题切换渐变')}
        </span>
        <Switch
          id="theme-transition-panel"
          checked={themeTransitionEnabled}
          onCheckedChange={onThemeTransitionChange}
          aria-label={t('settings.theme_transition', '主题切换渐变')}
        />
      </div>
    </div>
  )
}
