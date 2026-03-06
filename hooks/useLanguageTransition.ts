'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useTranslation } from '@/hooks/useTranslation'

interface UseLanguageTransitionReturn {
  isTransitioning: boolean
  transitionProgress: number
  switchLanguage: (languageCode: string) => Promise<void>
  currentLanguage: string
}

const PROGRESS_STEP = 10
const PROGRESS_INTERVAL_MS = 30
const TRANSITION_FALLBACK_TIMEOUT_MS = 3000
const TRANSITION_COMPLETE = 100

/**
 * Hook for managing language transitions with smooth animations
 * Provides transition state and progress for UI feedback
 */
export function useLanguageTransition(): UseLanguageTransitionReturn {
  const { currentLanguage, setLanguage } = useTranslation()
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [transitionProgress, setTransitionProgress] = useState(0)
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const transitionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearTransitionTimers = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current)
      progressIntervalRef.current = null
    }

    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current)
      transitionTimeoutRef.current = null
    }
  }, [])

  useEffect(() => {
    return () => {
      clearTransitionTimers()
    }
  }, [clearTransitionTimers])

  // 语言切换函数
  const switchLanguage = useCallback(
    async (languageCode: string) => {
      // 如果语言相同，不执行切换
      if (languageCode === currentLanguage) {
        return
      }

      clearTransitionTimers()
      setIsTransitioning(true)
      setTransitionProgress(0)

      try {
        // 设置新语言
        await setLanguage(languageCode)

        // 模拟过渡进度
        progressIntervalRef.current = setInterval(() => {
          setTransitionProgress(prev => {
            const nextProgress = Math.min(prev + PROGRESS_STEP, TRANSITION_COMPLETE)
            if (nextProgress >= TRANSITION_COMPLETE) {
              clearTransitionTimers()
              setIsTransitioning(false)
              return TRANSITION_COMPLETE
            }
            return nextProgress
          })
        }, PROGRESS_INTERVAL_MS)

        // 确保过渡在3秒后结束（防止卡住）
        transitionTimeoutRef.current = setTimeout(() => {
          clearTransitionTimers()
          setIsTransitioning(false)
          setTransitionProgress(TRANSITION_COMPLETE)
          console.log('Transition timeout, forcing completion')
        }, TRANSITION_FALLBACK_TIMEOUT_MS)
      } catch (error) {
        clearTransitionTimers()
        if (process.env.NODE_ENV !== 'production') {
          console.error('Language switch failed:', error)
        }
        setIsTransitioning(false)
        setTransitionProgress(0)
      }
    },
    [clearTransitionTimers, currentLanguage, setLanguage]
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
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
  }, [])

  const switchLanguage = useCallback(
    async (languageCode: string) => {
      // 如果语言相同，不执行切换
      if (languageCode === currentLanguage) {
        return
      }

      setIsTransitioning(true)
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      try {
        await setLanguage(languageCode)
      } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
          console.error('Language switch failed:', error)
        }
        setIsTransitioning(false)
        return
      }

      // 使用定时器确保过渡状态能正确重置
      timeoutRef.current = setTimeout(() => {
        setIsTransitioning(false)
        timeoutRef.current = null
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
