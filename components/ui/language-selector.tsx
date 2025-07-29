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
import { motion, AnimatePresence } from 'framer-motion'
import { useLanguageTransition } from '@/hooks/useLanguageTransition'

interface LanguageSelectorProps {
  className?: string
  variant?: 'dropdown' | 'button'
  size?: 'sm' | 'default' | 'lg'
  showIcon?: boolean
  showText?: boolean
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
  ...props
}: LanguageSelectorProps) {
  const { currentLanguage, currentLanguageInfo, availableLanguages } = useTranslation()
  const { isTransitioning, switchLanguage } = useLanguageTransition()

  const handleLanguageChange = async (languageCode: string) => {
    await switchLanguage(languageCode)
  }

  if (variant === 'button') {
    return (
      <div className={cn('flex flex-wrap gap-2', className)} {...props}>
        <AnimatePresence mode="wait">
          {availableLanguages.map(language => (
            <motion.div
              key={language.code}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
            >
              <Button
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
                {showIcon && <GlobeIcon className="size-4" />}
                {showText && (
                  <motion.span
                    key={currentLanguage}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.15 }}
                  >
                    {language.nativeName}
                  </motion.span>
                )}
              </Button>
            </motion.div>
          ))}
        </AnimatePresence>
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
            {showIcon && <GlobeIcon className="size-4" />}
            {showText && (
              <motion.span
                key={currentLanguage}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.15 }}
                className="font-medium"
              >
                {currentLanguageInfo.nativeName}
              </motion.span>
            )}
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
        {availableLanguages.map((language, index) => (
          <motion.div
            key={language.code}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: index * 0.05 }}
          >
            <DropdownMenuItem
              onClick={() => handleLanguageChange(language.code)}
              className={cn(
                'flex cursor-pointer items-center justify-between transition-all duration-150',
                'hover:bg-accent/50 focus:bg-accent/50',
                currentLanguage === language.code && 'bg-accent/30 font-medium'
              )}
            >
              <div className="flex flex-col">
                <motion.span
                  key={currentLanguage}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.15 }}
                  className="font-medium"
                >
                  {language.nativeName}
                </motion.span>
                <span className="text-muted-foreground text-xs">{language.name}</span>
              </div>
              {currentLanguage === language.code && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="bg-primary size-2 rounded-full"
                />
              )}
            </DropdownMenuItem>
          </motion.div>
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
          {currentLanguage.toUpperCase()}
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
            <span className="mr-2 font-mono text-xs">{language.code.toUpperCase()}</span>
            <span>{language.nativeName}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default LanguageSelector
