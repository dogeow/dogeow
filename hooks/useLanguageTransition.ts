'use client'

import { useState, useCallback } from 'react'
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

  // 语言切换函数
  const switchLanguage = useCallback(
    async (languageCode: string) => {
      console.log('switchLanguage called with:', languageCode, 'current:', currentLanguage)

      // 如果语言相同，不执行切换
      if (languageCode === currentLanguage) {
        return
      }

      setIsTransitioning(true)
      setTransitionProgress(0)

      try {
        // 设置新语言
        await setLanguage(languageCode)

        // 模拟过渡进度
        const progressInterval = setInterval(() => {
          setTransitionProgress(prev => {
            console.log('Progress update:', prev + 10)
            if (prev >= 100) {
              console.log('Transition complete, setting isTransitioning to false')
              clearInterval(progressInterval)
              setIsTransitioning(false)
              return 100
            }
            return prev + 10
          })
        }, 30)

        // 确保过渡在3秒后结束（防止卡住）
        setTimeout(() => {
          clearInterval(progressInterval)
          setIsTransitioning(false)
          setTransitionProgress(100)
          console.log('Transition timeout, forcing completion')
        }, 3000)
      } catch (error) {
        console.error('Language switch failed:', error)
        setIsTransitioning(false)
        setTransitionProgress(0)
      }
    },
    [setLanguage, currentLanguage]
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

  const switchLanguage = useCallback(
    async (languageCode: string) => {
      // 如果语言相同，不执行切换
      if (languageCode === currentLanguage) {
        return
      }

      setIsTransitioning(true)
      await setLanguage(languageCode)

      // 使用定时器确保过渡状态能正确重置
      setTimeout(() => {
        setIsTransitioning(false)
      }, duration)
    },
    [setLanguage, duration, currentLanguage]
  )

  return {
    isTransitioning,
    switchLanguage,
    currentLanguage,
  }
}
