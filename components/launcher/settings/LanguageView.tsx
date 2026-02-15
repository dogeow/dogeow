'use client'

import React from 'react'
import { LanguageSelector } from '@/components/ui/language-selector'
import { useLanguageDetection } from '@/hooks/useTranslation'
import { useLanguageStore } from '@/stores/languageStore'
import { RefreshCw, Check, Globe } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface LanguageViewProps {
  onBack: () => void
  showBackButton?: boolean
}

export function LanguageView({ onBack, showBackButton = true }: LanguageViewProps) {
  const { refreshDetection, isDetecting, detectionStats } = useLanguageDetection()
  const { isAutoDetected } = useLanguageStore()

  return (
    <div className="flex flex-col gap-3">
      {/* 语言检测信息 */}
      <div className="bg-muted/50 flex items-center justify-between rounded-lg p-2">
        <div className="text-muted-foreground flex items-center gap-2 text-[10px]">
          <Globe className="h-3 w-3" />
          <span>基于浏览器设置检测</span>
          {detectionStats.confidence > 0 && (
            <Badge variant="outline" className="text-[10px]">
              {Math.round(detectionStats.confidence * 100)}%
            </Badge>
          )}
        </div>
        <button
          onClick={refreshDetection}
          disabled={isDetecting}
          className="hover:bg-muted flex items-center gap-1 rounded px-1.5 py-1 text-[10px] transition-colors disabled:opacity-50"
          title="重新检测语言"
        >
          <RefreshCw className={`h-3 w-3 ${isDetecting ? 'animate-spin' : ''}`} />
          <span>重新检测</span>
        </button>
      </div>

      {/* 语言选择器 */}
      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium">选择语言</span>
        <LanguageSelector
          variant="button"
          size="sm"
          className="w-full justify-start text-xs"
          showFlag={true}
          showDetectionInfo={false}
        />
      </div>

      {/* 当前语言信息 */}
      {isAutoDetected && (
        <div className="bg-muted/30 text-muted-foreground flex items-center gap-2 rounded-lg p-2 text-[10px]">
          <Check className="h-3 w-3 text-green-500" />
          <span>当前使用自动检测语言</span>
        </div>
      )}
    </div>
  )
}
