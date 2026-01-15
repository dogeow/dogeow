import { describe, it, expect, vi, beforeEach } from 'vitest'
import { LanguageDetectionService } from '../language-detection-service'

// Mock navigator properties
const mockNavigator = {
  languages: ['en-US', 'en'],
  language: 'en-US',
  userLanguage: undefined,
  systemLanguage: undefined,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
}

// Mock Intl.DateTimeFormat
const mockDateTimeFormat = {
  resolvedOptions: () => ({
    timeZone: 'America/New_York',
  }),
}

describe('LanguageDetectionService', () => {
  let service: LanguageDetectionService

  beforeEach(() => {
    service = LanguageDetectionService.getInstance()
    service.clearCache()

    // Reset mocks
    vi.clearAllMocks()

    // Mock global objects
    Object.defineProperty(global, 'navigator', {
      value: mockNavigator,
      writable: true,
    })

    Object.defineProperty(global, 'Intl', {
      value: { DateTimeFormat: mockDateTimeFormat },
      writable: true,
    })

    Object.defineProperty(global, 'localStorage', {
      value: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      },
      writable: true,
    })
  })

  describe('getInstance', () => {
    it('should return the same instance', () => {
      const instance1 = LanguageDetectionService.getInstance()
      const instance2 = LanguageDetectionService.getInstance()
      expect(instance1).toBe(instance2)
    })
  })

  describe('detectLanguage', () => {
    it('should return cached result if available', async () => {
      // Mock cache with recent result
      const mockResult = {
        language: 'en' as const,
        confidence: 0.9,
        method: 'browser' as const,
        timestamp: Date.now(),
      }

      // Manually set cache
      ;(service as any).cache.set('language-detection:with-pref', mockResult)

      const result = await service.detectLanguage()
      expect(result).toEqual(mockResult)
    })

    it('should perform detection if cache is stale', async () => {
      // Mock cache with old result
      const oldResult = {
        language: 'en' as const,
        confidence: 0.9,
        method: 'browser' as const,
        timestamp: Date.now() - 25 * 60 * 60 * 1000, // 25 hours ago
      }

      ;(service as any).cache.set('language-detection:with-pref', oldResult)

      const result = await service.detectLanguage()
      expect(result.language).toBe('en')
      expect(result.method).toBe('browser')
    })

    it('should ignore stored preference when requested', async () => {
      const mockLocalStorage = {
        getItem: vi.fn().mockReturnValue('ja'),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      }

      Object.defineProperty(global, 'localStorage', {
        value: mockLocalStorage,
        writable: true,
      })

      Object.defineProperty(global, 'navigator', {
        value: { ...mockNavigator, languages: ['zh-CN'], language: 'zh-CN' },
        writable: true,
      })

      const result = await service.detectLanguage({ ignoreStoredPreference: true })
      expect(result.language).toBe('zh-CN')
      expect(result.method).toBe('browser')
    })
  })

  describe('browser language detection', () => {
    it('should detect exact language match', () => {
      const result = (service as any).detectBrowserLanguage()
      expect(result.language).toBe('en')
      expect(result.confidence).toBeGreaterThan(0.8)
      expect(result.method).toBe('browser')
    })

    it('should handle language prefix matching', () => {
      // Mock navigator with 'zh' language
      Object.defineProperty(global, 'navigator', {
        value: { ...mockNavigator, languages: ['zh'], language: 'zh' },
        writable: true,
      })

      const result = (service as any).detectBrowserLanguage()
      expect(result.language).toBe('zh-CN')
      expect(result.confidence).toBeGreaterThan(0.6)
    })

    it('should handle region-specific matching', () => {
      // Mock navigator with 'zh-TW' language
      Object.defineProperty(global, 'navigator', {
        value: { ...mockNavigator, languages: ['zh-TW'], language: 'zh-TW' },
        writable: true,
      })

      const result = (service as any).detectBrowserLanguage()
      expect(result.language).toBe('zh-TW')
      expect(result.confidence).toBeGreaterThan(0.8)
    })
  })

  describe('geolocation detection', () => {
    it('should detect language from timezone', async () => {
      const result = await (service as any).detectByGeolocation()
      expect(result.language).toBe('en')
      expect(result.confidence).toBe(0.75)
      expect(result.method).toBe('geolocation')
    })

    it('should handle different timezones', async () => {
      // Mock different timezone
      Object.defineProperty(global, 'Intl', {
        value: {
          DateTimeFormat: () => ({
            resolvedOptions: () => ({ timeZone: 'Asia/Shanghai' }),
          }),
        },
        writable: true,
      })

      const result = await (service as any).detectByGeolocation()
      expect(result.language).toBe('zh-CN')
    })
  })

  describe('user agent detection', () => {
    it('should detect language from user agent', () => {
      // Mock user agent with Japanese
      Object.defineProperty(global, 'navigator', {
        value: { ...mockNavigator, userAgent: 'Mozilla/5.0 (ja) AppleWebKit/537.36' },
        writable: true,
      })

      const result = (service as any).detectByUserAgent()
      expect(result.language).toBe('ja')
      expect(result.confidence).toBe(0.6)
      expect(result.method).toBe('user_agent')
    })

    it('should handle navigator properties', () => {
      // Mock navigator with userLanguage
      Object.defineProperty(global, 'navigator', {
        value: { ...mockNavigator, userLanguage: 'ja' },
        writable: true,
      })

      const result = (service as any).detectByUserAgent()
      expect(result.language).toBe('ja')
    })
  })

  describe('stored preference', () => {
    it('should return stored preference if available', () => {
      // Mock localStorage with stored preference
      const mockLocalStorage = {
        getItem: vi.fn().mockReturnValue('ja'),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      }

      Object.defineProperty(global, 'localStorage', {
        value: mockLocalStorage,
        writable: true,
      })

      const result = (service as any).getStoredPreference()
      expect(result).toBe('ja')
    })

    it('should return null if no stored preference', () => {
      // Mock localStorage without stored preference
      const mockLocalStorage = {
        getItem: vi.fn().mockReturnValue(null),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      }

      Object.defineProperty(global, 'localStorage', {
        value: mockLocalStorage,
        writable: true,
      })

      const result = (service as any).getStoredPreference()
      expect(result).toBeNull()
    })
  })

  describe('utility methods', () => {
    it('should check if language is supported', () => {
      expect((service as any).isSupportedLanguage('zh-CN')).toBe(true)
      expect((service as any).isSupportedLanguage('zh-TW')).toBe(true)
      expect((service as any).isSupportedLanguage('en')).toBe(true)
      expect((service as any).isSupportedLanguage('ja')).toBe(true)
      expect((service as any).isSupportedLanguage('fr')).toBe(false)
    })

    it('should normalize language codes', () => {
      expect((service as any).normalizeLanguageCode('zh-CN')).toBe('zh-CN')
      expect((service as any).normalizeLanguageCode('zh')).toBe('zh-CN')
      expect((service as any).normalizeLanguageCode('en-US')).toBe('en')
      expect((service as any).normalizeLanguageCode('invalid')).toBeNull()
    })

    it('should get detection statistics', () => {
      const stats = service.getDetectionStats()
      expect(stats).toHaveProperty('cacheSize')
      expect(stats).toHaveProperty('lastDetection')
    })
  })

  describe('error handling', () => {
    it('should handle detection errors gracefully', async () => {
      // Mock navigator to throw error
      Object.defineProperty(global, 'navigator', {
        value: {
          get languages() {
            throw new Error('Test error')
          },
          language: 'en',
        },
        writable: true,
      })

      const result = await service.detectLanguage()
      expect(result.language).toBe('zh-CN') // Should fallback to default
      expect(result.confidence).toBe(0.5)
      expect(result.method).toBe('default')
    })
  })
})
