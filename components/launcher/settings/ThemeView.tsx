'use client'

import React from 'react'
import { BackButton } from '@/components/ui/back-button'
import { AddThemeDialog } from './AddThemeDialog'
import { SettingsDivider } from './SettingsDivider'
import { getTranslatedConfigs } from '@/app/configs'
import { useTranslation } from '@/hooks/useTranslation'
import type { CustomTheme } from '@/app/types'
import { Check, Trash2 } from 'lucide-react'

interface ThemeViewProps {
  onBack: () => void
  currentTheme: string
  customThemes: CustomTheme[]
  onSetTheme: (id: string) => void
  onRemoveTheme: (id: string) => void
  onAddTheme: (name: string, color: string) => void
  showBackButton?: boolean
}

export function ThemeView({
  onBack,
  currentTheme,
  customThemes,
  onSetTheme,
  onRemoveTheme,
  onAddTheme,
  showBackButton = true,
}: ThemeViewProps) {
  const { t } = useTranslation()
  const translatedConfigs = getTranslatedConfigs(t)

  return (
    <div className="flex flex-col gap-3">
      {showBackButton && (
        <>
          <BackButton onClick={onBack} className="h-6 w-6 shrink-0" />
          <SettingsDivider />
        </>
      )}

      {/* 预设主题色网格 + 添加按钮 */}
      <div className="grid grid-cols-4 gap-3">
        {translatedConfigs.themeColors
          .filter(theme => theme.id && theme.name && theme.color)
          .map(theme => (
            <button
              key={theme.id!}
              onClick={() => onSetTheme(theme.id!)}
              className={`relative aspect-square rounded-xl border-2 transition-all hover:opacity-90 ${
                currentTheme === theme.id ? 'border-primary' : 'border-transparent'
              }`}
              style={{ backgroundColor: theme.color }}
              title={theme.name}
            >
              {currentTheme === theme.id && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Check className="h-4 w-4 text-white drop-shadow-md" />
                </div>
              )}
            </button>
          ))}
        <AddThemeDialog onAddTheme={onAddTheme} />
      </div>

      {/* 主题名称标签 */}
      <div className="text-muted-foreground grid grid-cols-4 gap-2 text-center text-xs">
        {translatedConfigs.themeColors
          .filter(theme => theme.id && theme.name && theme.color)
          .map(theme => (
            <span key={theme.id!}>{theme.name}</span>
          ))}
        <span aria-hidden />
      </div>

      {/* 自定义主题 */}
      {customThemes.length > 0 && (
        <>
          <SettingsDivider />
          <div className="grid grid-cols-4 gap-3">
            {customThemes.map(theme => (
              <div key={theme.id} className="relative">
                <button
                  onClick={() => onSetTheme(theme.id)}
                  className={`relative aspect-square w-full rounded-xl border-2 transition-all hover:opacity-90 ${
                    currentTheme === theme.id ? 'border-primary' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: theme.color }}
                  title={theme.name}
                >
                  {currentTheme === theme.id && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Check className="h-6 w-6 text-white drop-shadow-md" />
                    </div>
                  )}
                </button>
                <button
                  onClick={() => onRemoveTheme(theme.id)}
                  className="bg-background hover:bg-destructive hover:text-destructive-foreground absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full border shadow-sm"
                  title={`删除 ${theme.name}`}
                >
                  <Trash2 className="h-2.5 w-2.5" />
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
