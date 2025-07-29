'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from '@/hooks/useTranslation'

interface UseLanguageTransitionReturn {
  isTransitioning: boolean
  transitionProgress: number
  switchLanguage: (languageCode: string) => Promise<void>
  currentLanguage: string
}

/**
 * Hook for managing language transitions with smooth animations
 * Provides transition state and progress for UI feedback
 */
export function useLanguageTransition(): UseLanguageTransitionReturn {
  const { currentLanguage, setLanguage } = useTranslation()
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [transitionProgress, setTransitionProgress] = useState(0)
  const [prevLanguage, setPrevLanguage] = useState(currentLanguage)

  // 检测语言变化
  useEffect(() => {
    if (prevLanguage !== currentLanguage) {
      setIsTransitioning(true)
      setPrevLanguage(currentLanguage)

      // 重置进度
      setTransitionProgress(0)

      // 模拟过渡进度
      const progressInterval = setInterval(() => {
        setTransitionProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressInterval)
            setIsTransitioning(false)
            return 100
          }
          return prev + 10
        })
      }, 30)

      return () => clearInterval(progressInterval)
    }
  }, [currentLanguage, prevLanguage])

  // 语言切换函数
  const switchLanguage = useCallback(
    async (languageCode: string) => {
      if (languageCode === currentLanguage) return

      setIsTransitioning(true)
      setTransitionProgress(0)

      try {
        // 设置新语言
        setLanguage(languageCode)

        // 等待一小段时间确保状态更新
        await new Promise(resolve => setTimeout(resolve, 100))
      } catch (error) {
        console.error('Language switch failed:', error)
        setIsTransitioning(false)
        setTransitionProgress(0)
      }
    },
    [currentLanguage, setLanguage]
  )

  return {
    isTransitioning,
    transitionProgress,
    switchLanguage,
    currentLanguage,
  }
}

/**
 * Hook for language transition with custom duration
 */
export function useLanguageTransitionWithDuration(duration: number = 300) {
  const { currentLanguage, setLanguage } = useTranslation()
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [prevLanguage, setPrevLanguage] = useState(currentLanguage)

  useEffect(() => {
    if (prevLanguage !== currentLanguage) {
      setIsTransitioning(true)
      setPrevLanguage(currentLanguage)

      const timer = setTimeout(() => {
        setIsTransitioning(false)
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [currentLanguage, prevLanguage, duration])

  const switchLanguage = useCallback(
    async (languageCode: string) => {
      if (languageCode === currentLanguage) return

      setIsTransitioning(true)
      setLanguage(languageCode)
    },
    [currentLanguage, setLanguage]
  )

  return {
    isTransitioning,
    switchLanguage,
    currentLanguage,
  }
}
