'use client'

import * as React from 'react'
import { ChevronDownIcon, Globe, RefreshCw, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/helpers'
import { useTranslation } from '@/hooks/useTranslation'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { useLanguageTransition } from '@/hooks/useLanguageTransition'
import { useLanguageStore } from '@/stores/languageStore'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { getLanguageFlag } from '@/lib/helpers/languageFlags'

interface LanguageSelectorProps {
  className?: string
  variant?: 'dropdown' | 'button'
  size?: 'sm' | 'default' | 'lg'
  showText?: boolean
  showFlag?: boolean
  showDetectionInfo?: boolean
}

// 国旗图标组件
const FlagIcon = ({ languageCode }: { languageCode: string }) => {
  return <span className="text-lg">{getLanguageFlag(languageCode)}</span>
}

/**
 * Language selector component that provides a dropdown interface for switching languages
 * Supports smooth animations and integrates with the global language state
 */
export function LanguageSelector({
  className,
  variant = 'dropdown',
  size = 'default',
  showText = true,
  showFlag = true,
  showDetectionInfo = true,
  ...props
}: LanguageSelectorProps) {
  const { currentLanguage, currentLanguageInfo, availableLanguages, t } = useTranslation()
  const { isTransitioning, switchLanguage } = useLanguageTransition()
  const { detectedLanguage, isAutoDetected } = useLanguageStore()

  const handleLanguageChange = async (languageCode: string) => {
    console.log('[LanguageSelector] User requested language change:', {
      from: currentLanguage,
      to: languageCode,
    })

    await switchLanguage(languageCode)

    console.log('[LanguageSelector] Language change completed:', {
      newLanguage: languageCode,
      success: true,
    })
  }

  const handleResetToDetected = async () => {
    if (detectedLanguage) {
      console.log('[LanguageSelector] User requested reset to detected language:', detectedLanguage)

      // 显示检测中的提示
      toast.info(t('language.detection.detecting', '正在检测语言...'))

      await switchLanguage(detectedLanguage)

      // 显示成功提示
      toast.success(t('language.detection.switched', `已切换到检测到的语言: ${detectedLanguage}`))

      console.log('[LanguageSelector] Reset to detected language completed:', {
        detectedLanguage,
        success: true,
      })
    } else {
      console.log('[LanguageSelector] No detected language available for reset')
      toast.warning(t('language.detection.refresh_failed', '语言检测刷新失败'))
    }
  }

  const showDetectionBadge = detectedLanguage && detectedLanguage !== currentLanguage

  if (variant === 'button') {
    return (
      <div className={cn('flex flex-wrap gap-2', className)} {...props}>
        {availableLanguages.map(language => (
          <Button
            key={language.code}
            variant={currentLanguage === language.code ? 'default' : 'outline'}
            size={size}
            onClick={() => handleLanguageChange(language.code)}
            disabled={isTransitioning}
            className={cn(
              'relative transition-all duration-200',
              currentLanguage === language.code && 'ring-primary/20 ring-2',
              isTransitioning && 'cursor-not-allowed opacity-70'
            )}
          >
            {showFlag && <FlagIcon languageCode={language.code} />}
            {showText && <span>{language.nativeName}</span>}

            {/* Show detection badge for detected language */}
            {showDetectionInfo && detectedLanguage === language.code && (
              <Badge variant="secondary" className="absolute -top-1 -right-1 ml-1 h-4 px-1 text-xs">
                <Globe className="mr-1 h-2 w-2" />
                检测
              </Badge>
            )}
          </Button>
        ))}

        {/* Reset to detected language button */}
        {showDetectionInfo && showDetectionBadge && (
          <Button
            variant="outline"
            size={size}
            onClick={handleResetToDetected}
            disabled={isTransitioning}
            className="border-dashed transition-all duration-200"
            title="切换到检测到的语言"
          >
            <RefreshCw className="mr-1 h-4 w-4" />
            <span className="text-xs">自动检测</span>
          </Button>
        )}
      </div>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size={size}
          disabled={isTransitioning}
          className={cn(
            'relative justify-between transition-all duration-200 hover:scale-105',
            'focus-visible:ring-primary/20 focus-visible:ring-2',
            isTransitioning && 'cursor-not-allowed opacity-70',
            className
          )}
          {...props}
        >
          <div className="flex items-center gap-2">
            {showFlag && <FlagIcon languageCode={currentLanguage} />}
            {showText && <span className="font-medium">{currentLanguageInfo.nativeName}</span>}
          </div>

          {/* Detection indicator */}
          {showDetectionInfo && isAutoDetected && (
            <Badge variant="secondary" className="absolute -top-1 -right-1 ml-1 h-4 px-1 text-xs">
              <Globe className="h-2 w-2" />
            </Badge>
          )}

          <ChevronDownIcon className="ml-2 size-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className={cn(
          'animate-in fade-in-0 zoom-in-95 min-w-[220px]',
          'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95'
        )}
      >
        {/* Detection info section */}
        {showDetectionInfo && detectedLanguage && (
          <>
            <DropdownMenuLabel className="text-muted-foreground px-2 py-1 text-xs">
              <div className="flex items-center gap-2">
                <Globe className="h-3 w-3" />
                检测到的语言
              </div>
            </DropdownMenuLabel>

            <DropdownMenuItem
              onClick={handleResetToDetected}
              className={cn(
                'flex cursor-pointer items-center justify-between transition-all duration-150',
                'hover:bg-accent/50 focus:bg-accent/50',
                detectedLanguage === currentLanguage && 'bg-accent/30 font-medium'
              )}
            >
              <div className="flex items-center gap-2">
                {showFlag && <FlagIcon languageCode={detectedLanguage} />}
                <div className="flex flex-col">
                  <span className="font-medium">
                    {availableLanguages.find(lang => lang.code === detectedLanguage)?.nativeName}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {availableLanguages.find(lang => lang.code === detectedLanguage)?.name}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {detectedLanguage === currentLanguage ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <RefreshCw className="text-muted-foreground h-3 w-3" />
                )}
              </div>
            </DropdownMenuItem>

            <DropdownMenuSeparator />
          </>
        )}

        {/* All available languages */}
        <DropdownMenuLabel className="text-muted-foreground px-2 py-1 text-xs">
          所有语言
        </DropdownMenuLabel>

        {availableLanguages.map(language => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => handleLanguageChange(language.code)}
            className={cn(
              'flex cursor-pointer items-center justify-between transition-all duration-150',
              'hover:bg-accent/50 focus:bg-accent/50',
              currentLanguage === language.code && 'bg-accent/30 font-medium'
            )}
          >
            <div className="flex items-center gap-2">
              {showFlag && <FlagIcon languageCode={language.code} />}
              <div className="flex flex-col">
                <span className="font-medium">{language.nativeName}</span>
                <span className="text-muted-foreground text-xs">{language.name}</span>
              </div>
            </div>
            {currentLanguage === language.code && (
              <div className="bg-primary size-2 rounded-full" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/**
 * Compact language selector that only shows the current language code
 * Useful for space-constrained areas
 */
export function CompactLanguageSelector({
  className,
  showFlag = true,
  ...props
}: Omit<LanguageSelectorProps, 'variant' | 'showText'>) {
  const { currentLanguage, availableLanguages, setLanguage } = useTranslation()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            'h-8 w-16 font-mono text-xs transition-all duration-200',
            'hover:bg-accent/50 focus-visible:ring-primary/20 focus-visible:ring-2',
            className
          )}
          {...props}
        >
          <div className="flex items-center gap-1">
            {showFlag && <FlagIcon languageCode={currentLanguage} />}
            <span>{currentLanguage.toUpperCase()}</span>
          </div>
          <ChevronDownIcon className="ml-1 size-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[120px]">
        {availableLanguages.map(language => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => setLanguage(language.code)}
            className={cn(
              'text-sm transition-all duration-150',
              currentLanguage === language.code && 'bg-accent/30 font-medium'
            )}
          >
            <div className="flex items-center gap-2">
              {showFlag && <FlagIcon languageCode={language.code} />}
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs">{language.code.toUpperCase()}</span>
                <span>{language.nativeName}</span>
              </div>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default LanguageSelector
