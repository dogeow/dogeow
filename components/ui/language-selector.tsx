'use client'

import * as React from 'react'
import { ChevronDownIcon, GlobeIcon } from 'lucide-react'
import { cn } from '@/lib/helpers'
import { useTranslation } from '@/hooks/useTranslation'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
// import { motion, AnimatePresence } from 'framer-motion'
import { useLanguageTransition } from '@/hooks/useLanguageTransition'

interface LanguageSelectorProps {
  className?: string
  variant?: 'dropdown' | 'button'
  size?: 'sm' | 'default' | 'lg'
  showIcon?: boolean
  showText?: boolean
  showFlag?: boolean
}

// 国旗图标组件
const FlagIcon = ({ languageCode }: { languageCode: string }) => {
  const getFlagEmoji = (code: string) => {
    const flagMap: Record<string, string> = {
      'zh-CN': '🇨🇳',
      'zh-TW': '🇭🇰',
      en: '🇺🇸',
      ja: '🇯🇵',
    }
    return flagMap[code] || '🌐'
  }

  return (
    <span className="text-base leading-none" role="img" aria-label={`${languageCode} flag`}>
      {getFlagEmoji(languageCode)}
    </span>
  )
}

/**
 * Language selector component that provides a dropdown interface for switching languages
 * Supports smooth animations and integrates with the global language state
 */
export function LanguageSelector({
  className,
  variant = 'dropdown',
  size = 'default',
  showIcon = true,
  showText = true,
  showFlag = true,
  ...props
}: LanguageSelectorProps) {
  const { currentLanguage, currentLanguageInfo, availableLanguages } = useTranslation()
  const { isTransitioning, switchLanguage } = useLanguageTransition()

  const handleLanguageChange = async (languageCode: string) => {
    console.log(
      'Language change requested:',
      languageCode,
      'Current:',
      currentLanguage,
      'Transitioning:',
      isTransitioning
    )
    await switchLanguage(languageCode)
  }

  console.log(
    'LanguageSelector render - isTransitioning:',
    isTransitioning,
    'currentLanguage:',
    currentLanguage
  )

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
              'transition-all duration-200',
              currentLanguage === language.code && 'ring-primary/20 ring-2',
              isTransitioning && 'cursor-not-allowed opacity-70'
            )}
          >
            {showFlag && <FlagIcon languageCode={language.code} />}
            {showIcon && !showFlag && <GlobeIcon className="size-4" />}
            {showText && <span>{language.nativeName}</span>}
          </Button>
        ))}
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
            'justify-between transition-all duration-200 hover:scale-105',
            'focus-visible:ring-primary/20 focus-visible:ring-2',
            isTransitioning && 'cursor-not-allowed opacity-70',
            className
          )}
          {...props}
        >
          <div className="flex items-center gap-2">
            {showFlag && <FlagIcon languageCode={currentLanguage} />}
            {showIcon && !showFlag && <GlobeIcon className="size-4" />}
            {showText && <span className="font-medium">{currentLanguageInfo.nativeName}</span>}
          </div>
          <ChevronDownIcon className="size-4 opacity-50 transition-transform duration-200 group-data-[state=open]:rotate-180" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className={cn(
          'animate-in fade-in-0 zoom-in-95 min-w-[180px]',
          'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95'
        )}
      >
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
