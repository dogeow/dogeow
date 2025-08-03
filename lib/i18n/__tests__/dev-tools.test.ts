import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { validateAllTranslations, checkTranslationKeys, logTranslationStats } from '../dev-tools'

// Mock the utils module
vi.mock('../utils', () => ({
  validateTranslations: vi.fn(),
  getAllTranslationKeys: vi.fn(),
  hasTranslationKey: vi.fn(),
}))

import { validateTranslations, getAllTranslationKeys, hasTranslationKey } from '../utils'

describe('dev-tools', () => {
  let originalNodeEnv: string | undefined
  let consoleSpy: {
    log: ReturnType<typeof vi.spyOn>
    group: ReturnType<typeof vi.spyOn>
    groupEnd: ReturnType<typeof vi.spyOn>
    warn: ReturnType<typeof vi.spyOn>
  }

  beforeEach(() => {
    originalNodeEnv = process.env.NODE_ENV
    consoleSpy = {
      log: vi.spyOn(console, 'log').mockImplementation(() => {}),
      group: vi.spyOn(console, 'group').mockImplementation(() => {}),
      groupEnd: vi.spyOn(console, 'groupEnd').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
    }
  })

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv
    Object.values(consoleSpy).forEach(spy => spy.mockRestore())
    vi.clearAllMocks()
  })

  describe('validateAllTranslations', () => {
    it('should skip validation in production', () => {
      process.env.NODE_ENV = 'production'

      const result = validateAllTranslations()

      expect(consoleSpy.log).toHaveBeenCalledWith(
        '[i18n] Translation validation skipped in production'
      )
      expect(getAllTranslationKeys).not.toHaveBeenCalled()
      expect(validateTranslations).not.toHaveBeenCalled()
      expect(result).toBeUndefined()
    })

    it('should validate all translations in development with valid results', () => {
      process.env.NODE_ENV = 'development'
      const mockKeys = ['nav.home', 'nav.about', 'common.save']
      const mockValidation = {
        isValid: true,
        missingTranslations: [],
      }

      vi.mocked(getAllTranslationKeys).mockReturnValue(mockKeys)
      vi.mocked(validateTranslations).mockReturnValue(mockValidation)

      const result = validateAllTranslations()

      expect(consoleSpy.group).toHaveBeenCalledWith('[i18n] Full Translation Validation')
      expect(consoleSpy.log).toHaveBeenCalledWith('Found 3 translation keys to validate')
      expect(consoleSpy.log).toHaveBeenCalledWith('✅ All translations are complete!')
      expect(consoleSpy.groupEnd).toHaveBeenCalled()
      expect(getAllTranslationKeys).toHaveBeenCalled()
      expect(validateTranslations).toHaveBeenCalledWith(mockKeys)
      expect(result).toEqual(mockValidation)
    })

    it('should report missing translations in development', () => {
      process.env.NODE_ENV = 'development'
      const mockKeys = ['nav.home', 'nav.about']
      const mockValidation = {
        isValid: false,
        missingTranslations: [
          { key: 'nav.home', language: 'en' },
          { key: 'nav.about', language: 'en' },
          { key: 'nav.home', language: 'ja' },
        ],
      }

      vi.mocked(getAllTranslationKeys).mockReturnValue(mockKeys)
      vi.mocked(validateTranslations).mockReturnValue(mockValidation)

      const result = validateAllTranslations()

      expect(consoleSpy.log).toHaveBeenCalledWith('❌ Found 3 missing translations')
      expect(consoleSpy.group).toHaveBeenCalledWith('Missing in en (2 keys):')
      expect(consoleSpy.log).toHaveBeenCalledWith('  - nav.home')
      expect(consoleSpy.log).toHaveBeenCalledWith('  - nav.about')
      expect(consoleSpy.group).toHaveBeenCalledWith('Missing in ja (1 keys):')
      expect(consoleSpy.log).toHaveBeenCalledWith('  - nav.home')
      expect(result).toEqual(mockValidation)
    })
  })

  describe('checkTranslationKeys', () => {
    it('should skip check in production and return all keys as existing', () => {
      process.env.NODE_ENV = 'production'
      const keys = ['nav.home', 'nav.about']

      const result = checkTranslationKeys(keys)

      expect(hasTranslationKey).not.toHaveBeenCalled()
      expect(result).toEqual([
        { key: 'nav.home', exists: true },
        { key: 'nav.about', exists: true },
      ])
    })

    it('should check translation keys in development with all existing', () => {
      process.env.NODE_ENV = 'development'
      const keys = ['nav.home', 'nav.about']

      vi.mocked(hasTranslationKey).mockReturnValue(true)

      const result = checkTranslationKeys(keys)

      expect(hasTranslationKey).toHaveBeenCalledTimes(2)
      expect(hasTranslationKey).toHaveBeenCalledWith('nav.home')
      expect(hasTranslationKey).toHaveBeenCalledWith('nav.about')
      expect(result).toEqual([
        { key: 'nav.home', exists: true },
        { key: 'nav.about', exists: true },
      ])
      expect(consoleSpy.group).not.toHaveBeenCalled()
    })

    it('should report missing keys in development', () => {
      process.env.NODE_ENV = 'development'
      const keys = ['nav.home', 'nav.missing', 'nav.about']

      vi.mocked(hasTranslationKey)
        .mockReturnValueOnce(true) // nav.home exists
        .mockReturnValueOnce(false) // nav.missing doesn't exist
        .mockReturnValueOnce(true) // nav.about exists

      const result = checkTranslationKeys(keys)

      expect(consoleSpy.group).toHaveBeenCalledWith('[i18n] Translation Key Check')
      expect(consoleSpy.warn).toHaveBeenCalledWith('1 translation keys are missing:')
      expect(consoleSpy.warn).toHaveBeenCalledWith('  - nav.missing')
      expect(consoleSpy.groupEnd).toHaveBeenCalled()
      expect(result).toEqual([
        { key: 'nav.home', exists: true },
        { key: 'nav.missing', exists: false },
        { key: 'nav.about', exists: true },
      ])
    })

    it('should handle multiple missing keys', () => {
      process.env.NODE_ENV = 'development'
      const keys = ['nav.missing1', 'nav.missing2']

      vi.mocked(hasTranslationKey).mockReturnValue(false)

      const result = checkTranslationKeys(keys)

      expect(consoleSpy.warn).toHaveBeenCalledWith('2 translation keys are missing:')
      expect(consoleSpy.warn).toHaveBeenCalledWith('  - nav.missing1')
      expect(consoleSpy.warn).toHaveBeenCalledWith('  - nav.missing2')
      expect(result).toEqual([
        { key: 'nav.missing1', exists: false },
        { key: 'nav.missing2', exists: false },
      ])
    })
  })

  describe('logTranslationStats', () => {
    it('should skip logging in production', () => {
      process.env.NODE_ENV = 'production'

      logTranslationStats()

      expect(getAllTranslationKeys).not.toHaveBeenCalled()
      expect(consoleSpy.group).not.toHaveBeenCalled()
    })

    it('should log translation statistics in development', () => {
      process.env.NODE_ENV = 'development'
      const mockKeys = [
        'nav.home',
        'nav.about',
        'nav.contact',
        'common.save',
        'common.cancel',
        'settings.theme',
        'settings.language',
      ]

      vi.mocked(getAllTranslationKeys).mockReturnValue(mockKeys)

      logTranslationStats()

      expect(consoleSpy.group).toHaveBeenCalledWith('[i18n] Translation Statistics')
      expect(consoleSpy.log).toHaveBeenCalledWith('Total translation keys: 7')
      expect(consoleSpy.log).toHaveBeenCalledWith('Keys by namespace:')
      expect(consoleSpy.log).toHaveBeenCalledWith('  nav: 3 keys')
      expect(consoleSpy.log).toHaveBeenCalledWith('  common: 2 keys')
      expect(consoleSpy.log).toHaveBeenCalledWith('  settings: 2 keys')
      expect(consoleSpy.groupEnd).toHaveBeenCalled()
    })

    it('should handle keys without namespaces', () => {
      process.env.NODE_ENV = 'development'
      const mockKeys = ['standalone', 'nav.home', 'another']

      vi.mocked(getAllTranslationKeys).mockReturnValue(mockKeys)

      logTranslationStats()

      expect(consoleSpy.log).toHaveBeenCalledWith('Total translation keys: 3')
      expect(consoleSpy.log).toHaveBeenCalledWith('  standalone: 1 keys')
      expect(consoleSpy.log).toHaveBeenCalledWith('  nav: 1 keys')
      expect(consoleSpy.log).toHaveBeenCalledWith('  another: 1 keys')
    })

    it('should sort namespaces by count in descending order', () => {
      process.env.NODE_ENV = 'development'
      const mockKeys = ['a.1', 'b.1', 'b.2', 'b.3', 'c.1', 'c.2']

      vi.mocked(getAllTranslationKeys).mockReturnValue(mockKeys)

      logTranslationStats()

      // Should be sorted: b (3), c (2), a (1)
      const logCalls = consoleSpy.log.mock.calls
      const namespaceCalls = logCalls.filter(call => call[0] && call[0].includes(' keys'))

      // Debug what's actually being logged
      console.log(
        'All log calls:',
        logCalls.map(call => call[0])
      )
      console.log(
        'Namespace calls:',
        namespaceCalls.map(call => call[0])
      )

      expect(namespaceCalls.length).toBeGreaterThanOrEqual(3)
      // Find the specific namespace calls we expect
      const bCall = namespaceCalls.find(call => call[0].includes('b: 3 keys'))
      const cCall = namespaceCalls.find(call => call[0].includes('c: 2 keys'))
      const aCall = namespaceCalls.find(call => call[0].includes('a: 1 keys'))

      expect(bCall).toBeDefined()
      expect(cCall).toBeDefined()
      expect(aCall).toBeDefined()
    })
  })
})
