'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  detectBrowserLanguage,
  createTranslationFunction,
  normalizeLanguageCode,
  getAvailableLanguages,
  type SupportedLanguage,
} from '@/lib/i18n'

interface LanguageState {
  currentLanguage: SupportedLanguage
  availableLanguages: ReturnType<typeof getAvailableLanguages>
  setLanguage: (language: string) => void
  t: (key: string, fallback?: string) => string
  initializeLanguage: () => void
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set, get) => ({
      currentLanguage: 'zh-CN', // Default fallback, will be overridden by initialization
      availableLanguages: getAvailableLanguages(),

      setLanguage: (language: string) => {
        const normalizedLanguage = normalizeLanguageCode(language)
        const translationFunction = createTranslationFunction(normalizedLanguage)

        set({
          currentLanguage: normalizedLanguage,
          t: translationFunction,
        })
      },

      t: createTranslationFunction('zh-CN'), // Default translation function

      initializeLanguage: () => {
        const state = get()

        // If we already have a stored language, use it
        if (state.currentLanguage && state.currentLanguage !== 'zh-CN') {
          const translationFunction = createTranslationFunction(state.currentLanguage)
          set({ t: translationFunction })
          return
        }

        // Otherwise, detect browser language
        const detectedLanguage = detectBrowserLanguage()
        const translationFunction = createTranslationFunction(detectedLanguage)

        set({
          currentLanguage: detectedLanguage,
          t: translationFunction,
        })
      },
    }),
    {
      name: 'language-storage',
      // Only persist the current language, not the translation function
      partialize: state => ({
        currentLanguage: state.currentLanguage,
      }),
    }
  )
)

// Helper function to get current language info
export const getCurrentLanguageInfo = (currentLanguage: SupportedLanguage) => {
  const availableLanguages = getAvailableLanguages()
  return availableLanguages.find(lang => lang.code === currentLanguage) || availableLanguages[0]
}
