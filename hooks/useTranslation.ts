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
 * 用于访问翻译功能的 Hook
 * 首次使用时自动初始化语言检测
 * 提供带有兜底支持的全面翻译功能
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

  // 组件挂载时初始化语言检测 - 使用 useCallback 避免重复调用
  const initLanguage = useCallback(async () => {
    if (isLanguageLoaded) return

    try {
      await initializeLanguage()
      setIsLanguageLoaded(true)
    } catch (error) {
      console.error('初始化语言失败:', error)
      setIsLanguageLoaded(true) // 即使出错也设置为 true，防止无限加载
    }
  }, [initializeLanguage, isLanguageLoaded])

  useEffect(() => {
    initLanguage()
  }, [initLanguage])

  const currentLanguageInfo = useMemo(() => {
    return getCurrentLanguageInfo(currentLanguage)
  }, [currentLanguage])

  // 增强版翻译函数，带有额外功能
  const enhancedT = useCallback(
    (key: string, fallback?: string): string => {
      // 使用 store 的翻译函数，已包含兜底逻辑
      return t(key, fallback)
    },
    [t]
  )

  // 检测状态数据做缓存，避免不必要的重新计算
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
 * 仅返回翻译函数的轻量级 Hook
 * 只需要翻译功能且不需要切换语言时使用
 */
export function useT() {
  const { t, initializeLanguage } = useLanguageStore()

  // 确保语言已初始化
  useEffect(() => {
    const initLanguage = async () => {
      try {
        await initializeLanguage()
      } catch (error) {
        console.error('初始化语言失败:', error)
      }
    }

    initLanguage()
  }, [initializeLanguage])

  return t
}

/**
 * 获取指定语言翻译的 Hook
 * 用于无需更改全局状态时获取不同语言的翻译
 */
export function useTranslationWithLanguage() {
  const { initializeLanguage } = useLanguageStore()

  // 确保语言已初始化
  useEffect(() => {
    const initLanguage = async () => {
      try {
        await initializeLanguage()
      } catch (error) {
        console.error('初始化语言失败:', error)
      }
    }

    initLanguage()
  }, [initializeLanguage])

  return useCallback((key: string, language: SupportedLanguage, fallback?: string): string => {
    return getTranslation(key, language, fallback)
  }, [])
}

/**
 * 语言检测状态与控制的 Hook
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

  // 检测状态数据做缓存，避免不必要的重新计算
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
