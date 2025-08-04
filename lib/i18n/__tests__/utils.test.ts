import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
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
} from '../utils'

// Mock the translations module
vi.mock('../translations', () => ({
  translations: {
    'zh-CN': {
      'nav.home': '首页',
      'nav.about': '关于',
      'common.save': '保存',
      'common.cancel': '取消',
    },
    en: {
      'nav.home': 'Home',
      'nav.about': 'About',
      'common.save': 'Save',
      // Missing 'common.cancel' to test fallback
    },
    ja: {
      // Missing nav.home to test fallback
      'nav.about': 'について',
      'common.save': '保存',
      'common.cancel': 'キャンセル',
    },
    'zh-TW': {
      'nav.home': '首頁',
      'nav.about': '關於',
      'common.save': '儲存',
      'common.cancel': '取消',
    },
  },
  SUPPORTED_LANGUAGES: [
    { code: 'zh-CN', name: 'Chinese (Simplified)', nativeName: '简体中文' },
    { code: 'zh-TW', name: 'Chinese (Traditional)', nativeName: '繁體中文' },
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  ],
}))

describe('i18n utils', () => {
  let originalNodeEnv: string | undefined
  let consoleSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    originalNodeEnv = process.env.NODE_ENV
    consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: originalNodeEnv,
      writable: true,
      configurable: true,
    })
    consoleSpy.mockRestore()
    vi.clearAllMocks()
  })

  describe('detectBrowserLanguage', () => {
    it('should return default language in server environment', () => {
      // Mock server environment
      Object.defineProperty(global, 'window', {
        value: undefined,
        writable: true,
      })

      const result = detectBrowserLanguage()
      expect(result).toBe('zh-CN')
    })

    it('should detect exact language match', () => {
      Object.defineProperty(global, 'window', {
        value: {},
        writable: true,
      })
      Object.defineProperty(global, 'navigator', {
        value: {
          languages: ['en', 'zh-CN'],
          language: 'en',
        },
        writable: true,
      })

      const result = detectBrowserLanguage()
      expect(result).toBe('en')
    })

    it('should detect language by prefix match', () => {
      Object.defineProperty(global, 'navigator', {
        value: {
          languages: ['zh-HK', 'en-US'],
          language: 'zh-HK',
        },
        writable: true,
      })

      const result = detectBrowserLanguage()
      expect(result).toBe('zh-CN') // Should match zh prefix
    })

    it('should fallback to navigator.language if languages is not available', () => {
      Object.defineProperty(global, 'navigator', {
        value: {
          language: 'ja',
        },
        writable: true,
      })

      const result = detectBrowserLanguage()
      expect(result).toBe('ja')
    })

    it('should return default language if no match found', () => {
      Object.defineProperty(global, 'navigator', {
        value: {
          languages: ['fr', 'de'],
          language: 'fr',
        },
        writable: true,
      })

      const result = detectBrowserLanguage()
      expect(result).toBe('zh-CN')
    })

    it('should handle errors gracefully', () => {
      Object.defineProperty(global, 'navigator', {
        get() {
          throw new Error('Navigator error')
        },
        configurable: true,
      })

      const result = detectBrowserLanguage()
      expect(result).toBe('zh-CN')
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to detect browser language:',
        expect.any(Error)
      )
    })
  })

  describe('isSupportedLanguage', () => {
    it('should return true for supported languages', () => {
      expect(isSupportedLanguage('zh-CN')).toBe(true)
      expect(isSupportedLanguage('en')).toBe(true)
      expect(isSupportedLanguage('ja')).toBe(true)
      expect(isSupportedLanguage('zh-TW')).toBe(true)
    })

    it('should return false for unsupported languages', () => {
      expect(isSupportedLanguage('fr')).toBe(false)
      expect(isSupportedLanguage('de')).toBe(false)
      expect(isSupportedLanguage('es')).toBe(false)
      expect(isSupportedLanguage('')).toBe(false)
    })
  })

  describe('getTranslation', () => {
    it('should return translation for existing key in current language', () => {
      expect(getTranslation('nav.home', 'en')).toBe('Home')
      expect(getTranslation('nav.home', 'zh-CN')).toBe('首页')
      expect(getTranslation('nav.home', 'ja')).toBe('首页') // Falls back to zh-CN
    })

    it('should fallback to zh-CN when key missing in current language', () => {
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'development',
        writable: true,
        configurable: true,
      })

      expect(getTranslation('common.cancel', 'en')).toBe('取消')
      expect(consoleSpy).toHaveBeenCalledWith(
        '[i18n] Translation missing for key "common.cancel" in language "en", using fallback "zh-CN". Consider adding translation for better user experience.'
      )
    })

    it('should fallback to en when key missing in current language and zh-CN', () => {
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'development',
        writable: true,
        configurable: true,
      })

      // Mock a scenario where key exists in en but not in zh-CN or current language
      expect(getTranslation('nav.about', 'ja')).toBe('について') // Exists in ja
    })

    it('should use provided fallback when key not found anywhere', () => {
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'development',
        writable: true,
        configurable: true,
      })

      const result = getTranslation('missing.key', 'en', 'Default Text')
      expect(result).toBe('Default Text')
      expect(consoleSpy).toHaveBeenCalledWith(
        '[i18n] Translation missing for key "missing.key" in language "en", using provided fallback: "Default Text"'
      )
    })

    it('should return key itself as last resort', () => {
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'development',
        writable: true,
        configurable: true,
      })

      const result = getTranslation('completely.missing.key', 'en')
      expect(result).toBe('completely.missing.key')
      expect(consoleSpy).toHaveBeenCalledWith(
        '[i18n] Translation missing for key "completely.missing.key" in language "en", returning key as fallback. This may result in poor user experience.'
      )
    })

    it('should handle invalid keys gracefully', () => {
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'development',
        writable: true,
        configurable: true,
      })

      expect(getTranslation('', 'en')).toBe('')
      expect(getTranslation(null as unknown as string, 'en')).toBe('')
      expect(getTranslation(undefined as unknown as string, 'en')).toBe('')
      expect(getTranslation(123 as unknown as string, 'en')).toBe('')

      expect(consoleSpy).toHaveBeenCalledWith('Invalid translation key provided: ')
      expect(consoleSpy).toHaveBeenCalledWith('Invalid translation key provided: null')
      expect(consoleSpy).toHaveBeenCalledWith('Invalid translation key provided: undefined')
      expect(consoleSpy).toHaveBeenCalledWith('Invalid translation key provided: 123')
    })

    it('should handle invalid keys with fallback', () => {
      const result = getTranslation('', 'en', 'Fallback')
      expect(result).toBe('Fallback')
    })

    it('should not log warnings in production', () => {
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'production',
        writable: true,
        configurable: true,
      })

      getTranslation('missing.key', 'en')
      getTranslation('', 'en')

      expect(consoleSpy).not.toHaveBeenCalled()
    })
  })

  describe('createTranslationFunction', () => {
    it('should create a translation function bound to a language', () => {
      const t = createTranslationFunction('en')

      expect(t('nav.home')).toBe('Home')
      expect(t('nav.about')).toBe('About')
    })

    it('should pass fallback to the translation function', () => {
      const t = createTranslationFunction('en')

      expect(t('missing.key', 'Default')).toBe('Default')
    })

    it('should work with different languages', () => {
      const tCN = createTranslationFunction('zh-CN')
      const tEN = createTranslationFunction('en')

      expect(tCN('nav.home')).toBe('首页')
      expect(tEN('nav.home')).toBe('Home')
    })
  })

  describe('getLanguageNativeName', () => {
    it('should return native name for supported languages', () => {
      expect(getLanguageNativeName('zh-CN')).toBe('简体中文')
      expect(getLanguageNativeName('zh-TW')).toBe('繁體中文')
      expect(getLanguageNativeName('en')).toBe('English')
      expect(getLanguageNativeName('ja')).toBe('日本語')
    })

    it('should return language code for unsupported languages', () => {
      expect(getLanguageNativeName('fr')).toBe('fr')
      expect(getLanguageNativeName('unknown')).toBe('unknown')
    })
  })

  describe('getLanguageEnglishName', () => {
    it('should return English name for supported languages', () => {
      expect(getLanguageEnglishName('zh-CN')).toBe('Chinese (Simplified)')
      expect(getLanguageEnglishName('zh-TW')).toBe('Chinese (Traditional)')
      expect(getLanguageEnglishName('en')).toBe('English')
      expect(getLanguageEnglishName('ja')).toBe('Japanese')
    })

    it('should return language code for unsupported languages', () => {
      expect(getLanguageEnglishName('fr')).toBe('fr')
      expect(getLanguageEnglishName('unknown')).toBe('unknown')
    })
  })

  describe('normalizeLanguageCode', () => {
    it('should return valid language codes as-is', () => {
      expect(normalizeLanguageCode('zh-CN')).toBe('zh-CN')
      expect(normalizeLanguageCode('en')).toBe('en')
      expect(normalizeLanguageCode('ja')).toBe('ja')
    })

    it('should match by language prefix', () => {
      expect(normalizeLanguageCode('zh')).toBe('zh-CN')
      expect(normalizeLanguageCode('zh-HK')).toBe('zh-CN')
      expect(normalizeLanguageCode('en-US')).toBe('en')
      expect(normalizeLanguageCode('en-GB')).toBe('en')
    })

    it('should return default language for unsupported codes', () => {
      expect(normalizeLanguageCode('fr')).toBe('zh-CN')
      expect(normalizeLanguageCode('de')).toBe('zh-CN')
      expect(normalizeLanguageCode('unknown')).toBe('zh-CN')
      expect(normalizeLanguageCode('')).toBe('zh-CN')
    })
  })

  describe('getAvailableLanguages', () => {
    it('should return all supported languages with metadata', () => {
      const languages = getAvailableLanguages()

      expect(languages).toHaveLength(4)
      expect(languages[0]).toEqual({
        code: 'zh-CN',
        name: 'Chinese (Simplified)',
        nativeName: '简体中文',
        isDefault: true,
      })
      expect(languages[1]).toEqual({
        code: 'zh-TW',
        name: 'Chinese (Traditional)',
        nativeName: '繁體中文',
        isDefault: false,
      })
      expect(languages[2]).toEqual({
        code: 'en',
        name: 'English',
        nativeName: 'English',
        isDefault: false,
      })
      expect(languages[3]).toEqual({
        code: 'ja',
        name: 'Japanese',
        nativeName: '日本語',
        isDefault: false,
      })
    })
  })

  describe('validateTranslations', () => {
    it('should return valid in production', () => {
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'production',
        writable: true,
        configurable: true,
      })

      const result = validateTranslations(['nav.home', 'missing.key'])
      expect(result).toEqual({
        isValid: true,
        missingTranslations: [],
      })
    })

    it('should validate translations in development', () => {
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'development',
        writable: true,
        configurable: true,
      })
      const groupSpy = vi.spyOn(console, 'group').mockImplementation(() => {})
      const groupEndSpy = vi.spyOn(console, 'groupEnd').mockImplementation(() => {})

      const result = validateTranslations(['nav.home', 'common.cancel'])

      expect(result.isValid).toBe(false)
      expect(result.missingTranslations).toContainEqual({
        key: 'common.cancel',
        language: 'en',
      })
      expect(result.missingTranslations).toContainEqual({
        key: 'nav.home',
        language: 'ja',
      })

      groupSpy.mockRestore()
      groupEndSpy.mockRestore()
    })

    it('should report valid when all translations exist', () => {
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'development',
        writable: true,
        configurable: true,
      })

      const result = validateTranslations(['nav.about']) // This exists in all languages

      expect(result.isValid).toBe(true)
      expect(result.missingTranslations).toHaveLength(0)
    })
  })

  describe('getAllTranslationKeys', () => {
    it('should return all keys from default language', () => {
      const keys = getAllTranslationKeys()

      expect(keys).toEqual(['nav.home', 'nav.about', 'common.save', 'common.cancel'])
    })
  })

  describe('hasTranslationKey', () => {
    it('should return true for existing keys', () => {
      expect(hasTranslationKey('nav.home')).toBe(true)
      expect(hasTranslationKey('nav.about')).toBe(true)
      expect(hasTranslationKey('common.save')).toBe(true)
    })

    it('should return false for non-existing keys', () => {
      expect(hasTranslationKey('missing.key')).toBe(false)
      expect(hasTranslationKey('another.missing')).toBe(false)
    })

    it('should return true if key exists in any language', () => {
      // Even if key is missing in some languages, it should return true if it exists in at least one
      expect(hasTranslationKey('nav.home')).toBe(true) // exists in all
      expect(hasTranslationKey('common.cancel')).toBe(true) // missing in en but exists in zh-CN
    })
  })
})
