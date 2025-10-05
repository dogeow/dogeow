'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { X, Globe, CheckCircle, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useTranslation } from '@/hooks/useTranslation'
import { useLanguageStore } from '@/stores/languageStore'
import { cn } from '@/lib/helpers'

interface LanguageDetectionPromptProps {
  className?: string
  onDismiss?: () => void
  showOnFirstVisit?: boolean
}

// 语言检测提示组件，展示检测到的语言并提供自动切换选项
export function LanguageDetectionPrompt({
  className,
  onDismiss,
  showOnFirstVisit = true,
}: LanguageDetectionPromptProps) {
  const { currentLanguage, availableLanguages } = useTranslation()
  const { detectedLanguage, isAutoDetected, lastDetectionTime } = useLanguageStore()
  const [isVisible, setIsVisible] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)

  // 获取语言信息
  const detectedLanguageInfo = useMemo(
    () => availableLanguages.find(lang => lang.code === detectedLanguage),
    [availableLanguages, detectedLanguage]
  )
  const currentLanguageInfo = useMemo(
    () => availableLanguages.find(lang => lang.code === currentLanguage),
    [availableLanguages, currentLanguage]
  )

  // 获取语言对应国旗
  const getFlag = (code?: string) => {
    switch (code) {
      case 'zh-CN':
        return '🇨🇳'
      case 'zh-TW':
        return '🇭🇰'
      case 'en':
        return '🇺🇸'
      case 'ja':
        return '🇯🇵'
      default:
        return '🌐'
    }
  }

  // 判断是否需要显示提示
  useEffect(() => {
    if (showOnFirstVisit && !isDismissed && detectedLanguage && lastDetectionTime) {
      const shouldShow = (): boolean => {
        // 已经关闭过提示则不再显示
        if (isDismissed) return false
        // 未检测到语言不显示
        if (!detectedLanguage) return false
        // 用户已手动设置语言不显示
        if (!isAutoDetected) return false
        // 已经展示过提示不再显示
        if (localStorage.getItem('dogeow-language-prompt-shown')) return false
        // 仅开发环境输出详细日志
        if (process.env.NODE_ENV === 'development') {
          console.log('[LanguageDetectionPrompt] Should show prompt:', {
            detectedLanguage,
            currentLanguage,
            isAutoDetected,
          })
        }
        return true
      }
      if (shouldShow()) setIsVisible(true)
    }
  }, [
    showOnFirstVisit,
    isDismissed,
    detectedLanguage,
    currentLanguage,
    lastDetectionTime,
    isAutoDetected,
  ])

  // 切换到检测到的语言
  const handleAcceptDetection = async () => {
    if (detectedLanguage) {
      console.log('[LanguageDetectionPrompt] 用户接受了检测到的语言:', detectedLanguage)
      const { setLanguage } = useLanguageStore.getState()
      setLanguage(detectedLanguage, true)
      localStorage.setItem('dogeow-language-prompt-shown', 'true')
      setIsVisible(false)
      setIsDismissed(true)
      onDismiss?.()
    }
  }

  // 关闭提示
  const handleDismiss = () => {
    console.log('[LanguageDetectionPrompt] 用户关闭了提示')
    setIsVisible(false)
    setIsDismissed(true)
    localStorage.setItem('dogeow-language-prompt-shown', 'true')
    onDismiss?.()
  }

  // 保持当前语言
  const handleKeepCurrent = () => {
    console.log('[LanguageDetectionPrompt] 用户选择保持当前语言:', currentLanguage)
    localStorage.setItem('dogeow-language-prompt-shown', 'true')
    setIsVisible(false)
    setIsDismissed(true)
    onDismiss?.()
  }

  if (!isVisible) return null

  return (
    <div
      className={cn(
        'animate-in slide-in-from-bottom-2 fixed right-4 bottom-4 z-50 duration-300',
        'w-full max-w-sm',
        className
      )}
    >
      <Card className="border-primary/20 border-2 shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="text-primary h-5 w-5" />
              <CardTitle className="text-base">语言检测</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="hover:bg-muted h-6 w-6 p-0"
              aria-label="关闭"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
          <CardDescription className="text-sm">我们检测到您可能更习惯使用以下语言</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* 检测到的语言信息 */}
          <div className="bg-muted/50 flex items-center justify-between rounded-lg p-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{getFlag(detectedLanguageInfo?.code)}</span>
              <div>
                <div className="text-sm font-medium">{detectedLanguageInfo?.nativeName}</div>
                <div className="text-muted-foreground text-xs">{detectedLanguageInfo?.name}</div>
              </div>
            </div>
            <Badge variant="secondary" className="text-xs">
              <Globe className="mr-1 h-2 w-2" />
              检测到
            </Badge>
          </div>

          {/* 当前语言信息 */}
          <div className="bg-background flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{getFlag(currentLanguageInfo?.code)}</span>
              <div>
                <div className="text-sm font-medium">{currentLanguageInfo?.nativeName}</div>
                <div className="text-muted-foreground text-xs">当前语言</div>
              </div>
            </div>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-2">
            <Button onClick={handleAcceptDetection} className="flex-1" size="sm">
              <ArrowRight className="mr-1 h-3 w-3" />
              切换到 {detectedLanguageInfo?.nativeName}
            </Button>
            <Button variant="outline" onClick={handleKeepCurrent} className="flex-1" size="sm">
              保持当前语言
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default LanguageDetectionPrompt
