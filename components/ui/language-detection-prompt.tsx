'use client'

import React, { useState, useEffect } from 'react'
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

/**
 * Language detection prompt component
 * Shows detected language and offers automatic switching
 */
export function LanguageDetectionPrompt({
  className,
  onDismiss,
  showOnFirstVisit = true,
}: LanguageDetectionPromptProps) {
  const { currentLanguage, availableLanguages } = useTranslation()
  const { detectedLanguage, isAutoDetected, lastDetectionTime } = useLanguageStore()
  const [isVisible, setIsVisible] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)

  useEffect(() => {
    if (showOnFirstVisit && !isDismissed && detectedLanguage && lastDetectionTime) {
      const shouldShow = (): boolean => {
        // Don't show if already dismissed
        if (isDismissed) {
          return false
        }

        // Don't show if no detected language
        if (!detectedLanguage) {
          return false
        }

        // Don't show if current language matches detected language
        if (currentLanguage === detectedLanguage) {
          // 只在开发环境输出日志
          if (process.env.NODE_ENV === 'development') {
            console.log(
              '[LanguageDetectionPrompt] Current language matches detected language, no need for prompt'
            )
          }
          return false
        }

        // Don't show if user has manually set a language preference
        if (!isAutoDetected) {
          return false
        }

        // Don't show if current language is English (default language)
        if (currentLanguage === 'en') {
          if (process.env.NODE_ENV === 'development') {
            console.log(
              '[LanguageDetectionPrompt] Current language is English (default), no need for prompt'
            )
          }
          return false
        }

        // Check if we've shown this before
        const hasShownBefore = localStorage.getItem('dogeow-language-prompt-shown')
        if (hasShownBefore) {
          return false
        }

        // 只在开发环境输出详细日志
        if (process.env.NODE_ENV === 'development') {
          console.log('[LanguageDetectionPrompt] Should show prompt:', {
            detectedLanguage,
            currentLanguage,
            isAutoDetected,
            hasShownBefore,
          })
        }
        return true
      }

      if (shouldShow()) {
        setIsVisible(true)
      }
    }
  }, [
    showOnFirstVisit,
    isDismissed,
    detectedLanguage,
    currentLanguage,
    lastDetectionTime,
    isAutoDetected,
  ])

  const handleAcceptDetection = async () => {
    if (detectedLanguage) {
      console.log('[LanguageDetectionPrompt] User accepted detected language:', detectedLanguage)

      // Switch to detected language
      const { setLanguage } = useLanguageStore.getState()
      setLanguage(detectedLanguage, true)

      // Mark as shown
      localStorage.setItem('dogeow-language-prompt-shown', 'true')
      console.log('[LanguageDetectionPrompt] Marked prompt as shown')

      // Hide the prompt
      setIsVisible(false)
      setIsDismissed(true)

      if (onDismiss) {
        onDismiss()
      }
    }
  }

  const handleDismiss = () => {
    console.log('[LanguageDetectionPrompt] User dismissed the prompt')

    setIsVisible(false)
    setIsDismissed(true)

    // Mark as shown
    localStorage.setItem('dogeow-language-prompt-shown', 'true')
    console.log('[LanguageDetectionPrompt] Marked prompt as shown (dismissed)')

    if (onDismiss) {
      onDismiss()
    }
  }

  const handleKeepCurrent = () => {
    console.log('[LanguageDetectionPrompt] User chose to keep current language:', currentLanguage)

    // Mark as shown and keep current language
    localStorage.setItem('dogeow-language-prompt-shown', 'true')
    console.log('[LanguageDetectionPrompt] Marked prompt as shown (kept current)')

    setIsVisible(false)
    setIsDismissed(true)

    if (onDismiss) {
      onDismiss()
    }
  }

  if (!isVisible) return null

  const detectedLanguageInfo = availableLanguages.find(lang => lang.code === detectedLanguage)
  const currentLanguageInfo = availableLanguages.find(lang => lang.code === currentLanguage)

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
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
          <CardDescription className="text-sm">我们检测到您可能更习惯使用以下语言</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Detected language info */}
          <div className="bg-muted/50 flex items-center justify-between rounded-lg p-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">
                {detectedLanguageInfo?.code === 'zh-CN'
                  ? '🇨🇳'
                  : detectedLanguageInfo?.code === 'zh-TW'
                    ? '🇹🇼'
                    : detectedLanguageInfo?.code === 'en'
                      ? '🇺🇸'
                      : detectedLanguageInfo?.code === 'ja'
                        ? '🇯🇵'
                        : '🌐'}
              </span>
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

          {/* Current language info */}
          <div className="bg-background flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">
                {currentLanguageInfo?.code === 'zh-CN'
                  ? '🇨🇳'
                  : currentLanguageInfo?.code === 'zh-TW'
                    ? '🇹🇼'
                    : currentLanguageInfo?.code === 'en'
                      ? '🇺🇸'
                      : currentLanguageInfo?.code === 'ja'
                        ? '🇯🇵'
                        : '🌐'}
              </span>
              <div>
                <div className="text-sm font-medium">{currentLanguageInfo?.nativeName}</div>
                <div className="text-muted-foreground text-xs">当前语言</div>
              </div>
            </div>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </div>

          {/* Action buttons */}
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
