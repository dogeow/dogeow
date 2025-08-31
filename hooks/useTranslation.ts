'use client'

import { useEffect, useCallback, useState, useMemo } from 'react'
import { useLanguageStore, getCurrentLanguageInfo } from '@/stores/languageStore'
import { getTranslation, getAvailableLanguages, type SupportedLanguage } from '@/lib/i18n'

export interface UseTranslationReturn {
  t: (key: string, fallback?: string) => string
  currentLanguage: SupportedLanguage
  currentLanguageInfo: ReturnType<typeof getCurrentLanguageInfo>
  availableLanguages: ReturnType<typeof getAvailableLanguages>
  setLanguage: (language: string) => void
  isLanguageLoaded: boolean
  isDetecting: boolean
  detectedLanguage: SupportedLanguage | null
  isAutoDetected: boolean
  detectionStats: { confidence: number; method: string; timestamp: number | null }
  refreshDetection: () => Promise<void>
  resetToDetected: () => void
}

/**
 * Hook for accessing translation functionality
 * Automatically initializes language detection on first use
 * Provides comprehensive translation features with fallback support
 */
export function useTranslation(): UseTranslationReturn {
  const {
    currentLanguage,
    availableLanguages,
    setLanguage,
    t,
    initializeLanguage,
    isDetecting,
    detectedLanguage,
    isAutoDetected,
    getDetectionStats,
    refreshDetection,
    resetToDetected,
  } = useLanguageStore()

  const [isLanguageLoaded, setIsLanguageLoaded] = useState(false)

  // Initialize language detection on mount - 使用 useCallback 避免重复调用
  const initLanguage = useCallback(async () => {
    if (isLanguageLoaded) return

    try {
      await initializeLanguage()
      setIsLanguageLoaded(true)
    } catch (error) {
      console.error('Failed to initialize language:', error)
      setIsLanguageLoaded(true) // Set to true even on error to prevent infinite loading
    }
  }, [initializeLanguage, isLanguageLoaded])

  useEffect(() => {
    initLanguage()
  }, [initLanguage])

  const currentLanguageInfo = useMemo(() => {
    return getCurrentLanguageInfo(currentLanguage)
  }, [currentLanguage])

  // Enhanced translation function with additional features
  const enhancedT = useCallback(
    (key: string, fallback?: string): string => {
      // Use the store's translation function which already has fallback logic
      return t(key, fallback)
    },
    [t]
  )

  // Memoize detection stats to avoid unnecessary recalculations
  const detectionStats = useMemo(() => {
    return getDetectionStats()
  }, [getDetectionStats])

  return {
    t: enhancedT,
    currentLanguage,
    currentLanguageInfo,
    availableLanguages,
    setLanguage,
    isLanguageLoaded,
    isDetecting,
    detectedLanguage,
    isAutoDetected,
    detectionStats,
    refreshDetection,
    resetToDetected,
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
    const initLanguage = async () => {
      try {
        await initializeLanguage()
      } catch (error) {
        console.error('Failed to initialize language:', error)
      }
    }

    initLanguage()
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
    const initLanguage = async () => {
      try {
        await initializeLanguage()
      } catch (error) {
        console.error('Failed to initialize language:', error)
      }
    }

    initLanguage()
  }, [initializeLanguage])

  return useCallback((key: string, language: SupportedLanguage, fallback?: string): string => {
    return getTranslation(key, language, fallback)
  }, [])
}

/**
 * Hook for language detection status and controls
 */
export function useLanguageDetection() {
  const {
    isDetecting,
    detectedLanguage,
    isAutoDetected,
    getDetectionStats,
    refreshDetection,
    resetToDetected,
  } = useLanguageStore()

  // Memoize detection stats to avoid unnecessary recalculations
  const detectionStats = useMemo(() => {
    return getDetectionStats()
  }, [getDetectionStats])

  return {
    isDetecting,
    detectedLanguage,
    isAutoDetected,
    detectionStats,
    refreshDetection,
    resetToDetected,
  }
}
