'use client'

import React from 'react'
import { LanguageSelector } from '@/components/ui/language-selector'
import { useLanguageDetection } from '@/hooks/useTranslation'
import { useLanguageStore } from '@/stores/languageStore'
import { useTranslation as useTrans } from '@/hooks/useTranslation'
import { RefreshCw, Check, Globe, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getLanguageFlag } from '@/lib/helpers/languageFlags'
import { toast } from 'sonner'

interface LanguageViewProps {
  onBack: () => void
  showBackButton?: boolean
}

export function LanguageView({ onBack, showBackButton = true }: LanguageViewProps) {
  const { refreshDetection, isDetecting, detectionStats } = useLanguageDetection()
  const { currentLanguage, availableLanguages, setLanguage } = useTrans()
  const { detectedLanguage, isAutoDetected, detectionResult } = useLanguageStore()

  // 获取语言信息
  const detectedLanguageInfo = availableLanguages.find(lang => lang.code === detectedLanguage)
  const currentLanguageInfo = availableLanguages.find(lang => lang.code === currentLanguage)

  // 切换到检测到的语言
  const handleSwitchToDetected = async () => {
    if (detectedLanguage) {
      toast.info('正在切换语言...')
      await setLanguage(detectedLanguage)
      toast.success(`已切换到: ${detectedLanguageInfo?.nativeName}`)
    }
  }

  // 获取检测方法标签
  const getMethodLabel = (method: string) => {
    const methodMap: Record<string, string> = {
      browser: '浏览器',
      geolocation: '定位',
      user_agent: 'UA',
      stored_preference: '偏好',
      default: '默认',
      none: '无',
    }
    return methodMap[method] || method
  }

  return (
    <div className="flex flex-col gap-3">
      {/* 检测到的语言信息 */}
      {detectedLanguage && detectedLanguage !== currentLanguage && (
        <div className="bg-muted/50 rounded-lg border p-3">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-muted-foreground flex items-center gap-2 text-xs">
              <Globe className="h-3 w-3" />
              <span>检测到的语言</span>
            </div>
            {detectionResult && (
              <Badge variant="secondary" className="text-[10px]">
                {getMethodLabel(detectionResult.method)} ·{' '}
                {Math.round(detectionResult.confidence * 100)}%
              </Badge>
            )}
          </div>
          <div className="mb-2 flex items-center gap-3">
            <span className="text-2xl">{getLanguageFlag(detectedLanguage)}</span>
            <div>
              <div className="text-sm font-medium">{detectedLanguageInfo?.nativeName}</div>
              <div className="text-muted-foreground text-xs">{detectedLanguageInfo?.name}</div>
            </div>
          </div>
          <Button onClick={handleSwitchToDetected} size="sm" className="w-full text-xs">
            <ArrowRight className="mr-1 h-3 w-3" />
            切换到 {detectedLanguageInfo?.nativeName}
          </Button>
        </div>
      )}

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
