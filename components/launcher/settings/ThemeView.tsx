'use client'

import React from 'react'
import { BackButton } from '@/components/ui/back-button'
import { ThemeButton } from './ThemeButton'
import { AddThemeDialog } from './AddThemeDialog'
import { SettingsDivider } from './SettingsDivider'
import { getTranslatedConfigs } from '@/app/configs'
import { useTranslation } from '@/hooks/useTranslation'
import type { CustomTheme } from '@/app/types'

interface ThemeViewProps {
  onBack: () => void
  currentTheme: string
  customThemes: CustomTheme[]
  onSetTheme: (id: string) => void
  onRemoveTheme: (id: string) => void
  onAddTheme: (name: string, color: string) => void
}

export function ThemeView({
  onBack,
  currentTheme,
  customThemes,
  onSetTheme,
  onRemoveTheme,
  onAddTheme,
}: ThemeViewProps) {
  const { t } = useTranslation()
  const translatedConfigs = getTranslatedConfigs(t)

  return (
    <>
      <BackButton onClick={onBack} className="shrink-0" />

      <SettingsDivider />

      {/* 预设主题色 */}
      {translatedConfigs.themeColors.map(theme => (
        <ThemeButton
          key={theme.id}
          theme={theme}
          isSelected={currentTheme === theme.id}
          onSelect={onSetTheme}
        />
      ))}

      {/* 用户自定义主题 */}
      {customThemes.map(theme => (
        <ThemeButton
          key={theme.id}
          theme={theme}
          isSelected={currentTheme === theme.id}
          isCustom={true}
          onSelect={onSetTheme}
          onRemove={onRemoveTheme}
        />
      ))}

      {/* 添加自定义主题按钮 */}
      <AddThemeDialog onAddTheme={onAddTheme} />
    </>
  )
}
