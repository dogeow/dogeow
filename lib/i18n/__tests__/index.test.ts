import { describe, it, expect, vi } from 'vitest'
import i18n, {
  initializeI18n,
  translations,
  SUPPORTED_LANGUAGES,
  detectBrowserLanguage,
  isSupportedLanguage,
  getTranslation,
  createTranslationFunction,
  getLanguageNativeName,
  getLanguageEnglishName,
  normalizeLanguageCode,
  getAvailableLanguages,
  validateTranslations,
  getAllTranslationKeys,
  hasTranslationKey,
  validateAllTranslations,
  checkTranslationKeys,
  logTranslationStats,
} from '../index'

// Mock the utils module
vi.mock('../utils', () => ({
  detectBrowserLanguage: vi.fn(),
  createTranslationFunction: vi.fn(),
  normalizeLanguageCode: vi.fn(),
  isSupportedLanguage: vi.fn(),
  getTranslation: vi.fn(),
  getLanguageNativeName: vi.fn(),
  getLanguageEnglishName: vi.fn(),
  getAvailableLanguages: vi.fn(),
  validateTranslations: vi.fn(),
  getAllTranslationKeys: vi.fn(),
  hasTranslationKey: vi.fn(),
}))

// Mock the dev-tools module
vi.mock('../dev-tools', () => ({
  validateAllTranslations: vi.fn(),
  checkTranslationKeys: vi.fn(),
  logTranslationStats: vi.fn(),
}))

// Mock the translations module
vi.mock('../translations', () => ({
  translations: {
    'zh-CN': { 'nav.home': '首页' },
    en: { 'nav.home': 'Home' },
  },
  SUPPORTED_LANGUAGES: [
    { code: 'zh-CN', name: 'Chinese (Simplified)', nativeName: '简体中文' },
    { code: 'en', name: 'English', nativeName: 'English' },
  ],
}))

import {
  detectBrowserLanguage as mockDetectBrowserLanguage,
  createTranslationFunction as mockCreateTranslationFunction,
  normalizeLanguageCode as mockNormalizeLanguageCode,
} from '../utils'

describe('i18n index', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('exports', () => {
    it('should export translations and supported languages', () => {
      expect(translations).toBeDefined()
      expect(SUPPORTED_LANGUAGES).toBeDefined()
      expect(SUPPORTED_LANGUAGES).toHaveLength(2)
    })

    it('should export all utility functions', () => {
      expect(typeof detectBrowserLanguage).toBe('function')
      expect(typeof isSupportedLanguage).toBe('function')
      expect(typeof getTranslation).toBe('function')
      expect(typeof createTranslationFunction).toBe('function')
      expect(typeof getLanguageNativeName).toBe('function')
      expect(typeof getLanguageEnglishName).toBe('function')
      expect(typeof normalizeLanguageCode).toBe('function')
      expect(typeof getAvailableLanguages).toBe('function')
      expect(typeof validateTranslations).toBe('function')
      expect(typeof getAllTranslationKeys).toBe('function')
      expect(typeof hasTranslationKey).toBe('function')
    })

    it('should export dev tools functions', () => {
      expect(typeof validateAllTranslations).toBe('function')
      expect(typeof checkTranslationKeys).toBe('function')
      expect(typeof logTranslationStats).toBe('function')
    })
  })

  describe('initializeI18n', () => {
    it('should initialize with preferred language', () => {
      const mockTranslationFunction = vi.fn()

      vi.mocked(mockNormalizeLanguageCode).mockReturnValue('en')
      vi.mocked(mockCreateTranslationFunction).mockReturnValue(mockTranslationFunction)

      const result = initializeI18n('en')

      expect(mockNormalizeLanguageCode).toHaveBeenCalledWith('en')
      expect(mockCreateTranslationFunction).toHaveBeenCalledWith('en')
      expect(result).toEqual({
        language: 'en',
        t: mockTranslationFunction,
      })
    })

    it('should initialize with auto-detected language when no preference provided', () => {
      const mockTranslationFunction = vi.fn()

      vi.mocked(mockDetectBrowserLanguage).mockReturnValue('zh-CN')
      vi.mocked(mockCreateTranslationFunction).mockReturnValue(mockTranslationFunction)

      const result = initializeI18n()

      expect(mockDetectBrowserLanguage).toHaveBeenCalled()
      expect(mockNormalizeLanguageCode).not.toHaveBeenCalled()
      expect(mockCreateTranslationFunction).toHaveBeenCalledWith('zh-CN')
      expect(result).toEqual({
        language: 'zh-CN',
        t: mockTranslationFunction,
      })
    })

    it('should normalize invalid preferred language', () => {
      const mockTranslationFunction = vi.fn()

      vi.mocked(mockNormalizeLanguageCode).mockReturnValue('zh-CN')
      vi.mocked(mockCreateTranslationFunction).mockReturnValue(mockTranslationFunction)

      const result = initializeI18n('invalid-lang')

      expect(mockNormalizeLanguageCode).toHaveBeenCalledWith('invalid-lang')
      expect(mockDetectBrowserLanguage).not.toHaveBeenCalled()
      expect(mockCreateTranslationFunction).toHaveBeenCalledWith('zh-CN')
      expect(result).toEqual({
        language: 'zh-CN',
        t: mockTranslationFunction,
      })
    })

    it('should handle empty string as preferred language', () => {
      const mockTranslationFunction = vi.fn()

      vi.mocked(mockDetectBrowserLanguage).mockReturnValue('zh-CN')
      vi.mocked(mockCreateTranslationFunction).mockReturnValue(mockTranslationFunction)

      const result = initializeI18n('')

      // Empty string is falsy, so it should use auto-detection
      expect(mockDetectBrowserLanguage).toHaveBeenCalled()
      expect(mockNormalizeLanguageCode).not.toHaveBeenCalled()
      expect(result).toEqual({
        language: 'zh-CN',
        t: mockTranslationFunction,
      })
    })
  })

  describe('default export', () => {
    it('should export default i18n object with core functions', () => {
      expect(i18n).toBeDefined()
      expect(typeof i18n.initializeI18n).toBe('function')
      expect(typeof i18n.detectBrowserLanguage).toBe('function')
      expect(typeof i18n.createTranslationFunction).toBe('function')
      expect(typeof i18n.normalizeLanguageCode).toBe('function')
    })

    it('should have the same initializeI18n function as named export', () => {
      expect(i18n.initializeI18n).toBe(initializeI18n)
    })
  })

  describe('re-exported functions', () => {
    it('should call the underlying utility functions', () => {
      // Test that the re-exported functions are actually the same as the imported ones
      expect(detectBrowserLanguage).toBe(mockDetectBrowserLanguage)
      expect(createTranslationFunction).toBe(mockCreateTranslationFunction)
      expect(normalizeLanguageCode).toBe(mockNormalizeLanguageCode)
    })
  })

  describe('type exports', () => {
    it('should export TypeScript types', () => {
      // This is more of a compilation test, but we can verify the types exist
      // by checking that the translations object conforms to the expected structure
      expect(translations).toHaveProperty('zh-CN')
      expect(translations).toHaveProperty('en')
      expect(typeof translations['zh-CN']).toBe('object')
      expect(typeof translations['en']).toBe('object')
    })
  })
})
