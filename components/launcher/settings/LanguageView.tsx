'use client'

import React from 'react'
import { Languages } from 'lucide-react'
import { BackButton } from '@/components/ui/back-button'
import { LanguageSelector } from '@/components/ui/language-selector'
import { SettingsDivider } from './SettingsDivider'
import { useTranslation } from '@/hooks/useTranslation'

interface LanguageViewProps {
  onBack: () => void
}

export function LanguageView({ onBack }: LanguageViewProps) {
  const { t, currentLanguageInfo } = useTranslation()

  return (
    <>
      {/* 返回按钮 */}
      <BackButton onClick={onBack} className="shrink-0" />

      <SettingsDivider />

      {/* 当前语言显示 */}
      <div className="flex h-9 shrink-0 items-center gap-2 px-3">
        <Languages className="h-4 w-4" />
        <span className="text-sm font-medium">{t('settings.current_language', '当前语言')}</span>
        <span className="text-muted-foreground text-sm">{currentLanguageInfo.nativeName}</span>
      </div>

      <SettingsDivider />

      {/* 语言选择器 */}
      <div className="flex shrink-0 items-center gap-2 px-3">
        <LanguageSelector variant="button" size="sm" className="flex-wrap" showIcon={false} />
      </div>
    </>
  )
}
