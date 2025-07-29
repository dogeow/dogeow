'use client'

import { useEffect } from 'react'
import { useTranslation } from '@/hooks/useTranslation'

interface LanguageProviderProps {
  children: React.ReactNode
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const { currentLanguage } = useTranslation()

  useEffect(() => {
    // Update the html lang attribute when language changes
    if (typeof document !== 'undefined') {
      document.documentElement.lang = currentLanguage
    }
  }, [currentLanguage])

  return <>{children}</>
}
