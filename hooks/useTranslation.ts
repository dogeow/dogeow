'use client'

import { useEffect, useCallback } from 'react'
import { useLanguageStore, getCurrentLanguageInfo } from '@/stores/languageStore'
import { getTranslation, getAvailableLanguages, type SupportedLanguage } from '@/lib/i18n'

export interface UseTranslationReturn {
  t: (key: string, fallback?: string) => string
  currentLanguage: SupportedLanguage
  currentLanguageInfo: ReturnType<typeof getCurrentLanguageInfo>
  availableLanguages: ReturnType<typeof getAvailableLanguages>
  setLanguage: (language: string) => void
  isLanguageLoaded: boolean
}

/**
 * Hook for accessing translation functionality
 * Automatically initializes language detection on first use
 * Provides comprehensive translation features with fallback support
 */
export function useTranslation(): UseTranslationReturn {
  const { currentLanguage, availableLanguages, setLanguage, t, initializeLanguage } =
    useLanguageStore()

  // Initialize language detection on mount
  useEffect(() => {
    initializeLanguage()
  }, [initializeLanguage])

  const currentLanguageInfo = getCurrentLanguageInfo(currentLanguage)

  // Enhanced translation function with additional features
  const enhancedT = useCallback(
    (key: string, fallback?: string): string => {
      // Use the store's translation function which already has fallback logic
      return t(key, fallback)
    },
    [t]
  )

  return {
    t: enhancedT,
    currentLanguage,
    currentLanguageInfo,
    availableLanguages,
    setLanguage,
    isLanguageLoaded: true, // Language is always loaded in our implementation
  }
}

/**
 * Lightweight hook that only returns the translation function
 * Use this when you only need translations and don't need language switching
 */
export function useT() {
  const { t, initializeLanguage } = useLanguageStore()

  // Ensure language is initialized
  useEffect(() => {
    initializeLanguage()
  }, [initializeLanguage])

  return t
}

/**
 * Hook for getting translation with explicit language parameter
 * Useful for getting translations in different languages without changing global state
 */
export function useTranslationWithLanguage() {
  const { initializeLanguage } = useLanguageStore()

  // Ensure language is initialized
  useEffect(() => {
    initializeLanguage()
  }, [initializeLanguage])

  return useCallback((key: string, language: SupportedLanguage, fallback?: string): string => {
    return getTranslation(key, language, fallback)
  }, [])
}
