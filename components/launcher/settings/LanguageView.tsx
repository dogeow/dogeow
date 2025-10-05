'use client'

import React from 'react'
import { BackButton } from '@/components/ui/back-button'
import { LanguageSelector } from '@/components/ui/language-selector'
import { SettingsDivider } from './SettingsDivider'
import { useLanguageDetection } from '@/hooks/useTranslation'
import { RefreshCw } from 'lucide-react'

interface LanguageViewProps {
  onBack: () => void
}

export function LanguageView({ onBack }: LanguageViewProps) {
  const { refreshDetection, isDetecting, detectionStats } = useLanguageDetection()

  return (
    <>
      {/* 返回按钮 */}
      <BackButton onClick={onBack} className="shrink-0" />

      <SettingsDivider />

      {/* 语言选择器 - 刷新按钮和语言按钮在同一行 */}
      <div className="flex shrink-0 items-center gap-2 px-3 py-2">
        <div className="flex items-center gap-2">
          {/* 刷新按钮 - 位于左侧 */}
          <button
            onClick={refreshDetection}
            disabled={isDetecting}
            className="hover:bg-muted flex h-8 w-8 items-center justify-center rounded p-0 disabled:opacity-50"
            title="重新检测"
          >
            <RefreshCw className={`h-4 w-4 ${isDetecting ? 'animate-spin' : ''}`} />
          </button>

          {/* 语言选择器 - 检测信息badge会显示在检测到的语言按钮上 */}
          <LanguageSelector
            variant="button"
            size="sm"
            className="flex-nowrap"
            showFlag={true}
            showDetectionInfo={true}
            detectionInfo={{
              method: detectionStats.method,
              confidence: detectionStats.confidence,
              isDetecting: isDetecting,
            }}
          />
        </div>
      </div>
    </>
  )
}
