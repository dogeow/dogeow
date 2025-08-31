'use client'

import React from 'react'
import { BackButton } from '@/components/ui/back-button'
import { LanguageSelector } from '@/components/ui/language-selector'
import { LanguageDetectionStatus } from '@/components/ui/language-detection-status'
import { SettingsDivider } from './SettingsDivider'

interface LanguageViewProps {
  onBack: () => void
}

export function LanguageView({ onBack }: LanguageViewProps) {
  return (
    <>
      {/* 返回按钮 */}
      <BackButton onClick={onBack} className="shrink-0" />

      <SettingsDivider />

      {/* 语言检测状态 */}
      <div className="flex shrink-0 items-center gap-2 px-3 py-2">
        <LanguageDetectionStatus showDetails={true} />
      </div>

      <SettingsDivider />

      {/* 语言选择器 */}
      <div className="flex shrink-0 items-center gap-2 px-3">
        <LanguageSelector
          variant="button"
          size="sm"
          className="flex-wrap"
          showFlag={true}
          showDetectionInfo={true}
        />
      </div>
    </>
  )
}
