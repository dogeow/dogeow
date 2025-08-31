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
        currentLanguage: 'en', // Default fallback, will be overridden by initialization
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
            console.log('[LanguageStore] Setting language:', {
              requested: language,
              normalized: normalizedLanguage,
              rememberPreference,
              previousLanguage: get().currentLanguage,
            })
          }

          // Remember user preference if requested
          if (rememberPreference) {
            get().setLanguagePreference(normalizedLanguage)
          }

          set({
            currentLanguage: normalizedLanguage,
            t: translationFunction,
            isAutoDetected: false,
          })

          if (shouldLog()) {
            console.log('[LanguageStore] Language set successfully:', {
              newLanguage: normalizedLanguage,
              isAutoDetected: false,
            })
          }
        },

        t: createTranslationFunction('zh-CN'), // Default translation function

        initializeLanguage: async () => {
          const state = get()
          if (shouldLog()) {
            console.log('[LanguageStore] Initializing language...')
          }

          // If we already have a stored language preference, use it
          const storedPreference = state.getLanguagePreference()
          if (storedPreference && storedPreference !== 'en') {
            if (shouldLog()) {
              console.log('[LanguageStore] ✅ Using stored preference:', storedPreference)
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
            console.log('[LanguageStore] No stored preference, performing detection...')
          }
          // Otherwise, perform advanced language detection
          await state.refreshDetection()
        },

        refreshDetection: async () => {
          if (shouldLog()) {
            console.log('[LanguageStore] Starting language detection...')
          }
          set({ isDetecting: true })

          try {
            const detectionResult = await languageDetectionService.detectLanguage()
            const detectedLanguage = detectionResult.language
            const translationFunction = createTranslationFunction(detectedLanguage)
            const now = Date.now()

            if (shouldLog()) {
              console.log('[LanguageStore] Detection completed:', {
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

            // Store the detected language for future reference
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
                console.log('[LanguageStore] Stored detection result in localStorage')
              }
            }
          } catch (error) {
            console.error('[LanguageStore] Language detection failed:', error)

            // Fallback to basic detection
            if (shouldLog()) {
              console.log('[LanguageStore] Falling back to basic detection...')
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
              console.log('[LanguageStore] Fallback detection completed:', {
                fallbackLanguage,
                timestamp: new Date(now).toISOString(),
              })
            }
          }
        },

        resetToDetected: () => {
          const state = get()
          if (state.detectedLanguage) {
            if (shouldLog()) {
              console.log('[LanguageStore] Resetting to detected language:', state.detectedLanguage)
            }
            state.setLanguage(state.detectedLanguage, false)
            set({ isAutoDetected: true })
          } else {
            if (shouldLog()) {
              console.log('[LanguageStore] No detected language to reset to')
            }
          }
        },

        getLanguagePreference: () => {
          if (typeof window === 'undefined') return 'zh-CN'

          try {
            const stored = localStorage.getItem('dogeow-language-preference')
            if (stored && isSupportedLanguage(stored)) {
              if (shouldLog()) {
                console.log('[LanguageStore] Retrieved stored preference:', stored)
              }
              return stored
            }
            if (stored) {
              if (shouldLog()) {
                console.log('[LanguageStore] Stored preference not supported:', stored)
              }
            }
          } catch (error) {
            console.warn('[LanguageStore] Failed to get language preference:', error)
          }

          return 'zh-CN'
        },

        setLanguagePreference: (language: SupportedLanguage) => {
          if (typeof window === 'undefined') return

          try {
            if (shouldLog()) {
              console.log('[LanguageStore] Setting language preference:', language)
            }
            localStorage.setItem('dogeow-language-preference', language)
          } catch (error) {
            console.warn('[LanguageStore] Failed to set language preference:', error)
          }
        },

        getDetectionStats: () => {
          const state = get()
          if (!state.detectionResult) {
            // 只在开发环境下输出日志，避免生产环境过多日志
            if (process.env.NODE_ENV === 'development') {
              if (shouldLog()) {
                console.log('[LanguageStore] No detection stats available')
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
              console.log('[LanguageStore] Detection stats:', stats)
            }
            lastLogTime = now
          }

          return stats
        },
      }
    },
    {
      name: 'language-storage',
      // Only persist the current language and detection info, not the translation function
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

// Helper function to get current language info
export const getCurrentLanguageInfo = (currentLanguage: SupportedLanguage) => {
  const availableLanguages = getAvailableLanguages()
  return availableLanguages.find(lang => lang.code === currentLanguage) || availableLanguages[0]
}

// Helper function to check if language detection is stale (older than 7 days)
export const isLanguageDetectionStale = (lastDetectionTime: number | null) => {
  if (!lastDetectionTime) return true

  const sevenDays = 7 * 24 * 60 * 60 * 1000
  return Date.now() - lastDetectionTime > sevenDays
}

// Helper function to check if we should re-detect language
export const shouldRedetectLanguage = (
  lastDetectionTime: number | null,
  isAutoDetected: boolean
) => {
  // Always re-detect if never detected before
  if (!lastDetectionTime) return true

  // Re-detect if detection is stale and was auto-detected
  if (isLanguageDetectionStale(lastDetectionTime) && isAutoDetected) {
    return true
  }

  return false
}
