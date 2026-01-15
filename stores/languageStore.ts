'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  detectBrowserLanguage,
  createTranslationFunction,
  normalizeLanguageCode,
  getAvailableLanguages,
  isSupportedLanguage,
  type SupportedLanguage,
} from '@/lib/i18n'
import {
  languageDetectionService,
  type LanguageDetectionResult,
} from '@/lib/i18n/language-detection-service'

interface LanguageState {
  currentLanguage: SupportedLanguage
  availableLanguages: ReturnType<typeof getAvailableLanguages>
  detectedLanguage: SupportedLanguage | null
  detectionResult: LanguageDetectionResult | null
  isAutoDetected: boolean
  lastDetectionTime: number | null
  isDetecting: boolean
  setLanguage: (language: string, rememberPreference?: boolean) => void
  t: (key: string, fallback?: string) => string
  initializeLanguage: () => Promise<void>
  resetToDetected: () => void
  getLanguagePreference: () => SupportedLanguage
  setLanguagePreference: (language: SupportedLanguage) => void
  refreshDetection: () => Promise<void>
  getDetectionStats: () => { confidence: number; method: string; timestamp: number | null }
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set, get) => {
      // 添加防抖机制，避免频繁的日志输出
      let lastLogTime = 0
      const LOG_THROTTLE_MS = 1000 // 1秒内只输出一次日志

      // 全局日志控制开关
      const shouldLog = () => {
        const now = Date.now()
        if (now - lastLogTime > LOG_THROTTLE_MS) {
          lastLogTime = now
          return true
        }
        return false
      }

      return {
        currentLanguage: 'en', // 默认回退语言，初始化后会被覆盖
        availableLanguages: getAvailableLanguages(),
        detectedLanguage: null,
        detectionResult: null,
        isAutoDetected: false,
        lastDetectionTime: null,
        isDetecting: false,

        setLanguage: (language: string, rememberPreference: boolean = true) => {
          const normalizedLanguage = normalizeLanguageCode(language)
          const translationFunction = createTranslationFunction(normalizedLanguage)

          if (shouldLog()) {
            console.log('[LanguageStore] 设置语言:', {
              requested: language,
              normalized: normalizedLanguage,
              rememberPreference,
              previousLanguage: get().currentLanguage,
            })
          }

          // 如需记住用户偏好则保存
          if (rememberPreference) {
            get().setLanguagePreference(normalizedLanguage)
          }

          set({
            currentLanguage: normalizedLanguage,
            t: translationFunction,
            isAutoDetected: false,
          })

          if (shouldLog()) {
            console.log('[LanguageStore] 语言设置成功:', {
              newLanguage: normalizedLanguage,
              isAutoDetected: false,
            })
          }
        },

        t: createTranslationFunction('zh-CN'), // 默认翻译函数

        initializeLanguage: async () => {
          const state = get()
          if (shouldLog()) {
            console.log('[LanguageStore] 初始化语言...')
          }

          // 如果已有存储的语言偏好，则直接使用
          const storedPreference = state.getLanguagePreference()
          if (storedPreference && storedPreference !== 'en') {
            if (shouldLog()) {
              console.log('[LanguageStore] ✅ 使用存储的偏好:', storedPreference)
            }
            const translationFunction = createTranslationFunction(storedPreference)
            set({
              currentLanguage: storedPreference,
              t: translationFunction,
              isAutoDetected: false,
              lastDetectionTime: Date.now(),
            })
            return
          }

          if (shouldLog()) {
            console.log('[LanguageStore] 没有存储的偏好，开始检测...')
          }
          // 否则执行高级语言检测
          await state.refreshDetection()
        },

        refreshDetection: async () => {
          if (shouldLog()) {
            console.log('[LanguageStore] 开始语言检测...')
          }
          set({ isDetecting: true })

          try {
            const detectionResult = await languageDetectionService.forceRedetect({
              ignoreStoredPreference: true,
            })
            const detectedLanguage = detectionResult.language
            const translationFunction = createTranslationFunction(detectedLanguage)
            const now = Date.now()

            if (shouldLog()) {
              console.log('[LanguageStore] 检测完成:', {
                detectedLanguage,
                method: detectionResult.method,
                confidence: detectionResult.confidence,
                timestamp: new Date(now).toISOString(),
              })
            }

            set({
              currentLanguage: detectedLanguage,
              t: translationFunction,
              detectedLanguage,
              detectionResult,
              isAutoDetected: true,
              lastDetectionTime: now,
              isDetecting: false,
            })

            // 存储检测到的语言以便下次使用
            if (typeof window !== 'undefined') {
              localStorage.setItem(
                'dogeow-detected-language',
                JSON.stringify({
                  language: detectedLanguage,
                  timestamp: now,
                  confidence: detectionResult.confidence,
                  method: detectionResult.method,
                })
              )
              if (shouldLog()) {
                console.log('[LanguageStore] 检测结果已存储到localStorage')
              }

              // 显示成功提示
              const { toast } = await import('sonner')
              toast.success(
                translationFunction('language.detection.refresh_success', '语言检测已刷新')
              )
            }
          } catch (error) {
            console.error('[LanguageStore] 语言检测失败:', error)

            // 回退到基础检测
            if (shouldLog()) {
              console.log('[LanguageStore] 回退到基础检测...')
            }
            const fallbackLanguage = detectBrowserLanguage()
            const translationFunction = createTranslationFunction(fallbackLanguage)
            const now = Date.now()

            set({
              currentLanguage: fallbackLanguage,
              t: translationFunction,
              detectedLanguage: fallbackLanguage,
              isAutoDetected: true,
              lastDetectionTime: now,
              isDetecting: false,
            })

            if (shouldLog()) {
              console.log('[LanguageStore] 回退检测完成:', {
                fallbackLanguage,
                timestamp: new Date(now).toISOString(),
              })
            }

            // 显示失败提示
            if (typeof window !== 'undefined') {
              const { toast } = await import('sonner')
              toast.error(
                translationFunction('language.detection.refresh_failed', '语言检测刷新失败')
              )
            }
          }
        },

        resetToDetected: () => {
          const state = get()
          if (state.detectedLanguage) {
            if (shouldLog()) {
              console.log('[LanguageStore] 重置为检测到的语言:', state.detectedLanguage)
            }
            state.setLanguage(state.detectedLanguage, false)
            set({ isAutoDetected: true })
          } else {
            if (shouldLog()) {
              console.log('[LanguageStore] 没有可重置的检测语言')
            }
          }
        },

        getLanguagePreference: () => {
          if (typeof window === 'undefined') return 'zh-CN'

          try {
            const stored = localStorage.getItem('dogeow-language-preference')
            if (stored && isSupportedLanguage(stored)) {
              if (shouldLog()) {
                console.log('[LanguageStore] 获取到存储的偏好:', stored)
              }
              return stored
            }
            if (stored) {
              if (shouldLog()) {
                console.log('[LanguageStore] 存储的偏好不被支持:', stored)
              }
            }
          } catch (error) {
            console.warn('[LanguageStore] 获取语言偏好失败:', error)
          }

          return 'zh-CN'
        },

        setLanguagePreference: (language: SupportedLanguage) => {
          if (typeof window === 'undefined') return

          try {
            if (shouldLog()) {
              console.log('[LanguageStore] 设置语言偏好:', language)
            }
            localStorage.setItem('dogeow-language-preference', language)
          } catch (error) {
            console.warn('[LanguageStore] 设置语言偏好失败:', error)
          }
        },

        getDetectionStats: () => {
          const state = get()
          if (!state.detectionResult) {
            // 只在开发环境下输出日志，避免生产环境过多日志
            if (process.env.NODE_ENV === 'development') {
              if (shouldLog()) {
                console.log('[LanguageStore] 没有可用的检测统计信息')
              }
            }
            return { confidence: 0, method: 'none', timestamp: null }
          }

          const stats = {
            confidence: state.detectionResult.confidence,
            method: state.detectionResult.method,
            timestamp: state.detectionResult.timestamp,
          }

          // 使用防抖机制，避免频繁的日志输出
          const now = Date.now()
          if (process.env.NODE_ENV === 'development' && now - lastLogTime > LOG_THROTTLE_MS) {
            if (shouldLog()) {
              console.log('[LanguageStore] 检测统计信息:', stats)
            }
            lastLogTime = now
          }

          return stats
        },
      }
    },
    {
      name: 'language-storage',
      // 只持久化当前语言和检测信息，不持久化翻译函数
      partialize: state => ({
        currentLanguage: state.currentLanguage,
        detectedLanguage: state.detectedLanguage,
        detectionResult: state.detectionResult,
        isAutoDetected: state.isAutoDetected,
        lastDetectionTime: state.lastDetectionTime,
      }),
    }
  )
)

// 获取当前语言信息的辅助函数
export const getCurrentLanguageInfo = (currentLanguage: SupportedLanguage) => {
  const availableLanguages = getAvailableLanguages()
  return availableLanguages.find(lang => lang.code === currentLanguage) || availableLanguages[0]
}

// 检查语言检测是否过期（超过7天）的辅助函数
export const isLanguageDetectionStale = (lastDetectionTime: number | null) => {
  if (!lastDetectionTime) return true

  const sevenDays = 7 * 24 * 60 * 60 * 1000
  return Date.now() - lastDetectionTime > sevenDays
}

// 判断是否需要重新检测语言的辅助函数
export const shouldRedetectLanguage = (
  lastDetectionTime: number | null,
  isAutoDetected: boolean
) => {
  // 如果从未检测过则始终重新检测
  if (!lastDetectionTime) return true

  // 如果检测已过期且是自动检测的，则重新检测
  if (isLanguageDetectionStale(lastDetectionTime) && isAutoDetected) {
    return true
  }

  return false
}
